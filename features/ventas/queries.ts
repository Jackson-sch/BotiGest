import { query, queryOne } from '@/lib/db';
import type { VentaCompleta } from './types';

/**
 * Consulta el historial de comprobantes de ventas emitidos.
 */
export async function obtenerHistorialVentas(): Promise<VentaCompleta[]> {
  const sql = `
    select 
      v.id,
      v.tipo_comprobante,
      v.serie,
      v.numero,
      v.serie || '-' || lpad(v.numero::text, 6, '0') as correlativo,
      to_char(v.fecha_emision, 'DD/MM/YYYY HH24:MI') as fecha_emision,
      cl.numero_documento as cliente_documento,
      coalesce(cl.nombres, 'Clientes Varios') as cliente_nombre,
      v.total::numeric as total,
      v.igv::numeric as igv,
      v.estado,
      coalesce(ce.estado, 'aceptado') as estado_sunat,
      ce.mensaje_sunat,
      perf.nombres || ' ' || perf.apellidos as vendedor_nombre,
      c.nombre as caja_nombre,
      v.requiere_receta,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', vi.id,
              'producto_nombre', vi.descripcion,
              'presentacion', '',
              'cantidad', vi.cantidad,
              'precio_unitario', vi.precio_unitario::numeric,
              'descuento', vi.descuento::numeric,
              'total', vi.total::numeric,
              'tipo_afectacion_igv', vi.tipo_afectacion_igv,
              'lotes_despachados', '[]'::json
            )
          )
          from public.venta_items vi
          where vi.venta_id = v.id
        ), '[]'::json
      ) as items,
      json_build_array(
        json_build_object('metodo', 'efectivo', 'monto', v.total::numeric)
      ) as pagos,
      case 
        when r.id is not null then
          json_build_object(
            'medico_cmp', r.medico_cmp,
            'medico_nombre', r.medico_nombre,
            'paciente_nombre', r.paciente_nombre,
            'numero_receta', r.numero_receta,
            'retenida', r.retenida
          )
        else null
      end as receta,
      case 
        when ce.id is not null then
          json_build_object(
            'hash', ce.hash,
            'codigo_sunat', ce.codigo_sunat,
            'mensaje_sunat', ce.mensaje_sunat
          )
        else null
      end as comprobante_electronico
    from public.ventas v
    join public.cajas c on c.id = v.caja_id
    join public.perfiles perf on perf.id = v.vendedor_id
    left join public.clientes cl on cl.id = v.cliente_id
    left join public.comprobantes_electronicos ce on ce.venta_id = v.id
    left join public.recetas r on r.venta_id = v.id
    order by v.fecha_emision desc
    limit 100;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      tipo_comprobante: r.tipo_comprobante,
      serie: r.serie,
      numero: Number(r.numero),
      correlativo: r.correlativo,
      fecha_emision: r.fecha_emision,
      cliente_documento: r.cliente_documento,
      cliente_nombre: r.cliente_nombre,
      total: Number(r.total),
      igv: Number(r.igv),
      estado: r.estado,
      estado_sunat: r.estado_sunat,
      mensaje_sunat: r.mensaje_sunat,
      vendedor_nombre: r.vendedor_nombre,
      caja_nombre: r.caja_nombre,
      requiere_receta: Boolean(r.requiere_receta),
      items: Array.isArray(r.items) ? r.items : [],
      pagos: Array.isArray(r.pagos) ? r.pagos : [],
      receta: r.receta,
      comprobante_electronico: r.comprobante_electronico,
    }));
  } catch (error) {
    console.error('Error al consultar historial de ventas:', error);
    return [];
  }
}
