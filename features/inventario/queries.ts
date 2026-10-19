import { query, queryOne } from '@/lib/db';
import type {
  LoteConStock,
  MovimientoKardex,
  AlertaVencimientoItem,
  ResumenInventario,
  EstadoLoteStock,
} from './types';

/**
 * Consulta todos los lotes con stock activo en la botica.
 */
export async function obtenerLotesInventario(): Promise<LoteConStock[]> {
  const sql = `
    select 
      l.id,
      l.producto_id,
      p.codigo_interno,
      p.nombre_comercial,
      p.concentracion,
      coalesce(lab.nombre, 'Varios') as laboratorio,
      l.numero_lote,
      to_char(l.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
      (l.fecha_vencimiento - current_date)::integer as dias_para_vencer,
      coalesce(sl.cantidad_base, 0)::integer as cantidad_base,
      p.unidad_base,
      coalesce(sl.estado, 'disponible') as estado,
      p.costo_promedio::numeric as costo_promedio,
      50 as stock_minimo,
      p.requiere_cadena_frio
    from public.lotes l
    join public.productos p on p.id = l.producto_id
    left join public.laboratorios lab on lab.id = p.laboratorio_id
    left join public.stock_lotes sl on sl.lote_id = l.id
    order by l.fecha_vencimiento asc, p.nombre_comercial asc;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      producto_id: r.producto_id,
      codigo_interno: r.codigo_interno,
      nombre_comercial: r.nombre_comercial,
      concentracion: r.concentracion,
      laboratorio: r.laboratorio,
      numero_lote: r.numero_lote,
      fecha_vencimiento: r.fecha_vencimiento,
      dias_para_vencer: Number(r.dias_para_vencer),
      cantidad_base: Number(r.cantidad_base),
      unidad_base: r.unidad_base,
      estado: r.estado as EstadoLoteStock,
      costo_promedio: Number(r.costo_promedio),
      stock_minimo: Number(r.stock_minimo),
      requiere_cadena_frio: Boolean(r.requiere_cadena_frio),
    }));
  } catch (error) {
    console.error('Error al consultar lotes de inventario:', error);
    return [];
  }
}

/**
 * Consulta los lotes próximos a vencer (< 90 días) para el semáforo FEFO.
 */
export async function obtenerAlertasFefo(): Promise<AlertaVencimientoItem[]> {
  const sql = `
    select 
      l.id as lote_id,
      l.producto_id,
      p.nombre_comercial,
      l.numero_lote,
      to_char(l.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
      (l.fecha_vencimiento - current_date)::integer as dias_para_vencer,
      coalesce(sl.cantidad_base, 0)::integer as cantidad_base,
      p.unidad_base,
      coalesce(lab.nombre, 'Laboratorio Farmacéutico') as laboratorio,
      p.costo_promedio::numeric as costo_promedio,
      coalesce(pp.precio_venta, 10.00)::numeric as precio_venta,
      sl.sucursal_id
    from public.lotes l
    join public.productos p on p.id = l.producto_id
    left join public.laboratorios lab on lab.id = p.laboratorio_id
    left join public.stock_lotes sl on sl.lote_id = l.id
    left join lateral (
      select precio_venta from public.producto_presentaciones
      where producto_id = p.id and activo = true
      order by es_default desc, factor_base asc
      limit 1
    ) pp on true
    where l.fecha_vencimiento <= (current_date + interval '90 days')
      and coalesce(sl.cantidad_base, 0) > 0
    order by l.fecha_vencimiento asc;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => {
      const dias = Number(r.dias_para_vencer);
      const nivel = dias <= 30 ? 'urgente' : dias <= 60 ? 'alerta' : 'preventivo';

      return {
        lote_id: r.lote_id,
        producto_id: r.producto_id,
        nombre_comercial: r.nombre_comercial,
        numero_lote: r.numero_lote,
        fecha_vencimiento: r.fecha_vencimiento,
        dias_para_vencer: dias,
        cantidad_base: Number(r.cantidad_base),
        unidad_base: r.unidad_base,
        nivel,
        laboratorio: r.laboratorio,
        costo_promedio: Number(r.costo_promedio),
        precio_venta: Number(r.precio_venta),
        sucursal_id: r.sucursal_id,
      };
    });
  } catch (error) {
    console.error('Error al consultar alertas FEFO:', error);
    return [];
  }
}

/**
 * Consulta el historial del Kardex de movimientos de stock.
 */
export async function obtenerMovimientosKardex(): Promise<MovimientoKardex[]> {
  const sql = `
    select 
      ms.id,
      to_char(ms.created_at, 'DD/MM/YYYY HH24:MI') as fecha,
      ms.tipo,
      p.codigo_interno as producto_codigo,
      p.nombre_comercial as producto_nombre,
      p.unidad_base,
      l.numero_lote,
      to_char(l.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento,
      ms.cantidad_base,
      ms.costo_unitario_base::numeric as costo_unitario,
      coalesce(ms.saldo_lote_posterior, 0) as saldo_lote_posterior,
      ms.referencia_tipo,
      ms.referencia_id,
      coalesce(perf.nombres || ' ' || perf.apellidos, 'Sistema') as usuario_nombre,
      ms.observacion,
      t.ruc as tenant_ruc,
      t.razon_social as tenant_razon_social
    from public.movimientos_stock ms
    join public.productos p on p.id = ms.producto_id
    join public.lotes l on l.id = ms.lote_id
    left join public.tenants t on t.id = ms.tenant_id
    left join public.perfiles perf on perf.id = ms.usuario_id
    order by ms.created_at desc
    limit 300;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: Number(r.id),
      fecha: r.fecha,
      tipo: r.tipo,
      producto_codigo: r.producto_codigo || undefined,
      producto_nombre: r.producto_nombre,
      unidad_base: r.unidad_base || undefined,
      numero_lote: r.numero_lote,
      fecha_vencimiento: r.fecha_vencimiento || undefined,
      cantidad_base: Number(r.cantidad_base),
      costo_unitario: Number(r.costo_unitario),
      saldo_lote_posterior: Number(r.saldo_lote_posterior),
      referencia_tipo: r.referencia_tipo,
      referencia_id: r.referencia_id,
      usuario_nombre: r.usuario_nombre,
      observacion: r.observacion,
      tenant_ruc: r.tenant_ruc || undefined,
      tenant_razon_social: r.tenant_razon_social || undefined,
    }));
  } catch (error) {
    console.error('Error al consultar movimientos de kardex:', error);
    return [];
  }
}
