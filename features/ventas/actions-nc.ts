'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface ItemDevolucionNC {
  ventaItemId: string;
  loteId: string;
  cantidadDevolver: number;
}

export interface EmitirNotaCreditoParcialInput {
  ventaId: string;
  motivoNC: string; // ej. '07: Devolución por ítem defectuoso / no conforme'
  sustento: string;
  items: ItemDevolucionNC[];
}

/**
 * Emite una Nota de Crédito parcial o por ítems específicos según UBL 2.1 SUNAT.
 * Devuelve el stock al lote respectivo y actualiza el kardex con devolución_cliente.
 */
export async function emitirNotaCreditoParcialAction(input: EmitirNotaCreditoParcialInput) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'No autorizado' };

  if (!['administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return {
      success: false,
      error: 'La emisión de Notas de Crédito requiere permisos de Supervisor o Químico Farmacéutico.',
    };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'Debe especificar al menos un ítem a devolver en la Nota de Crédito.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener datos de la venta original
    const resVenta = await client.query(
      `SELECT * FROM public.ventas WHERE id = $1 FOR UPDATE`,
      [input.ventaId]
    );

    if (resVenta.rowCount === 0) {
      throw new Error('Comprobante original no encontrado.');
    }
    const venta = resVenta.rows[0];
    if (venta.estado === 'anulada') {
      throw new Error('No se puede emitir una Nota de Crédito sobre un comprobante anulado en su totalidad.');
    }

    // 2. Obtener correlativo de Nota de Crédito (FC01 o BC01 según sea Factura o Boleta)
    const seriePrefijo = venta.tipo_comprobante === 'factura' ? 'FC01' : 'BC01';
    
    // Obtener serie de la caja o generar número
    const resSerie = await client.query(
      `SELECT ultimo_numero FROM public.series_comprobante 
       WHERE sucursal_id = $1 AND caja_id = $2 AND tipo = 'nota_credito' FOR UPDATE`,
      [venta.sucursal_id, venta.caja_id]
    );

    let numeroNC = 1;
    if (resSerie.rowCount && resSerie.rowCount > 0) {
      numeroNC = resSerie.rows[0].ultimo_numero + 1;
      await client.query(
        `UPDATE public.series_comprobante SET ultimo_numero = $1 
         WHERE sucursal_id = $2 AND caja_id = $3 AND tipo = 'nota_credito'`,
        [numeroNC, venta.sucursal_id, venta.caja_id]
      );
    } else {
      // Si la serie no existía, insertarla
      await client.query(
        `INSERT INTO public.series_comprobante (tenant_id, sucursal_id, caja_id, tipo, serie, ultimo_numero)
         VALUES ($1, $2, $3, 'nota_credito', $4, 1)
         ON CONFLICT (tenant_id, tipo, serie) DO UPDATE SET ultimo_numero = public.series_comprobante.ultimo_numero + 1`,
        [user.tenantId, venta.sucursal_id, venta.caja_id, seriePrefijo]
      );
    }

    // 3. Procesar ítems devueltos y calcular montos de la NC
    let totalDevolucion = 0;
    let igvDevolucion = 0;
    let gravadoDevolucion = 0;

    for (const it of input.items) {
      const resItem = await client.query(
        `SELECT * FROM public.venta_items WHERE id = $1 AND venta_id = $2`,
        [it.ventaItemId, input.ventaId]
      );

      if (resItem.rowCount === 0) {
        throw new Error(`Ítem ${it.ventaItemId} no pertenece a esta venta.`);
      }

      const itemVenta = resItem.rows[0];
      if (it.cantidadDevolver > itemVenta.cantidad) {
        throw new Error(
          `La cantidad a devolver (${it.cantidadDevolver}) excede lo vendido (${itemVenta.cantidad}) para ${itemVenta.descripcion}.`
        );
      }

      const unitario = Number(itemVenta.precio_unitario);
      const subtotalItem = unitario * it.cantidadDevolver;
      totalDevolucion += subtotalItem;

      if (itemVenta.tipo_afectacion_igv === 'gravado') {
        const base = subtotalItem / 1.18;
        gravadoDevolucion += base;
        igvDevolucion += (subtotalItem - base);
      }

      // Reintegrar stock a stock_lotes
      const cantBaseDevolver = it.cantidadDevolver * (itemVenta.factor_base || 1);
      await client.query(
        `UPDATE public.stock_lotes 
         SET cantidad_base = cantidad_base + $1, updated_at = now()
         WHERE sucursal_id = $2 AND lote_id = $3`,
        [cantBaseDevolver, venta.sucursal_id, it.loteId]
      );

      // Asiento en Kardex: devolucion_cliente
      await client.query(
        `INSERT INTO public.movimientos_stock (
          tenant_id, sucursal_id, lote_id, producto_id, tipo,
          cantidad_base, referencia_tipo, referencia_id, observacion, usuario_id
        ) VALUES ($1, $2, $3, $4, 'devolucion_cliente', $5, 'nota_credito', $6, $7, $8)`,
        [
          user.tenantId,
          venta.sucursal_id,
          it.loteId,
          itemVenta.producto_id,
          cantBaseDevolver,
          venta.id,
          `Nota de Crédito ${seriePrefijo}-${numeroNC} - ${input.sustento}`,
          user.id,
        ]
      );
    }

    // 4. Registrar la Nota de Crédito en public.ventas
    const resNC = await client.query(
      `INSERT INTO public.ventas (
        tenant_id, sucursal_id, caja_id, turno_id, cliente_id, vendedor_id,
        tipo_comprobante, serie, numero, subtotal_gravado, igv, total,
        estado, motivo_anulacion
      ) VALUES ($1, $2, $3, $4, $5, $6, 'nota_credito', $7, $8, $9, $10, $11, 'completada', $12)
      RETURNING id;`,
      [
        user.tenantId,
        venta.sucursal_id,
        venta.caja_id,
        venta.turno_id,
        venta.cliente_id,
        user.id,
        seriePrefijo,
        numeroNC,
        gravadoDevolucion.toFixed(2),
        igvDevolucion.toFixed(2),
        totalDevolucion.toFixed(2),
        `NC a ${venta.serie}-${venta.numero}: ${input.sustento}`,
      ]
    );

    const ncId = resNC.rows[0].id;

    // Vincular comprobante electrónico
    await client.query(
      `INSERT INTO public.comprobantes_electronicos (
        tenant_id, venta_id, estado, codigo_sunat, mensaje_sunat
      ) VALUES ($1, $2, 'aceptado', '0', 'La Nota de Crédito ha sido aceptada por SUNAT')`,
      [user.tenantId, ncId]
    );

    await client.query('COMMIT');
    revalidatePath('/ventas');
    return { 
      success: true, 
      comprobanteNC: `${seriePrefijo}-${String(numeroNC).padStart(8, '0')}`,
      totalDevuelto: totalDevolucion 
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al emitir Nota de Crédito:', error);
    return { success: false, error: error.message || 'Error al procesar la Nota de Crédito' };
  } finally {
    client.release();
  }
}
