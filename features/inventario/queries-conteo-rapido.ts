import { query } from '@/lib/db';

export async function obtenerDetalleTomaInventarioConBarras(tomaId: string) {
  try {
    const sql = `
      SELECT 
        ti.id,
        ti.producto_id,
        p.codigo_interno,
        p.nombre_comercial,
        p.concentracion,
        p.unidad_base,
        pp.codigo_barras,
        l.numero_lote,
        to_char(l.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
        ti.lote_id,
        ti.stock_sistema,
        ti.stock_fisico,
        ti.diferencia,
        ti.costo_promedio::numeric as costo_promedio,
        ti.justificacion
      FROM public.inventario_toma_items ti
      JOIN public.productos p ON p.id = ti.producto_id
      JOIN public.lotes l ON l.id = ti.lote_id
      LEFT JOIN public.producto_presentaciones pp ON pp.producto_id = p.id AND pp.es_default = true
      WHERE ti.toma_id = $1
      ORDER BY p.nombre_comercial ASC, l.fecha_vencimiento ASC;
    `;
    return await query<any>(sql, [tomaId]);
  } catch (error) {
    console.error('Error al obtener detalle con código de barras:', error);
    return [];
  }
}
