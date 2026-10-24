import { query, queryOne } from '@/lib/db';

export interface TomaInventarioItem {
  id: string;
  producto_id: string;
  nombre_comercial: string;
  concentracion?: string;
  numero_lote: string;
  lote_id: string;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  costo_promedio: number;
  justificacion?: string;
}

export interface TomaInventario {
  id: string;
  codigo: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  estado: 'en_progreso' | 'aplicado' | 'anulado';
  responsable_nombre?: string;
  observaciones?: string;
  fecha_inicio: string;
  fecha_cierre?: string;
  total_items: number;
  diferencia_total: number;
  items?: TomaInventarioItem[];
}

export async function obtenerTomasInventario(sucursalId?: string): Promise<TomaInventario[]> {
  try {
    const params: any[] = [];
    let whereClause = '';
    if (sucursalId) {
      params.push(sucursalId);
      whereClause = `WHERE t.sucursal_id = $1`;
    }

    const sql = `
      SELECT 
        t.id,
        t.codigo,
        t.sucursal_id,
        s.nombre as sucursal_nombre,
        t.estado,
        concat(p.nombres, ' ', p.apellidos) as responsable_nombre,
        t.observaciones,
        to_char(t.fecha_inicio, 'YYYY-MM-DD HH24:MI') as fecha_inicio,
        to_char(t.fecha_cierre, 'YYYY-MM-DD HH24:MI') as fecha_cierre,
        count(ti.id)::int as total_items,
        coalesce(sum(ti.diferencia), 0)::int as diferencia_total
      FROM public.inventario_tomas t
      JOIN public.sucursales s ON s.id = t.sucursal_id
      LEFT JOIN public.perfiles p ON p.id = t.responsable_id
      LEFT JOIN public.inventario_toma_items ti ON ti.toma_id = t.id
      ${whereClause}
      GROUP BY t.id, s.nombre, p.nombres, p.apellidos
      ORDER BY t.created_at DESC;
    `;

    return await query<TomaInventario>(sql, params);
  } catch (error) {
    console.error('Error al obtener tomas de inventario:', error);
    return [];
  }
}

export async function obtenerDetalleTomaInventario(tomaId: string): Promise<TomaInventarioItem[]> {
  try {
    const sql = `
      SELECT 
        ti.id,
        ti.producto_id,
        p.nombre_comercial,
        p.concentracion,
        p.unidad_base,
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
      WHERE ti.toma_id = $1
      ORDER BY p.nombre_comercial ASC, l.fecha_vencimiento ASC;
    `;
    return await query<any>(sql, [tomaId]);
  } catch (error) {
    console.error('Error al obtener detalle de toma de inventario:', error);
    return [];
  }
}
