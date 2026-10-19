'use server';

import { query } from '@/lib/db';

export interface GlobalSearchResult {
  medicamentos: Array<{
    id: string;
    codigo_interno: string;
    nombre_comercial: string;
    nombre_generico: string | null;
    concentracion: string | null;
    laboratorio: string;
    stock: number;
    precio: number;
  }>;
  lotes: Array<{
    id: string;
    numero_lote: string;
    fecha_vencimiento: string;
    nombre_comercial: string;
    cantidad: number;
  }>;
  clientes: Array<{
    id: string;
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    telefono: string | null;
  }>;
}

export async function buscarGlobalAction(rawQuery: string): Promise<GlobalSearchResult> {
  const q = rawQuery.trim();
  if (!q || q.length < 2) {
    return { medicamentos: [], lotes: [], clientes: [] };
  }

  const searchTerm = `%${q.toLowerCase()}%`;

  try {
    // 1. Buscar Medicamentos en catálogo y presentaciones
    const medicamentosSql = `
      select 
        p.id,
        p.codigo_interno,
        p.nombre_comercial,
        p.nombre_generico,
        p.concentracion,
        coalesce(l.nombre, 'Varios') as laboratorio,
        coalesce(
          (
            select sum(sl.cantidad_base)
            from public.stock_lotes sl
            where sl.producto_id = p.id
              and sl.estado = 'disponible'
          ), 0
        )::integer as stock,
        coalesce(
          (
            select pp.precio_venta::float
            from public.producto_presentaciones pp
            where pp.producto_id = p.id and pp.activo = true
            order by pp.es_default desc, pp.factor_base asc
            limit 1
          ), 0
        )::float as precio
      from public.productos p
      left join public.laboratorios l on l.id = p.laboratorio_id
      where p.activo = true
        and (
          lower(p.nombre_comercial) like $1 or
          lower(coalesce(p.nombre_generico, '')) like $1 or
          lower(p.codigo_interno) like $1 or
          exists (
            select 1 from public.producto_presentaciones pp
            where pp.producto_id = p.id
              and pp.codigo_barras like $1
          )
        )
      order by stock desc, p.nombre_comercial asc
      limit 6;
    `;

    // 2. Buscar Lotes FEFO
    const lotesSql = `
      select 
        lt.id,
        lt.numero_lote,
        to_char(lt.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
        p.nombre_comercial,
        coalesce(sl.cantidad_base, 0)::integer as cantidad
      from public.lotes lt
      join public.productos p on p.id = lt.producto_id
      left join public.stock_lotes sl on sl.lote_id = lt.id
      where lower(lt.numero_lote) like $1
      order by lt.fecha_vencimiento asc
      limit 4;
    `;

    // 3. Buscar Clientes
    const clientesSql = `
      select 
        c.id,
        c.tipo_documento,
        c.numero_documento,
        c.nombres,
        c.telefono
      from public.clientes c
      where c.activo = true
        and (
          c.numero_documento like $1 or
          lower(c.nombres) like $1
        )
      order by c.nombres asc
      limit 4;
    `;

    const [meds, lotesRes, clientesRes] = await Promise.all([
      query(medicamentosSql, [searchTerm]),
      query(lotesSql, [searchTerm]),
      query(clientesSql, [searchTerm]),
    ]);

    return {
      medicamentos: meds.map((r: any) => ({
        id: r.id,
        codigo_interno: r.codigo_interno,
        nombre_comercial: r.nombre_comercial,
        nombre_generico: r.nombre_generico,
        concentracion: r.concentracion,
        laboratorio: r.laboratorio,
        stock: Number(r.stock) || 0,
        precio: Number(r.precio) || 0,
      })),
      lotes: lotesRes.map((r: any) => ({
        id: r.id,
        numero_lote: r.numero_lote,
        fecha_vencimiento: r.fecha_vencimiento,
        nombre_comercial: r.nombre_comercial,
        cantidad: Number(r.cantidad) || 0,
      })),
      clientes: clientesRes.map((r: any) => ({
        id: r.id,
        tipo_documento: r.tipo_documento,
        numero_documento: r.numero_documento,
        nombres: r.nombres,
        telefono: r.telefono,
      })),
    };
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return { medicamentos: [], lotes: [], clientes: [] };
  }
}
