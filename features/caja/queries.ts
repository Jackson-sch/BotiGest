import { query, queryOne } from '@/lib/db';
import type { TurnoCajaResumen, MovimientoCaja, ResumenEfectivoSistema } from './types';

/**
 * Consulta el turno de caja actualmente abierto.
 */
export async function obtenerTurnoActivo(): Promise<TurnoCajaResumen | null> {
  const sql = `
    select 
      tc.id,
      tc.sucursal_id,
      s.nombre as sucursal_nombre,
      tc.caja_id,
      c.nombre as caja_nombre,
      tc.usuario_id,
      p.nombres || ' ' || p.apellidos as cajero_nombre,
      tc.estado,
      to_char(tc.apertura_at, 'DD/MM/YYYY HH24:MI') as apertura_at,
      tc.monto_apertura::numeric as monto_apertura,
      case 
        when tc.cierre_at is not null then to_char(tc.cierre_at, 'DD/MM/YYYY HH24:MI')
        else null 
      end as cierre_at,
      tc.monto_cierre_declarado::numeric as monto_cierre_declarado,
      tc.monto_cierre_sistema::numeric as monto_cierre_sistema,
      tc.diferencia::numeric as diferencia,
      tc.observacion
    from public.turnos_caja tc
    join public.sucursales s on s.id = tc.sucursal_id
    join public.cajas c on c.id = tc.caja_id
    join public.perfiles p on p.id = tc.usuario_id
    where tc.estado = 'abierto'
    order by tc.apertura_at desc
    limit 1;
  `;

  try {
    const row = await queryOne<any>(sql);
    if (!row) return null;
    return {
      id: row.id,
      sucursal_id: row.sucursal_id,
      sucursal_nombre: row.sucursal_nombre,
      caja_id: row.caja_id,
      caja_nombre: row.caja_nombre,
      usuario_id: row.usuario_id,
      cajero_nombre: row.cajero_nombre,
      estado: row.estado,
      apertura_at: row.apertura_at,
      monto_apertura: Number(row.monto_apertura),
      cierre_at: row.cierre_at,
      monto_cierre_declarado: row.monto_cierre_declarado ? Number(row.monto_cierre_declarado) : null,
      monto_cierre_sistema: row.monto_cierre_sistema ? Number(row.monto_cierre_sistema) : null,
      diferencia: row.diferencia !== null && row.diferencia !== undefined ? Number(row.diferencia) : null,
      observacion: row.observacion,
    };
  } catch (error) {
    console.error('Error al obtener turno activo:', error);
    return null;
  }
}

/**
 * Consulta el historial de turnos de caja recientes.
 */
export async function obtenerHistorialTurnos(): Promise<TurnoCajaResumen[]> {
  const sql = `
    select 
      tc.id,
      tc.sucursal_id,
      s.nombre as sucursal_nombre,
      tc.caja_id,
      c.nombre as caja_nombre,
      tc.usuario_id,
      p.nombres || ' ' || p.apellidos as cajero_nombre,
      tc.estado,
      to_char(tc.apertura_at, 'DD/MM/YYYY HH24:MI') as apertura_at,
      tc.monto_apertura::numeric as monto_apertura,
      case 
        when tc.cierre_at is not null then to_char(tc.cierre_at, 'DD/MM/YYYY HH24:MI')
        else null 
      end as cierre_at,
      tc.monto_cierre_declarado::numeric as monto_cierre_declarado,
      tc.monto_cierre_sistema::numeric as monto_cierre_sistema,
      tc.diferencia::numeric as diferencia,
      tc.observacion
    from public.turnos_caja tc
    join public.sucursales s on s.id = tc.sucursal_id
    join public.cajas c on c.id = tc.caja_id
    join public.perfiles p on p.id = tc.usuario_id
    order by tc.apertura_at desc
    limit 20;
  `;

  try {
    const rows = await query<any>(sql);
    return rows.map((row) => ({
      id: row.id,
      sucursal_id: row.sucursal_id,
      sucursal_nombre: row.sucursal_nombre,
      caja_id: row.caja_id,
      caja_nombre: row.caja_nombre,
      usuario_id: row.usuario_id,
      cajero_nombre: row.cajero_nombre,
      estado: row.estado,
      apertura_at: row.apertura_at,
      monto_apertura: Number(row.monto_apertura),
      cierre_at: row.cierre_at,
      monto_cierre_declarado: row.monto_cierre_declarado ? Number(row.monto_cierre_declarado) : null,
      monto_cierre_sistema: row.monto_cierre_sistema ? Number(row.monto_cierre_sistema) : null,
      diferencia: row.diferencia !== null && row.diferencia !== undefined ? Number(row.diferencia) : null,
      observacion: row.observacion,
    }));
  } catch (error) {
    console.error('Error al obtener historial de turnos:', error);
    return [];
  }
}

