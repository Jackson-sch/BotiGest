import { query } from '@/lib/db';
import type { Cliente, ClienteDetalleCompleto, ClientesMetricas } from './types';

/**
 * Obtiene la lista completa de clientes con sus saldos de cuenta corriente y métricas de compra
 */
export async function getClientes(): Promise<Cliente[]> {
  const sql = `
    select 
      c.id,
      c.tenant_id,
      c.tipo_documento,
      c.numero_documento,
      c.nombres,
      c.direccion,
      c.telefono,
      c.email,
      c.puntos,
      c.consentimiento_datos,
      c.activo,
      c.tiene_credito,
      coalesce(c.limite_credito, 0.00)::numeric as limite_credito,
      coalesce(c.dias_credito, 30) as dias_credito,
      coalesce(c.saldo_deudor, 0.00)::numeric as saldo_deudor,
      c.alergias,
      c.condicion_medica,
      c.notas,
      c.created_at,
      c.updated_at,
      count(v.id)::int as total_compras,
      max(v.fecha_emision)::text as ultima_compra
    from public.clientes c
    left join public.ventas v on v.cliente_id = c.id and v.estado != 'anulada'
    group by c.id
    order by c.saldo_deudor desc, c.nombres asc;
  `;

  const rows = await query(sql);

  return rows.map((r: any) => ({
    id: r.id,
    tenant_id: r.tenant_id,
    tipo_documento: r.tipo_documento,
    numero_documento: r.numero_documento,
    nombres: r.nombres,
    direccion: r.direccion,
    telefono: r.telefono,
    email: r.email,
    puntos: r.puntos || 0,
    consentimiento_datos: r.consentimiento_datos,
    activo: r.activo,
    tiene_credito: r.tiene_credito,
    limite_credito: Number(r.limite_credito) || 0,
    dias_credito: r.dias_credito || 30,
    saldo_deudor: Number(r.saldo_deudor) || 0,
    alergias: r.alergias,
    condicion_medica: r.condicion_medica,
    notas: r.notas,
    created_at: r.created_at,
    updated_at: r.updated_at,
    total_compras: r.total_compras || 0,
    ultima_compra: r.ultima_compra || null,
  }));
}

/**
 * Obtiene el detalle de un cliente junto con su estado de cuenta corriente completo y ventas recientes
 */
export async function getClienteDetalle(id: string): Promise<ClienteDetalleCompleto | null> {
  const sqlCliente = `
    select 
      c.id,
      c.tenant_id,
      c.tipo_documento,
      c.numero_documento,
      c.nombres,
      c.direccion,
      c.telefono,
      c.email,
      c.puntos,
      c.consentimiento_datos,
      c.activo,
      c.tiene_credito,
      coalesce(c.limite_credito, 0.00)::numeric as limite_credito,
      coalesce(c.dias_credito, 30) as dias_credito,
      coalesce(c.saldo_deudor, 0.00)::numeric as saldo_deudor,
      c.alergias,
      c.condicion_medica,
      c.notas,
      c.created_at,
      c.updated_at
    from public.clientes c
    where c.id = $1;
  `;

  const clientes = await query(sqlCliente, [id]);
  if (clientes.length === 0) return null;
  const c = clientes[0];

  // Movimientos de Cuenta Corriente (Cargos y Abonos)
  const sqlMovimientos = `
    select 
      id,
      tenant_id,
      sucursal_id,
      cliente_id,
      tipo_movimiento,
      monto::numeric,
      saldo_anterior::numeric,
      saldo_posterior::numeric,
      venta_id,
      comprobante_referencia,
      metodo_pago,
      turno_caja_id,
      registrado_por,
      registrado_por_nombre,
      observaciones,
      created_at
    from public.cuentas_corrientes_movimientos
    where cliente_id = $1
    order by created_at desc;
  `;

  const movimientosRows = await query(sqlMovimientos, [id]);

  // Ventas recientes
  const sqlVentas = `
    select 
      id,
      serie || '-' || lpad(numero::text, 8, '0') as correlativo,
      tipo_comprobante,
      total::numeric,
      fecha_emision::text,
      estado
    from public.ventas
    where cliente_id = $1
    order by fecha_emision desc
    limit 10;
  `;

  const ventasRows = await query(sqlVentas, [id]);

  return {
    id: c.id,
    tenant_id: c.tenant_id,
    tipo_documento: c.tipo_documento,
    numero_documento: c.numero_documento,
    nombres: c.nombres,
    direccion: c.direccion,
    telefono: c.telefono,
    email: c.email,
    puntos: c.puntos || 0,
    consentimiento_datos: c.consentimiento_datos,
    activo: c.activo,
    tiene_credito: c.tiene_credito,
    limite_credito: Number(c.limite_credito) || 0,
    dias_credito: c.dias_credito || 30,
    saldo_deudor: Number(c.saldo_deudor) || 0,
    alergias: c.alergias,
    condicion_medica: c.condicion_medica,
    notas: c.notas,
    created_at: c.created_at,
    updated_at: c.updated_at,
    movimientos: movimientosRows.map((m: any) => ({
      id: m.id,
      tenant_id: m.tenant_id,
      sucursal_id: m.sucursal_id,
      cliente_id: m.cliente_id,
      tipo_movimiento: m.tipo_movimiento,
      monto: Number(m.monto),
      saldo_anterior: Number(m.saldo_anterior),
      saldo_posterior: Number(m.saldo_posterior),
      venta_id: m.venta_id,
      comprobante_referencia: m.comprobante_referencia,
      metodo_pago: m.metodo_pago,
      turno_caja_id: m.turno_caja_id,
      registrado_por: m.registrado_por,
      registrado_por_nombre: m.registrado_por_nombre,
      observaciones: m.observaciones,
      created_at: m.created_at,
    })),
    ventas_recientes: ventasRows.map((v: any) => ({
      id: v.id,
      correlativo: v.correlativo,
      tipo_comprobante: v.tipo_comprobante,
      total: Number(v.total),
      fecha_emision: v.fecha_emision,
      estado: v.estado,
    })),
  };
}

/**
 * Obtiene métricas financieras y operativas de la cartera de clientes
 */
export async function getMetricasClientes(): Promise<ClientesMetricas> {
  const sql = `
    select 
      count(*)::int as total_clientes,
      count(*) filter (where tiene_credito = true)::int as clientes_con_credito,
      coalesce(sum(saldo_deudor) filter (where saldo_deudor > 0), 0)::numeric as total_deuda,
      count(*) filter (where saldo_deudor > 0)::int as deudores_activos
    from public.clientes;
  `;

  const sqlAbonos = `
    select coalesce(sum(monto), 0)::numeric as total_abonos_mes
    from public.cuentas_corrientes_movimientos
    where tipo_movimiento = 'abono'
      and created_at >= date_trunc('month', now());
  `;

  const [resMetricas, resAbonos] = await Promise.all([
    query(sql),
    query(sqlAbonos),
  ]);

  const m = resMetricas[0] || {};
  const a = resAbonos[0] || {};

  return {
    totalClientes: m.total_clientes || 0,
    clientesConCredito: m.clientes_con_credito || 0,
    totalDeudaEnCalle: Number(m.total_deuda) || 0,
    clientesDeudoresActivos: m.deudores_activos || 0,
    totalAbonosMes: Number(a.total_abonos_mes) || 0,
  };
}
