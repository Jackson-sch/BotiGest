import { query } from '@/lib/db';
import type {
  OppfItem,
  BalanceTrimestralItem,
  SireVentaItem,
  MetricasGerenciales,
} from './types';

export async function getDatosOppfDigemid(): Promise<OppfItem[]> {
  try {
    const rows = await query<any>(`
      select 
        coalesce(t.ruc, '20608899112') as ruc,
        coalesce(s.codigo_establecimiento_sunat, '0000') as codigo_establecimiento,
        p.codigo_interno as codigo_producto,
        p.nombre_comercial,
        p.nombre_generico,
        pr.nombre as presentacion,
        pr.precio_venta::float as precio_unitario,
        p.condicion_venta,
        p.registro_sanitario,
        coalesce(sum(sl.cantidad_base), 0)::int as stock_actual
      from public.productos p
      join public.producto_presentaciones pr on pr.producto_id = p.id and pr.es_default = true
      left join public.stock_lotes sl on sl.producto_id = p.id
      left join public.tenants t on t.id = p.tenant_id
      left join public.sucursales s on s.tenant_id = p.tenant_id and s.activo = true
      where p.activo = true
      group by t.ruc, s.codigo_establecimiento_sunat, p.id, pr.id, pr.nombre, pr.precio_venta
      order by p.nombre_comercial asc
    `);

    return rows.map((r) => ({
      ruc: r.ruc,
      codigo_establecimiento: r.codigo_establecimiento,
      codigo_producto: r.codigo_producto,
      nombre_comercial: r.nombre_comercial,
      nombre_generico: r.nombre_generico,
      presentacion: r.presentacion,
      precio_unitario: r.precio_unitario,
      condicion_venta: r.condicion_venta,
      registro_sanitario: r.registro_sanitario,
      stock_actual: r.stock_actual,
    }));
  } catch (err) {
    console.error('Error en getDatosOppfDigemid:', err);
    return [];
  }
}

export async function getBalanceTrimestralControlados(): Promise<BalanceTrimestralItem[]> {
  try {
    const rows = await query<any>(`
      select 
        p.id as producto_id,
        p.nombre_comercial,
        p.nombre_generico,
        p.concentracion,
        p.unidad_base,
        coalesce(sum(case when lc.tipo_movimiento = 'compra' then lc.cantidad_base else 0 end), 0)::int as entradas_compras,
        coalesce(sum(case when lc.tipo_movimiento = 'venta' then abs(lc.cantidad_base) else 0 end), 0)::int as salidas_recetas,
        coalesce(sum(case when lc.tipo_movimiento in ('vencimiento', 'merma', 'devolucion_proveedor') then abs(lc.cantidad_base) else 0 end), 0)::int as bajas_mermas,
        coalesce(max(lc.saldo_posterior), 0)::int as saldo_final
      from public.productos p
      left join public.libro_controlados lc on lc.producto_id = p.id
      where p.es_controlado = true or p.condicion_venta in ('psicotropico', 'estupefaciente')
      group by p.id, p.nombre_comercial, p.nombre_generico, p.concentracion, p.unidad_base
      order by p.nombre_comercial asc
    `);

    return rows.map((r) => {
      const entradas = Number(r.entradas_compras) || 0;
      const salidas = Number(r.salidas_recetas) || 0;
      const bajas = Number(r.bajas_mermas) || 0;
      const saldoFinal = Number(r.saldo_final) || 0;
      const saldoInicial = Math.max(0, saldoFinal + salidas + bajas - entradas);

      return {
        producto_id: r.producto_id,
        nombre_comercial: r.nombre_comercial,
        nombre_generico: r.nombre_generico,
        concentracion: r.concentracion,
        unidad_base: r.unidad_base,
        saldo_inicial: saldoInicial,
        entradas_compras: entradas,
        salidas_recetas: salidas,
        bajas_mermas: bajas,
        saldo_final: saldoFinal,
      };
    });
  } catch (err) {
    console.error('Error en getBalanceTrimestralControlados:', err);
    return [];
  }
}

export async function getSireVentas(): Promise<SireVentaItem[]> {
  try {
    const rows = await query<any>(`
      select 
        v.id,
        v.fecha_emision,
        v.tipo_comprobante,
        v.serie,
        v.numero,
        c.numero_documento as cliente_documento,
        c.nombres as cliente_nombre,
        (coalesce(v.subtotal_gravado, 0) + coalesce(v.subtotal_exonerado, 0))::float as subtotal,
        v.igv::float as igv,
        v.total::float as total,
        coalesce(ce.estado, 'aceptado') as estado_sunat
      from public.ventas v
      left join public.clientes c on c.id = v.cliente_id
      left join public.comprobantes_electronicos ce on ce.venta_id = v.id
      order by v.fecha_emision desc
      limit 50
    `);

    return rows.map((r) => ({
      id: r.id,
      fecha_emision: new Date(r.fecha_emision).toLocaleDateString('es-PE'),
      tipo_comprobante: r.tipo_comprobante,
      serie: r.serie,
      numero: r.numero,
      cliente_documento: r.cliente_documento,
      cliente_nombre: r.cliente_nombre,
      subtotal: r.subtotal,
      igv: r.igv,
      total: r.total,
      estado_sunat: r.estado_sunat,
    }));
  } catch (err) {
    console.error('Error en getSireVentas:', err);
    return [];
  }
}

export async function getMetricasGerenciales(): Promise<MetricasGerenciales> {
  try {
    const [ventasTotalRes, comprasTotalRes, topProdsRes] = await Promise.all([
      query<any>(`select coalesce(sum(total), 0)::float as total, count(id)::int as count from public.ventas where estado = 'completada'`),
      query<any>(`select coalesce(sum(total), 0)::float as total from public.compras where estado = 'recibida'`),
      query<any>(`
        select 
          vi.descripcion as nombre,
          sum(vi.cantidad)::int as unidades,
          sum(vi.total)::float as total
        from public.venta_items vi
        join public.ventas v on v.id = vi.venta_id and v.estado = 'completada'
        group by vi.descripcion
        order by total desc
        limit 5
      `),
    ]);

    const totalVentas = ventasTotalRes[0]?.total || 0;
    const countVentas = ventasTotalRes[0]?.count || 1;
    const totalCompras = comprasTotalRes[0]?.total || 0;
    const margenEstimado = totalVentas > 0 ? ((totalVentas - totalCompras * 0.7) / totalVentas) * 100 : 35;

    return {
      ventasMesTotal: totalVentas,
      comprasMesTotal: totalCompras,
      margenBrutoEstimado: Math.max(15, Math.min(60, Number(margenEstimado.toFixed(1)))),
      ticketPromedio: Number((totalVentas / Math.max(1, countVentas)).toFixed(2)),
      topProductos: topProdsRes.map((p) => ({
        nombre: p.nombre,
        unidades: p.unidades,
        total: p.total,
      })),
    };
  } catch (err) {
    console.error('Error en getMetricasGerenciales:', err);
    return {
      ventasMesTotal: 0,
      comprasMesTotal: 0,
      margenBrutoEstimado: 0,
      ticketPromedio: 0,
      topProductos: [],
    };
  }
}
