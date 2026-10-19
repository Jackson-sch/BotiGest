import { query, queryOne } from '@/lib/db';
import type { BalanceSustanciaControlada, RegistroLibroControlado } from './types';

/**
 * Consulta los balances físicos permanentes de sustancias fiscalizadas (DIGEMID).
 */
export async function obtenerBalancesControlados(): Promise<BalanceSustanciaControlada[]> {
  const sql = `
    select 
      p.id as producto_id,
      p.codigo_interno,
      p.nombre_comercial,
      p.concentracion,
      p.condicion_venta as condicion,
      coalesce(
        (
          select sum(sl.cantidad_base)
            from public.stock_lotes sl
           where sl.producto_id = p.id
        ), 0
      )::integer as saldo_actual_base,
      p.unidad_base,
      coalesce(
        (
          select count(*)
            from public.libro_controlados lc
           where lc.producto_id = p.id
             and lc.validado_por is null
        ), 0
      )::integer as asientos_pendientes_firma,
      to_char(now(), 'DD/MM/YYYY') as ultimo_movimiento
    from public.productos p
    where p.es_controlado = true
      and p.activo = true
    order by p.nombre_comercial asc;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      producto_id: r.producto_id,
      codigo_interno: r.codigo_interno,
      nombre_comercial: r.nombre_comercial,
      concentracion: r.concentracion,
      condicion: r.condicion,
      saldo_actual_base: Number(r.saldo_actual_base),
      unidad_base: r.unidad_base,
      asientos_pendientes_firma: Number(r.asientos_pendientes_firma),
      ultimo_movimiento: r.ultimo_movimiento,
    }));
  } catch (error) {
    console.error('Error al consultar balances controlados:', error);
    return [];
  }
}

/**
 * Consulta los asientos inmutables del libro de controlados con recetas y firmas.
 */
export async function obtenerAsientosLibroControlados(): Promise<RegistroLibroControlado[]> {
  const sql = `
    select 
      lc.id,
      to_char(lc.created_at, 'DD/MM/YYYY HH24:MI') as fecha,
      lc.producto_id,
      p.nombre_comercial as producto_nombre,
      p.concentracion,
      p.condicion_venta as condicion,
      l.numero_lote,
      to_char(l.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento,
      lc.tipo_movimiento,
      lc.cantidad_base,
      lc.saldo_posterior,
      lc.referencia_tipo,
      lc.referencia_id,
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
      coalesce(perf.nombres || ' ' || perf.apellidos, 'Cajero') as registrado_por,
      lc.validado_por,
      to_char(lc.validado_at, 'DD/MM/YYYY HH24:MI') as validado_at,
      case when lc.validado_por is not null then 'CQFP 18452 (Validado)' else null end as cqfp_validador
    from public.libro_controlados lc
    join public.productos p on p.id = lc.producto_id
    join public.lotes l on l.id = lc.lote_id
    left join public.recetas r on (r.id = lc.receta_id or (lc.referencia_tipo = 'venta' and r.venta_id::text = lc.referencia_id::text))
    left join public.perfiles perf on perf.id = lc.registrado_por
    order by lc.created_at desc
    limit 100;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: Number(r.id),
      fecha: r.fecha,
      producto_id: r.producto_id,
      producto_nombre: r.producto_nombre,
      concentracion: r.concentracion,
      condicion: r.condicion,
      numero_lote: r.numero_lote,
      fecha_vencimiento: r.fecha_vencimiento,
      tipo_movimiento: r.tipo_movimiento,
      cantidad_base: Number(r.cantidad_base),
      saldo_posterior: Number(r.saldo_posterior),
      referencia_tipo: r.referencia_tipo,
      referencia_id: r.referencia_id,
      receta: r.receta,
      registrado_por: r.registrado_por,
      validado_por: r.validado_por,
      validado_at: r.validado_at,
      cqfp_validador: r.cqfp_validador,
    }));
  } catch (error) {
    console.error('Error al consultar libro de controlados:', error);
    return [];
  }
}

/**
 * Consulta los datos del Químico Farmacéutico (Director Técnico) de la botica.
 */
export async function obtenerDirectorTecnico() {
  const sql = `
    select 
      p.nombres || ' ' || p.apellidos as nombre_completo,
      p.cqfp,
      s.autorizacion_digemid
    from public.perfiles p
    join public.sucursales s on s.director_tecnico_id = p.id
    where p.rol = 'director_tecnico'
    limit 1;
  `;

  try {
    return await queryOne(sql);
  } catch (error) {
    console.error('Error al consultar Director Técnico:', error);
    return null;
  }
}
