'use server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface CrearTransferenciaInput {
  sucursalOrigenId: string;
  sucursalDestinoId: string;
  motivo?: string;
  observaciones?: string;
  items: {
    productoId: string;
    loteId: string;
    cantidad: number;
  }[];
}

/**
 * 1. Crea una solicitud de transferencia en estado 'borrador' o 'en_transito'
 */
export async function crearTransferenciaAction(input: CrearTransferenciaInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  if (input.sucursalOrigenId === input.sucursalDestinoId) {
    return { success: false, error: 'La sucursal de origen y destino no pueden ser la misma.' };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'Debe incluir al menos un producto a transferir.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generar correlativo o guía interna
    const seqResult = await client.query(`SELECT count(*) as total FROM public.transferencias`);
    const numGuia = `TR-${String(Number(seqResult.rows[0].total) + 1).padStart(6, '0')}`;

    const insertTransfSql = `
      INSERT INTO public.transferencias (
        tenant_id,
        sucursal_origen_id,
        sucursal_destino_id,
        numero_guia,
        estado,
        solicitado_por,
        motivo,
        observaciones
      ) VALUES ($1, $2, $3, $4, 'borrador', $5, $6, $7)
      RETURNING id;
    `;

    const resTransf = await client.query(insertTransfSql, [
      user.tenantId,
      input.sucursalOrigenId,
      input.sucursalDestinoId,
      numGuia,
      user.id,
      input.motivo || 'Reposición regular de stock',
      input.observaciones || null,
    ]);

    const transferenciaId = resTransf.rows[0].id;

    for (const item of input.items) {
      await client.query(
        `INSERT INTO public.transferencia_items (
          transferencia_id, producto_id, lote_id, cantidad_solicitada
        ) VALUES ($1, $2, $3, $4)`,
        [transferenciaId, item.productoId, item.loteId, item.cantidad]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/inventario/traslados');
    return { success: true, transferenciaId, numeroGuia: numGuia };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al crear transferencia:', error);
    return { success: false, error: error.message || 'Error al crear transferencia' };
  } finally {
    client.release();
  }
}

/**
 * 2. Despachar transferencia (Salida de stock en Sede Origen)
 */
export async function despacharTransferenciaAction(transferenciaId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resT = await client.query(
      `SELECT * FROM public.transferencias WHERE id = $1 FOR UPDATE`,
      [transferenciaId]
    );

    if (resT.rowCount === 0) {
      throw new Error('Transferencia no encontrada');
    }
    const t = resT.rows[0];
    if (t.estado !== 'borrador') {
      throw new Error(`La transferencia ya se encuentra en estado: ${t.estado}`);
    }

    // Obtener items
    const resItems = await client.query(
      `SELECT * FROM public.transferencia_items WHERE transferencia_id = $1`,
      [transferenciaId]
    );

    for (const item of resItems.rows) {
      const cant = item.cantidad_solicitada;

      // Verificar y descontar stock en origen
      const resStock = await client.query(
        `SELECT cantidad_base FROM public.stock_lotes 
         WHERE sucursal_id = $1 AND lote_id = $2 FOR UPDATE`,
        [t.sucursal_origen_id, item.lote_id]
      );

      const stockActual = resStock.rows[0]?.cantidad_base || 0;
      if (stockActual < cant) {
        throw new Error(
          `Stock insuficiente en sucursal de origen para el lote. Disponible: ${stockActual}, Requerido: ${cant}`
        );
      }

      const nuevoStock = stockActual - cant;
      await client.query(
        `UPDATE public.stock_lotes 
         SET cantidad_base = $1, updated_at = now()
         WHERE sucursal_id = $2 AND lote_id = $3`,
        [nuevoStock, t.sucursal_origen_id, item.lote_id]
      );

      // Registrar movimiento kardex: transferencia_salida
      await client.query(
        `INSERT INTO public.movimientos_stock (
          tenant_id, sucursal_id, lote_id, producto_id, tipo,
          cantidad_base, saldo_lote_posterior, referencia_tipo, referencia_id,
          observacion, usuario_id
        ) VALUES ($1, $2, $3, $4, 'transferencia_salida', $5, $6, 'transferencia', $7, $8, $9)`,
        [
          user.tenantId,
          t.sucursal_origen_id,
          item.lote_id,
          item.producto_id,
          -cant,
          nuevoStock,
          transferenciaId,
          `Salida por traslado ${t.numero_guia} hacia destino`,
          user.id,
        ]
      );

      // Actualizar cantidad despachada
      await client.query(
        `UPDATE public.transferencia_items 
         SET cantidad_despachada = $1 
         WHERE id = $2`,
        [cant, item.id]
      );
    }

    // Cambiar estado a en_transito
    await client.query(
      `UPDATE public.transferencias 
       SET estado = 'en_transito', despachado_por = $1, fecha_despacho = now(), updated_at = now()
       WHERE id = $2`,
      [user.id, transferenciaId]
    );

    await client.query('COMMIT');
    revalidatePath('/inventario/traslados');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al despachar transferencia:', error);
    return { success: false, error: error.message || 'Error al despachar transferencia' };
  } finally {
    client.release();
  }
}

/**
 * 3. Recepcionar transferencia (Ingreso de stock en Sede Destino)
 */
export async function recepcionarTransferenciaAction(
  transferenciaId: string,
  cantidadesRecibidas?: Record<string, number>
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resT = await client.query(
      `SELECT * FROM public.transferencias WHERE id = $1 FOR UPDATE`,
      [transferenciaId]
    );

    if (resT.rowCount === 0) {
      throw new Error('Transferencia no encontrada');
    }
    const t = resT.rows[0];
    if (t.estado !== 'en_transito') {
      throw new Error('Solo se pueden recepcionar traslados en tránsito');
    }

    const resItems = await client.query(
      `SELECT * FROM public.transferencia_items WHERE transferencia_id = $1`,
      [transferenciaId]
    );

    for (const item of resItems.rows) {
      const cantRecibida = cantidadesRecibidas && cantidadesRecibidas[item.id] !== undefined
        ? cantidadesRecibidas[item.id]
        : item.cantidad_despachada;

      if (cantRecibida < 0) {
        throw new Error('La cantidad recibida no puede ser negativa');
      }

      // Upsert stock_lotes en sucursal_destino
      const resStock = await client.query(
        `SELECT cantidad_base FROM public.stock_lotes 
         WHERE sucursal_id = $1 AND lote_id = $2 FOR UPDATE`,
        [t.sucursal_destino_id, item.lote_id]
      );

      let nuevoStock = cantRecibida;
      if (resStock.rowCount && resStock.rowCount > 0) {
        nuevoStock = resStock.rows[0].cantidad_base + cantRecibida;
        await client.query(
          `UPDATE public.stock_lotes 
           SET cantidad_base = $1, updated_at = now() 
           WHERE sucursal_id = $2 AND lote_id = $3`,
          [nuevoStock, t.sucursal_destino_id, item.lote_id]
        );
      } else {
        await client.query(
          `INSERT INTO public.stock_lotes (
            tenant_id, sucursal_id, lote_id, producto_id, cantidad_base, estado
          ) VALUES ($1, $2, $3, $4, $5, 'disponible')`,
          [user.tenantId, t.sucursal_destino_id, item.lote_id, item.producto_id, cantRecibida]
        );
      }

      // Registrar kardex: transferencia_entrada
      await client.query(
        `INSERT INTO public.movimientos_stock (
          tenant_id, sucursal_id, lote_id, producto_id, tipo,
          cantidad_base, saldo_lote_posterior, referencia_tipo, referencia_id,
          observacion, usuario_id
        ) VALUES ($1, $2, $3, $4, 'transferencia_entrada', $5, $6, 'transferencia', $7, $8, $9)`,
        [
          user.tenantId,
          t.sucursal_destino_id,
          item.lote_id,
          item.producto_id,
          cantRecibida,
          nuevoStock,
          transferenciaId,
          `Ingreso por traslado ${t.numero_guia} desde sede origen`,
          user.id,
        ]
      );

      await client.query(
        `UPDATE public.transferencia_items 
         SET cantidad_recibida = $1 
         WHERE id = $2`,
        [cantRecibida, item.id]
      );
    }

    await client.query(
      `UPDATE public.transferencias 
       SET estado = 'recibida', recibido_por = $1, fecha_recepcion = now(), updated_at = now() 
       WHERE id = $2`,
      [user.id, transferenciaId]
    );

    await client.query('COMMIT');
    revalidatePath('/inventario/traslados');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al recepcionar transferencia:', error);
    return { success: false, error: error.message || 'Error al recepcionar transferencia' };
  } finally {
    client.release();
  }
}
