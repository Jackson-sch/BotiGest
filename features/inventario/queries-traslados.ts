import { query, queryOne } from '@/lib/db';

export interface TransferenciaItem {
  id: string;
  transferencia_id: string;
  producto_id: string;
  nombre_comercial: string;
  concentracion?: string;
  lote_id: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  cantidad_recibida: number;
}

export interface Transferencia {
  id: string;
  sucursal_origen_id: string;
  origen_nombre: string;
  sucursal_destino_id: string;
  destino_nombre: string;
  numero_guia?: string;
  estado: 'borrador' | 'en_transito' | 'recibida' | 'anulada';
  motivo?: string;
  observaciones?: string;
  fecha_solicitud: string;
  fecha_despacho?: string;
  fecha_recepcion?: string;
  items_count: number;
  items?: TransferenciaItem[];
}

export async function obtenerTransferencias(sucursalId?: string): Promise<Transferencia[]> {
  try {
    const params: any[] = [];
    let filterClause = '';
    if (sucursalId) {
      params.push(sucursalId);
      filterClause = `WHERE t.sucursal_origen_id = $1 OR t.sucursal_destino_id = $1`;
    }

    const sql = `
      SELECT 
        t.id,
        t.sucursal_origen_id,
        so.nombre as origen_nombre,
        t.sucursal_destino_id,
        sd.nombre as destino_nombre,
        t.numero_guia,
        t.estado,
        t.motivo,
        t.observaciones,
        to_char(t.fecha_solicitud, 'YYYY-MM-DD HH24:MI') as fecha_solicitud,
        to_char(t.fecha_despacho, 'YYYY-MM-DD HH24:MI') as fecha_despacho,
        to_char(t.fecha_recepcion, 'YYYY-MM-DD HH24:MI') as fecha_recepcion,
        count(ti.id)::int as items_count
      FROM public.transferencias t
      JOIN public.sucursales so ON so.id = t.sucursal_origen_id
      JOIN public.sucursales sd ON sd.id = t.sucursal_destino_id
      LEFT JOIN public.transferencia_items ti ON ti.transferencia_id = t.id
      ${filterClause}
      GROUP BY t.id, so.nombre, sd.nombre
      ORDER BY t.created_at DESC;
    `;

    return await query<Transferencia>(sql, params);
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    return [];
  }
}

export async function obtenerDetalleTransferencia(id: string): Promise<Transferencia | null> {
  try {
    const sqlHead = `
      SELECT 
        t.id,
        t.sucursal_origen_id,
        so.nombre as origen_nombre,
        t.sucursal_destino_id,
        sd.nombre as destino_nombre,
        t.numero_guia,
        t.estado,
        t.motivo,
        t.observaciones,
        to_char(t.fecha_solicitud, 'YYYY-MM-DD HH24:MI') as fecha_solicitud,
        to_char(t.fecha_despacho, 'YYYY-MM-DD HH24:MI') as fecha_despacho,
        to_char(t.fecha_recepcion, 'YYYY-MM-DD HH24:MI') as fecha_recepcion,
        0 as items_count
      FROM public.transferencias t
      JOIN public.sucursales so ON so.id = t.sucursal_origen_id
      JOIN public.sucursales sd ON sd.id = t.sucursal_destino_id
      WHERE t.id = $1;
    `;
    const header = await queryOne<Transferencia>(sqlHead, [id]);
    if (!header) return null;

    const sqlItems = `
      SELECT 
        ti.id,
        ti.transferencia_id,
        ti.producto_id,
        p.nombre_comercial,
        p.concentracion,
        ti.lote_id,
        l.numero_lote,
        to_char(l.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
        ti.cantidad_solicitada,
        ti.cantidad_despachada,
        ti.cantidad_recibida
      FROM public.transferencia_items ti
      JOIN public.productos p ON p.id = ti.producto_id
      JOIN public.lotes l ON l.id = ti.lote_id
      WHERE ti.transferencia_id = $1;
    `;
    const items = await query<TransferenciaItem>(sqlItems, [id]);
    header.items = items;
    header.items_count = items.length;
    return header;
  } catch (error) {
    console.error('Error al obtener detalle de transferencia:', error);
    return null;
  }
}
