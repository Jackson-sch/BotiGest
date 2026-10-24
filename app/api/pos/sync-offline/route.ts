import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      offline_id,
      sucursal_id,
      caja_id,
      turno_id,
      cliente_id,
      tipo_comprobante,
      metodo_pago,
      subtotal,
      igv,
      total,
      items,
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verificar si ya fue insertada para evitar duplicados
      const checkExist = await client.query(
        `SELECT id FROM public.ventas WHERE offline_id = $1`,
        [offline_id]
      );

      if (checkExist.rowCount && checkExist.rowCount > 0) {
        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: 'Venta ya sincronizada previamente' });
      }

      // 2. Obtener serie y correlativo para la caja y comprobante
      const resSerie = await client.query(
        `SELECT serie, ultimo_numero FROM public.series_comprobante 
         WHERE sucursal_id = $1 AND caja_id = $2 AND tipo = $3 FOR UPDATE`,
        [sucursal_id, caja_id, tipo_comprobante]
      );

      let serie = 'B001';
      let numero = 1;
      if (resSerie.rowCount && resSerie.rowCount > 0) {
        serie = resSerie.rows[0].serie;
        numero = resSerie.rows[0].ultimo_numero + 1;
        await client.query(
          `UPDATE public.series_comprobante SET ultimo_numero = $1 WHERE sucursal_id = $2 AND caja_id = $3 AND tipo = $4`,
          [numero, sucursal_id, caja_id, tipo_comprobante]
        );
      }

      // 3. Insertar venta
      const insertVentaSql = `
        INSERT INTO public.ventas (
          tenant_id, sucursal_id, caja_id, turno_id, offline_id,
          cliente_id, vendedor_id, tipo_comprobante, serie, numero,
          subtotal_gravado, igv, total, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completada')
        RETURNING id;
      `;

      const resVenta = await client.query(insertVentaSql, [
        user.tenantId,
        sucursal_id,
        caja_id,
        turno_id,
        offline_id,
        cliente_id || null,
        user.id,
        tipo_comprobante,
        serie,
        numero,
        subtotal,
        igv,
        total,
      ]);

      const ventaId = resVenta.rows[0].id;

      // 4. Insertar items y descontar stock
      for (const it of items) {
        await client.query(
          `INSERT INTO public.venta_items (
            tenant_id, venta_id, producto_id, presentacion_id, descripcion,
            cantidad, factor_base, precio_unitario, descuento, tipo_afectacion_igv,
            valor_venta, igv, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            user.tenantId,
            ventaId,
            it.producto_id,
            it.presentacion_id,
            it.descripcion,
            it.cantidad,
            it.factor_base || 1,
            it.precio_unitario,
            it.descuento || 0,
            it.tipo_afectacion_igv || 'gravado',
            it.valor_venta,
            it.igv,
            it.total,
          ]
        );

        // Descontar stock_lotes
        const cantBaseTotal = it.cantidad * (it.factor_base || 1);
        await client.query(
          `UPDATE public.stock_lotes 
           SET cantidad_base = GREATEST(0, cantidad_base - $1), updated_at = now()
           WHERE sucursal_id = $2 AND lote_id = $3`,
          [cantBaseTotal, sucursal_id, it.lote_id]
        );

        // Kardex
        await client.query(
          `INSERT INTO public.movimientos_stock (
            tenant_id, sucursal_id, lote_id, producto_id, tipo,
            cantidad_base, referencia_tipo, referencia_id, observacion, usuario_id
          ) VALUES ($1, $2, $3, $4, 'venta', $5, 'venta', $6, $7, $8)`,
          [
            user.tenantId,
            sucursal_id,
            it.lote_id,
            it.producto_id,
            -cantBaseTotal,
            ventaId,
            `Venta Sincronizada Offline ${serie}-${numero}`,
            user.id,
          ]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, ventaId, comprobante: `${serie}-${numero}` });
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Error en transacción de sync offline:', e);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error general en endpoint sync offline:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