/**
 * Consulta los movimientos de efectivo (ingresos / retiros) de un turno.
 */
export async function obtenerMovimientosDelTurno(turnoId: string): Promise<MovimientoCaja[]> {
  const sql = `
    select 
      mc.id,
      mc.turno_id,
      mc.tipo,
      mc.concepto,
      mc.monto::numeric as monto,
      p.nombres || ' ' || p.apellidos as usuario_nombre,
      to_char(mc.created_at, 'HH24:MI') as created_at
    from public.movimientos_caja mc
    join public.perfiles p on p.id = mc.usuario_id
    where mc.turno_id = $1
    order by mc.created_at desc;
  `;

  try {
    const rows = await query<any>(sql, [turnoId]);
    return rows.map((r) => ({
      id: r.id,
      turno_id: r.turno_id,
      tipo: r.tipo,
      concepto: r.concepto,
      monto: Number(r.monto),
      usuario_nombre: r.usuario_nombre,
      created_at: r.created_at,
    }));
  } catch (error) {
    console.error('Error al consultar movimientos de caja:', error);
    return [];
  }
}

/**
 * Calcula el saldo del sistema para conciliación de caja (Arqueo).
 */
export async function calcularResumenEfectivoSistema(turnoId: string): Promise<ResumenEfectivoSistema> {
  const sql = `
    with turno as (
      select monto_apertura from public.turnos_caja where id = $1
    ),
    ventas as (
      select coalesce(sum(total), 0) as total_ventas
      from public.ventas
      where turno_id = $1 and estado != 'anulada'
    ),
    ingresos as (
      select coalesce(sum(monto), 0) as total_ingresos
      from public.movimientos_caja
      where turno_id = $1 and tipo = 'ingreso'
    ),
    egresos as (
      select coalesce(sum(monto), 0) as total_egresos
      from public.movimientos_caja
      where turno_id = $1 and tipo = 'egreso'
    )
    select 
      (select monto_apertura from turno)::numeric as monto_apertura,
      (select total_ventas from ventas)::numeric as total_ventas_efectivo,
      (select total_ingresos from ingresos)::numeric as total_ingresos,
      (select total_egresos from egresos)::numeric as total_egresos,
      (
        (select monto_apertura from turno) + 
        (select total_ventas from ventas) + 
        (select total_ingresos from ingresos) - 
        (select total_egresos from egresos)
      )::numeric as saldo_esperado;
  `;

  try {
    const row = await queryOne<any>(sql, [turnoId]);
    if (!row) {
      return {
        monto_apertura: 0,
        total_ventas_efectivo: 0,
        total_ingresos: 0,
        total_egresos: 0,
        saldo_esperado: 0,
      };
    }
    return {
      monto_apertura: Number(row.monto_apertura || 0),
      total_ventas_efectivo: Number(row.total_ventas_efectivo || 0),
      total_ingresos: Number(row.total_ingresos || 0),
      total_egresos: Number(row.total_egresos || 0),
      saldo_esperado: Number(row.saldo_esperado || 0),
    };
  } catch (error) {
    console.error('Error al calcular resumen de efectivo:', error);
    return {
      monto_apertura: 0,
      total_ventas_efectivo: 0,
      total_ingresos: 0,
      total_egresos: 0,
      saldo_esperado: 0,
    };
  }
}

/**
 * Consulta las cajas registradas para apertura.
 */
export async function obtenerCajasDisponibles(): Promise<Array<{ id: string; nombre: string; sucursal_id: string }>> {
  const sql = `
    select id, nombre, sucursal_id
    from public.cajas
    where activo = true
    order by nombre asc;
  `;

  try {
    const rows = await query<any>(sql);
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      sucursal_id: r.sucursal_id,
    }));
  } catch (error) {
    console.error('Error al consultar cajas:', error);
    return [];
  }
}
