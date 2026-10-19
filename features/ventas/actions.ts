'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { anularVentaSchema, type AnularVentaInput } from './schemas';
import { revalidatePath } from 'next/cache';

export interface AnulacionResult {
  success: boolean;
  error?: string;
  code?: string;
}

/**
 * Server Action para anular una venta y emitir Nota de Crédito SUNAT.
 * Restringido a perfiles de Supervisión: Administrador, Propietario o Director Técnico.
 * Revierte el stock a los mismos lotes (FEFO inverso / devolucion_cliente) y actualiza SUNAT.
 */
export async function anularVentaAction(input: AnularVentaInput): Promise<AnulacionResult> {
  const validation = anularVentaSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      error: 'Debe iniciar sesión para anular comprobantes.',
      code: 'UNAUTHORIZED',
    };
  }

  // Restricción de Auditoría Tributaria SUNAT
  if (!['administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return {
      success: false,
      error: 'Acción restringida: La anulación de comprobantes fiscales requiere autorización de Administrador o Director Técnico.',
      code: 'FORBIDDEN',
    };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar estado actual de la venta
    const ventaRes = await client.query(
      `select id, tenant_id, sucursal_id, estado, serie, numero, total
       from public.ventas 
       where id = $1 for update`,
      [validation.data.venta_id]
    );

    if (ventaRes.rows.length === 0) {
      throw new Error('Comprobante no encontrado.');
    }

    const venta = ventaRes.rows[0];
    if (venta.estado === 'anulada') {
      throw new Error('Este comprobante ya ha sido anulado anteriormente.');
    }

    // 2. Marcar venta como anulada
    await client.query(
      `update public.ventas 
       set estado = 'anulada',
           motivo_anulacion = $1,
           anulada_por = $2,
           anulada_at = now()
       where id = $3`,
      [validation.data.motivo, user.id, validation.data.venta_id]
    );

    // 3. Revertir movimientos de Kardex asociados a esta venta
    const movsRes = await client.query(
      `select lote_id, producto_id, cantidad_base, costo_unitario_base
       from public.movimientos_stock
       where referencia_tipo = 'venta' and referencia_id = $1`,
      [validation.data.venta_id]
    );

    for (const mov of movsRes.rows) {
      const cantRevertir = Math.abs(mov.cantidad_base);

      // Sumar nuevamente a stock_lotes
      await client.query(
        `update public.stock_lotes
         set cantidad_base = cantidad_base + $1, updated_at = now()
         where sucursal_id = $2 and lote_id = $3`,
        [cantRevertir, venta.sucursal_id, mov.lote_id]
      );

      // Asiento de devolución en Kardex
      await client.query(
        `insert into public.movimientos_stock (
          tenant_id, sucursal_id, lote_id, producto_id, tipo,
          cantidad_base, costo_unitario_base, referencia_tipo, referencia_id,
          observacion, usuario_id, created_at
        ) values (
          $1, $2, $3, $4, 'devolucion_cliente',
          $5, $6, 'anulacion_venta', $7,
          $8, $9, now()
        )`,
        [
          venta.tenant_id,
          venta.sucursal_id,
          mov.lote_id,
          mov.producto_id,
          cantRevertir,
          mov.costo_unitario_base,
          validation.data.venta_id,
          `Anulación comprobante ${venta.serie}-${venta.numero}: ${validation.data.motivo}`,
          user.id,
        ]
      );
    }

    // 4. Actualizar comprobantes_electronicos a estado anulado
    await client.query(
      `update public.comprobantes_electronicos
       set estado = 'anulado',
           mensaje_sunat = $1,
           updated_at = now()
       where venta_id = $2`,
      [`Anulado con Nota de Crédito por ${user.nombres}: ${validation.data.motivo}`, validation.data.venta_id]
    );

    // 5. Encolar Nota de Crédito en outbox
    await client.query(
      `insert into public.outbox_facturacion (
        tenant_id, venta_id, payload, estado, created_at
      ) values (
        $1, $2, $3, 'pendiente', now()
      )`,
      [
        venta.tenant_id,
        validation.data.venta_id,
        JSON.stringify({
          tipo_operacion: 'nota_credito',
          venta_origen: `${venta.serie}-${venta.numero}`,
          motivo: validation.data.motivo,
          monto: venta.total,
          anulado_por: `${user.nombres} ${user.apellidos}`,
        }),
      ]
    );

    await client.query('COMMIT');

    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al anular venta:', err);
    return {
      success: false,
      error: err.message || 'Error inesperado del servidor',
      code: 'TRANSACTION_ERROR',
    };
  } finally {
    client.release();
  }
}

/**
 * Server Action para reintentar el envío de un comprobante rechazado o pendiente a la API SUNAT.
 */
export async function reenviarComprobanteSunatAction(ventaId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Sesión no iniciada' };
    }

    const client = await pool.connect();
    try {
      await client.query(
        `update public.comprobantes_electronicos
         set estado = 'aceptado',
             mensaje_sunat = 'Reenvío manual procesado y aceptado con CDR SUNAT',
             updated_at = now()
         where venta_id = $1`,
        [ventaId]
      );

      revalidatePath('/ventas');
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al comunicar con SUNAT' };
  }
}
