import { query, queryOne } from '@/lib/db';
import type { PosProductItem } from './types';

/**
 * Consulta el catálogo de productos disponibles para la venta en el POS.
 * Incluye presentaciones, stock en tiempo real por lote y alternativas genéricas.
 */
export async function obtenerProductosPos(sucursalId?: string): Promise<PosProductItem[]> {
  const sql = `
    select 
      p.id as producto_id,
      p.id,
      p.codigo_interno,
      p.nombre_comercial,
      p.nombre_generico,
      p.concentracion,
      l.nombre as laboratorio,
      p.condicion_venta,
      p.es_controlado,
      p.es_generico,
      p.tipo_afectacion_igv,
      p.unidad_base,
      coalesce(
        (
          select sum(sl.cantidad_base)
            from public.stock_lotes sl
            join public.lotes lt on lt.id = sl.lote_id
           where sl.producto_id = p.id
             and sl.estado = 'disponible'
             and lt.fecha_vencimiento > current_date
        ), 0
      )::integer as stock_disponible_base,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', pp.id,
              'nombre', pp.nombre,
              'factor_base', pp.factor_base,
              'codigo_barras', pp.codigo_barras,
              'precio_venta', pp.precio_venta::numeric,
              'es_default', pp.es_default
            ) order by pp.factor_base asc
          )
          from public.producto_presentaciones pp
          where pp.producto_id = p.id and pp.activo = true
        ), '[]'::json
      ) as presentaciones
    from public.productos p
    left join public.laboratorios l on l.id = p.laboratorio_id
    where p.activo = true
    order by p.nombre_comercial asc;
  `;

  try {
    const rows = await query(sql);

    const mappedProducts: PosProductItem[] = rows
      .map((r) => ({
        id: r.id,
        producto_id: r.producto_id,
        codigo_interno: r.codigo_interno,
        nombre_comercial: r.nombre_comercial,
        nombre_generico: r.nombre_generico,
        concentracion: r.concentracion,
        laboratorio: r.laboratorio || 'Genérico / Varios',
        condicion_venta: r.condicion_venta,
        es_controlado: r.es_controlado,
        es_generico: r.es_generico,
        tipo_afectacion_igv: r.tipo_afectacion_igv,
        unidad_base: r.unidad_base,
        stock_disponible_base: Number(r.stock_disponible_base),
        presentaciones: Array.isArray(r.presentaciones) ? r.presentaciones : [],
      }))
      .sort((a, b) => {
        // Priorizar medicamentos con stock físico disponible
        const stockDiff = (b.stock_disponible_base > 0 ? 1 : 0) - (a.stock_disponible_base > 0 ? 1 : 0);
        if (stockDiff !== 0) return stockDiff;
        return a.nombre_comercial.localeCompare(b.nombre_comercial);
      });

    // Búsqueda cruzada dinámica de alternativas genéricas DCI (Regulación DIGEMID)
    const genericosDisponibles = mappedProducts.filter(
      (p) => p.es_generico && p.stock_disponible_base > 0 && p.presentaciones.length > 0
    );

    return mappedProducts.map((p) => {
      if (p.es_generico || !p.nombre_generico) {
        return p;
      }

      const pGenNorm = p.nombre_generico.toLowerCase().trim();
      const pConcNorm = (p.concentracion || '').toLowerCase().trim();
      const pPrecio = p.presentaciones[0]?.precio_venta || 0;

      // Buscar si existe un equivalente DCI genérico disponible
      const genericMatch = genericosDisponibles.find((g) => {
        const gGenNorm = (g.nombre_generico || '').toLowerCase().trim();
        const gConcNorm = (g.concentracion || '').toLowerCase().trim();
        const sameGen = gGenNorm === pGenNorm || p.nombre_comercial.toLowerCase().includes(gGenNorm);
        const sameConc = !pConcNorm || !gConcNorm || gConcNorm === pConcNorm;
        return sameGen && sameConc;
      });

      if (genericMatch) {
        const gDefaultPres = genericMatch.presentaciones[0];
        const gPrecio = gDefaultPres?.precio_venta || 0;
        const ahorro = pPrecio > gPrecio ? Math.round(((pPrecio - gPrecio) / pPrecio) * 100) : 0;

        return {
          ...p,
          alternativa_generica: {
            producto_id: genericMatch.producto_id,
            codigo_interno: genericMatch.codigo_interno,
            nombre_comercial: genericMatch.nombre_comercial,
            nombre_generico: genericMatch.nombre_generico || genericMatch.nombre_comercial,
            concentracion: genericMatch.concentracion,
            laboratorio: genericMatch.laboratorio,
            precio_venta: gPrecio,
            ahorro_porcentaje: ahorro,
            stock_disponible_base: genericMatch.stock_disponible_base,
            presentacion_id: gDefaultPres?.id || '',
            presentacion_nombre: gDefaultPres?.nombre || 'Unidad',
          },
        };
      }

      return p;
    });
  } catch (error) {
    console.error('Error al consultar productos POS de la base de datos:', error);
    return [];
  }
}

/**
 * Consulta el estado del turno de caja activo para la terminal o usuario.
 */
export async function obtenerTurnoActivo(usuarioId?: string) {
  const params: any[] = [];
  let userClause = '';
  if (usuarioId) {
    params.push(usuarioId);
    userClause = `and tc.usuario_id = $${params.length}`;
  }

  const sql = `
    select 
      tc.id as turno_id,
      tc.caja_id,
      tc.usuario_id,
      tc.monto_apertura::numeric as monto_apertura,
      to_char(tc.apertura_at, 'DD/MM/YYYY HH24:MI') as apertura_at,
      c.nombre as caja_nombre,
      p.nombres || ' ' || p.apellidos as cajero_nombre,
      s.nombre as sucursal_nombre
    from public.turnos_caja tc
    join public.cajas c on c.id = tc.caja_id
    join public.perfiles p on p.id = tc.usuario_id
    join public.sucursales s on s.id = tc.sucursal_id
    where tc.estado = 'abierto'
    ${userClause}
    order by tc.apertura_at desc
    limit 1;
  `;

  try {
    return await queryOne(sql, params);
  } catch (error) {
    console.error('Error al consultar turno activo:', error);
    return null;
  }
}
