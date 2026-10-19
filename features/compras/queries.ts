import { query, queryOne } from '@/lib/db';
import type { CompraCompleta, Proveedor } from './types';

/**
 * Consulta el historial de compras a droguerías / proveedores.
 */
export async function obtenerHistorialCompras(): Promise<CompraCompleta[]> {
  const sql = `
    select 
      c.id,
      c.sucursal_id,
      s.nombre as sucursal_nombre,
      c.proveedor_id,
      p.ruc as proveedor_ruc,
      p.razon_social as proveedor_nombre,
      c.tipo_documento,
      c.serie_numero,
      to_char(c.fecha_emision, 'DD/MM/YYYY') as fecha_emision,
      case 
        when c.fecha_recepcion is not null then to_char(c.fecha_recepcion, 'DD/MM/YYYY')
        else null 
      end as fecha_recepcion,
      c.subtotal::numeric as subtotal,
      c.igv::numeric as igv,
      c.total::numeric as total,
      c.estado,
      'Almacén Central' as usuario_nombre,
      c.observacion,
      coalesce(
        (
          select count(*)::integer 
          from public.compra_items ci 
          where ci.compra_id = c.id
        ), 0
      ) as items_count,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', ci.id,
              'producto_id', ci.producto_id,
              'producto_nombre', prod.nombre_comercial,
              'presentacion_id', ci.presentacion_id,
              'presentacion_nombre', pres.nombre,
              'factor_base', ci.factor_base,
              'numero_lote', ci.numero_lote,
              'fecha_vencimiento', to_char(ci.fecha_vencimiento, 'YYYY-MM-DD'),
              'cantidad', ci.cantidad,
              'cantidad_base', (ci.cantidad * ci.factor_base),
              'costo_unitario_presentacion', ci.costo_unitario_presentacion::numeric,
              'costo_unitario_base', (ci.costo_unitario_presentacion / ci.factor_base)::numeric,
              'total_item', (ci.cantidad * ci.costo_unitario_presentacion)::numeric,
              'lote_id', ci.lote_id
            )
          )
          from public.compra_items ci
          join public.productos prod on prod.id = ci.producto_id
          join public.producto_presentaciones pres on pres.id = ci.presentacion_id
          where ci.compra_id = c.id
        ), '[]'::json
      ) as items
    from public.compras c
    join public.sucursales s on s.id = c.sucursal_id
    join public.proveedores p on p.id = c.proveedor_id
    order by c.created_at desc
    limit 100;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      sucursal_id: r.sucursal_id,
      sucursal_nombre: r.sucursal_nombre,
      proveedor_id: r.proveedor_id,
      proveedor_ruc: r.proveedor_ruc,
      proveedor_nombre: r.proveedor_nombre,
      tipo_documento: r.tipo_documento,
      serie_numero: r.serie_numero,
      fecha_emision: r.fecha_emision,
      fecha_recepcion: r.fecha_recepcion,
      subtotal: Number(r.subtotal),
      igv: Number(r.igv),
      total: Number(r.total),
      estado: r.estado,
      usuario_nombre: r.usuario_nombre,
      observacion: r.observacion,
      items_count: Number(r.items_count),
      items: Array.isArray(r.items) ? r.items : [],
    }));
  } catch (error) {
    console.error('Error al consultar historial de compras:', error);
    return [];
  }
}

/**
 * Consulta la lista de proveedores activos para formularios.
 */
export async function obtenerProveedoresActivos(): Promise<Proveedor[]> {
  const sql = `
    select 
      id,
      ruc,
      razon_social,
      contacto,
      telefono,
      email,
      direccion,
      activo
    from public.proveedores
    where activo = true
    order by razon_social asc;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      ruc: r.ruc,
      razon_social: r.razon_social,
      contacto: r.contacto,
      telefono: r.telefono,
      email: r.email,
      direccion: r.direccion,
      activo: Boolean(r.activo),
    }));
  } catch (error) {
    console.error('Error al consultar proveedores:', error);
    return [];
  }
}
