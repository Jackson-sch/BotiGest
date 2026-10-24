import { query } from '@/lib/db';

export interface SugeridoCompraItem {
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  concentracion?: string;
  laboratorio?: string;
  unidad_base: string;
  stock_actual: number;
  unidades_vendidas_30d: number;
  promedio_diario: number;
  dias_inventario_restante: number;
  stock_seguridad_sugerido: number;
  cantidad_sugerida_comprar: number;
  costo_promedio: number;
  inversion_estimada: number;
}

/**
 * Calcula el sugerido de reposición / compras según el consumo promedio diario (Cd) de los últimos 30 días:
 * Punto de Reorden (ROP) = (Consumo Diario * Lead Time de 7 días) + Stock de Seguridad (5 días)
 * Cantidad a Comprar = ROP - Stock Actual
 */
export async function obtenerSugeridoCompras(sucursalId?: string): Promise<SugeridoCompraItem[]> {
  try {
    const params: any[] = [];
    let sucursalWhere = '';
    if (sucursalId) {
      params.push(sucursalId);
      sucursalWhere = `AND (sl.sucursal_id = $1 OR sl.sucursal_id IS NULL)`;
    }

    const sql = `
      WITH ventas_ultimos_30d AS (
        SELECT 
          vi.producto_id,
          coalesce(sum(vi.cantidad * vi.factor_base), 0) as total_unidades_vendidas
        FROM public.venta_items vi
        JOIN public.ventas v ON v.id = vi.venta_id
        WHERE v.fecha_emision >= (now() - interval '30 days')
          AND v.estado = 'completada'
          ${sucursalId ? `AND v.sucursal_id = $1` : ''}
        GROUP BY vi.producto_id
      ),
      stock_actual_prod AS (
        SELECT 
          sl.producto_id,
          coalesce(sum(sl.cantidad_base), 0) as stock_total
        FROM public.stock_lotes sl
        WHERE sl.estado = 'disponible'
        ${sucursalWhere}
        GROUP BY sl.producto_id
      )
      SELECT 
        p.id as producto_id,
        p.codigo_interno,
        p.nombre_comercial,
        p.concentracion,
        coalesce(lab.nombre, 'Varios') as laboratorio,
        p.unidad_base,
        coalesce(sap.stock_total, 0)::int as stock_actual,
        coalesce(v30.total_unidades_vendidas, 0)::int as unidades_vendidas_30d,
        round(coalesce(v30.total_unidades_vendidas, 0) / 30.0, 2)::numeric as promedio_diario,
        p.costo_promedio::numeric as costo_promedio
      FROM public.productos p
      LEFT JOIN public.laboratorios lab ON lab.id = p.laboratorio_id
      LEFT JOIN ventas_ultimos_30d v30 ON v30.producto_id = p.id
      LEFT JOIN stock_actual_prod sap ON sap.producto_id = p.id
      WHERE p.activo = true 
        AND coalesce(v30.total_unidades_vendidas, 0) > 0
      ORDER BY unidades_vendidas_30d DESC
      LIMIT 100;
    `;

    const rows = await query<any>(sql, params);

    return rows.map((r) => {
      const stock = Number(r.stock_actual);
      const promDiario = Math.max(0.1, Number(r.promedio_diario));
      const leadTimeDias = 7; // Tiempo estimado de entrega de droguería
      const bufferDias = 5;   // Margen de seguridad

      const rop = Math.ceil(promDiario * (leadTimeDias + bufferDias));
      const sugerido = Math.max(0, rop - stock);
      const diasRestantes = stock > 0 ? Math.round(stock / promDiario) : 0;
      const costo = Number(r.costo_promedio) || 1;

      return {
        producto_id: r.producto_id,
        codigo_interno: r.codigo_interno,
        nombre_comercial: r.nombre_comercial,
        concentracion: r.concentracion,
        laboratorio: r.laboratorio,
        unidad_base: r.unidad_base,
        stock_actual: stock,
        unidades_vendidas_30d: Number(r.unidades_vendidas_30d),
        promedio_diario: promDiario,
        dias_inventario_restante: diasRestantes,
        stock_seguridad_sugerido: rop,
        cantidad_sugerida_comprar: sugerido,
        costo_promedio: costo,
        inversion_estimada: Math.round(sugerido * costo * 100) / 100,
      };
    });
  } catch (error) {
    console.error('Error al calcular sugerido de compras:', error);
    return [];
  }
}
