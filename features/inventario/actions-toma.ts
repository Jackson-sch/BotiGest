'use server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface IniciarTomaInput {
  sucursalId: string;
  observaciones?: string;
}

/**
 * 1. Inicia una nueva toma de inventario físico capturando una instantánea del stock actual.
 */
export async function iniciarTomaInventarioAction(input: IniciarTomaInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const seqRes = await client.query(`SELECT count(*) as total FROM public.inventario_tomas`);
    const codigo = `AUD-${String(Number(seqRes.rows[0].total) + 1).padStart(5, '0')}`;

    const resToma = await client.query(
      `INSERT INTO public.inventario_tomas (
        tenant_id, sucursal_id, codigo, estado, responsable_id, observaciones
      ) VALUES ($1, $2, $3, 'en_progreso', $4, $5)
      RETURNING id;`,
      [user.tenantId, input.sucursalId, codigo, user.id, input.observaciones || 'Auditoría periódica de inventario físico']
    );

    const tomaId = resToma.rows[0].id;

    // Snapshot de todos los lotes con stock en la sucursal
    const resStock = await client.query(
      `SELECT sl.producto_id, sl.lote_id, sl.cantidad_base, coalesce(p.costo_promedio, 0) as costo_promedio
       FROM public.stock_lotes sl
       JOIN public.productos p ON p.id = sl.producto_id
       WHERE sl.sucursal_id = $1`,
      [input.sucursalId]
    );

    for (const row of resStock.rows) {
      await client.query(
        `INSERT INTO public.inventario_toma_items (
          toma_id, producto_id, lote_id, stock_sistema, stock_fisico, diferencia, costo_promedio
        ) VALUES ($1, $2, $3, $4, $4, 0, $5)`,
        [tomaId, row.producto_id, row.lote_id, row.cantidad_base, row.costo_promedio]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/inventario');
    return { success: true, tomaId, codigo };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al iniciar toma de inventario:', error);
    return { success: false, error: error.message || 'Error al iniciar toma' };
  } finally {
    client.release();
  }
}

/**
 * 2. Cierra y aplica la auditoría de inventario ajustando el stock real y kardex.
 */
export async function aplicarTomaInventarioAction(
  tomaId: string,
  conteosFisicos: Record<string, number>, // itemId -> stock_fisico contado
  justificaciones?: Record<string, string>
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resToma = await client.query(
      `SELECT * FROM public.inventario_tomas WHERE id = $1 FOR UPDATE`,
      [tomaId]
    );

    if (resToma.rowCount === 0) {
      throw new Error('Toma de inventario no encontrada');
    }
    const toma = resToma.rows[0];
    if (toma.estado !== 'en_progreso') {
      throw new Error('La toma de inventario ya se encuentra finalizada o anulada.');
    }

    const resItems = await client.query(
      `SELECT * FROM public.inventario_toma_items WHERE toma_id = $1`,
      [tomaId]
    );

    for (const item of resItems.rows) {
      const stockFisico = conteosFisicos[item.id] !== undefined ? conteosFisicos[item.id] : item.stock_sistema;
      const diferencia = stockFisico - item.stock_sistema;
      const justif = justificaciones ? justificaciones[item.id] : null;

      // Actualizar el item de la toma
      await client.query(
        `UPDATE public.inventario_toma_items 
         SET stock_fisico = $1, diferencia = $2, justificacion = $3 
         WHERE id = $4`,
        [stockFisico, diferencia, justif, item.id]
      );

      // Si hay diferencia, ajustar el stock_lotes y asentar en kardex
      if (diferencia !== 0) {
        await client.query(
          `UPDATE public.stock_lotes 
           SET cantidad_base = $1, updated_at = now() 
           WHERE sucursal_id = $2 AND lote_id = $3`,
          [stockFisico, toma.sucursal_id, item.lote_id]
        );

        const tipoKardex = diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo';
        await client.query(
          `INSERT INTO public.movimientos_stock (
            tenant_id, sucursal_id, lote_id, producto_id, tipo,
            cantidad_base, saldo_lote_posterior, referencia_tipo, referencia_id,
            observacion, usuario_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'auditoria_inventario', $8, $9, $10)`,
          [
            user.tenantId,
            toma.sucursal_id,
            item.lote_id,
            item.producto_id,
            tipoKardex,
            diferencia,
            stockFisico,
            toma.id,
            `Ajuste por toma de inventario ${toma.codigo}. ${justif || 'Auditoría física'}`,
            user.id,
          ]
        );
      }
    }

    // Marcar toma como aplicada
    await client.query(
      `UPDATE public.inventario_tomas 
       SET estado = 'aplicado', fecha_cierre = now(), updated_at = now() 
       WHERE id = $1`,
      [tomaId]
    );

    await client.query('COMMIT');
    revalidatePath('/inventario');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al aplicar toma de inventario:', error);
    return { success: false, error: error.message || 'Error al aplicar toma' };
  } finally {
    client.release();
  }
}
