import { query } from '@/lib/db';
import type { ProductoItem, PresentacionItem, CatalogoAuxiliares } from './types';

export async function getProductos(filters?: {
  search?: string;
  condicion?: string;
  soloActivos?: boolean;
}): Promise<ProductoItem[]> {
  try {
    let sql = `
      select 
        p.id,
        p.codigo_interno,
        p.nombre_comercial,
        p.nombre_generico,
        p.concentracion,
        p.forma_farmaceutica_id,
        ff.nombre as forma_farmaceutica_nombre,
        p.laboratorio_id,
        l.nombre as laboratorio_nombre,
        p.categoria_id,
        c.nombre as categoria_nombre,
        p.tipo_producto,
        p.registro_sanitario,
        p.condicion_venta,
        p.es_controlado,
        p.es_generico,
        p.requiere_cadena_frio,
        p.unidad_base,
        p.unidad_medida_sunat,
        p.tipo_afectacion_igv,
        p.costo_ultimo::float as costo_ultimo,
        p.costo_promedio::float as costo_promedio,
        p.activo,
        coalesce(sum(sl.cantidad_base), 0)::int as total_stock
      from public.productos p
      left join public.formas_farmaceuticas ff on ff.id = p.forma_farmaceutica_id
      left join public.laboratorios l on l.id = p.laboratorio_id
      left join public.categorias c on c.id = p.categoria_id
      left join public.stock_lotes sl on sl.producto_id = p.id
      where 1 = 1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.soloActivos) {
      sql += ` and p.activo = true`;
    }

    if (filters?.condicion && filters.condicion !== 'todas') {
      sql += ` and p.condicion_venta = $${paramIndex++}`;
      params.push(filters.condicion);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      sql += ` and (
        lower(p.nombre_comercial) like $${paramIndex} or 
        lower(coalesce(p.nombre_generico, '')) like $${paramIndex} or 
        lower(p.codigo_interno) like $${paramIndex} or 
        lower(coalesce(p.registro_sanitario, '')) like $${paramIndex}
      )`;
      params.push(term);
      paramIndex++;
    }

    sql += ` group by p.id, ff.nombre, l.nombre, c.nombre order by p.nombre_comercial asc`;

    const productosRows = await query<any>(sql, params);

    // Obtener presentaciones para todos los productos
    const presentacionesRows = await query<any>(`
      select 
        id, producto_id, nombre, factor_base, codigo_barras, 
        precio_venta::float as precio_venta, es_default, activo
      from public.producto_presentaciones
      order by factor_base asc
    `);

    const presMap = new Map<string, PresentacionItem[]>();
    for (const pr of presentacionesRows) {
      if (!presMap.has(pr.producto_id)) {
        presMap.set(pr.producto_id, []);
      }
      presMap.get(pr.producto_id)!.push({
        id: pr.id,
        producto_id: pr.producto_id,
        nombre: pr.nombre,
        factor_base: pr.factor_base,
        codigo_barras: pr.codigo_barras,
        precio_venta: pr.precio_venta,
        es_default: pr.es_default,
        activo: pr.activo,
      });
    }

    return productosRows.map((p) => ({
      ...p,
      presentaciones: presMap.get(p.id) || [],
    }));
  } catch (err) {
    console.error('Error en getProductos:', err);
    return [];
  }
}

export async function getCatalogoAuxiliares(): Promise<CatalogoAuxiliares> {
  try {
    const [labs, formas, cats] = await Promise.all([
      query<{ id: string; nombre: string }>(`select id, nombre from public.laboratorios where activo = true order by nombre asc`),
      query<{ id: number; nombre: string; abreviatura: string | null }>(`select id, nombre, abreviatura from public.formas_farmaceuticas order by nombre asc`),
      query<{ id: string; nombre: string }>(`select id, nombre from public.categorias order by nombre asc`),
    ]);

    return {
      laboratorios: labs,
      formas: formas,
      categorias: cats,
    };
  } catch (err) {
    console.error('Error en getCatalogoAuxiliares:', err);
    return { laboratorios: [], formas: [], categorias: [] };
  }
}

export async function getProductoById(id: string): Promise<ProductoItem | null> {
  try {
    const rows = await query<any>(
      `
      select 
        p.id,
        p.codigo_interno,
        p.nombre_comercial,
        p.nombre_generico,
        p.concentracion,
        p.forma_farmaceutica_id,
        ff.nombre as forma_farmaceutica_nombre,
        p.laboratorio_id,
        l.nombre as laboratorio_nombre,
        p.categoria_id,
        c.nombre as categoria_nombre,
        p.tipo_producto,
        p.registro_sanitario,
        p.condicion_venta,
        p.es_controlado,
        p.es_generico,
        p.requiere_cadena_frio,
        p.unidad_base,
        p.unidad_medida_sunat,
        p.tipo_afectacion_igv,
        p.costo_ultimo::float as costo_ultimo,
        p.costo_promedio::float as costo_promedio,
        p.activo,
        coalesce(sum(sl.cantidad_base), 0)::int as total_stock
      from public.productos p
      left join public.formas_farmaceuticas ff on ff.id = p.forma_farmaceutica_id
      left join public.laboratorios l on l.id = p.laboratorio_id
      left join public.categorias c on c.id = p.categoria_id
      left join public.stock_lotes sl on sl.producto_id = p.id
      where p.id = $1
      group by p.id, ff.nombre, l.nombre, c.nombre
      `,
      [id]
    );

    if (!rows || rows.length === 0) return null;

    const presentacionesRows = await query<any>(
      `
      select 
        id, producto_id, nombre, factor_base, codigo_barras, 
        precio_venta::float as precio_venta, es_default, activo
      from public.producto_presentaciones
      where producto_id = $1
      order by factor_base asc
      `,
      [id]
    );

    return {
      ...rows[0],
      presentaciones: presentacionesRows.map((pr: any) => ({
        id: pr.id,
        producto_id: pr.producto_id,
        nombre: pr.nombre,
        factor_base: pr.factor_base,
        codigo_barras: pr.codigo_barras,
        precio_venta: pr.precio_venta,
        es_default: pr.es_default,
        activo: pr.activo,
      })),
    };
  } catch (err) {
    console.error('Error en getProductoById:', err);
    return null;
  }
}

