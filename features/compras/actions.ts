'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import {
  registrarCompraSchema,
  recibirCompraSchema,
  anularCompraSchema,
  actualizarCompraSchema,
  type RegistrarCompraInput,
  type RecibirCompraInput,
  type AnularCompraInput,
  type ActualizarCompraInput,
} from './schemas';
import { revalidatePath } from 'next/cache';

export interface CompraResult {
  success: boolean;
  compraId?: string;
  error?: string;
  code?: string;
}

/**
 * Server Action para registrar una compra en estado Borrador
 * Permite a Logística/Almacén o Administración registrar comprobantes de distribuidoras farmacéuticas.
 */
export async function registrarCompraAction(input: RegistrarCompraInput): Promise<CompraResult> {
  const validation = registrarCompraSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para registrar compras.' };
  }

  if (!['almacenero', 'administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return { success: false, error: 'Su rol no tiene autorización para registrar compras de mercadería.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener tenant y sucursal predeterminada si no fue especificada
    const tenantRes = await client.query(
      `select id from public.tenants where activo = true limit 1`
    );
    const tenantId = tenantRes.rows[0]?.id;

    let sucursalId = validation.data.sucursal_id;
    if (!sucursalId) {
      const sucRes = await client.query(
        `select id from public.sucursales where tenant_id = $1 and activo = true limit 1`,
        [tenantId]
      );
      sucursalId = sucRes.rows[0]?.id;
    }

    // 2. Calcular importes totales de los ítems
    let totalCompra = 0;
    for (const item of validation.data.items) {
      totalCompra += Number((item.cantidad * item.costo_unitario_presentacion).toFixed(2));
    }

    const subtotal = Number((totalCompra / 1.18).toFixed(2));
    const igv = Number((totalCompra - subtotal).toFixed(2));

    // 3. Insertar cabecera de la compra
    const insCompra = await client.query(
      `insert into public.compras (
        tenant_id, sucursal_id, proveedor_id, tipo_documento,
        serie_numero, fecha_emision, moneda, subtotal, igv, total,
        estado, observacion, created_at
      ) values (
        $1, $2, $3, $4,
        $5, $6, 'PEN', $7, $8, $9,
        'borrador', $10, now()
      ) returning id`,
      [
        tenantId,
        sucursalId,
        validation.data.proveedor_id,
        validation.data.tipo_documento,
        validation.data.serie_numero,
        validation.data.fecha_emision,
        subtotal,
        igv,
        totalCompra,
        validation.data.observacion || null,
      ]
    );

    const compraId = insCompra.rows[0].id;

    // 4. Insertar ítems de compra
    for (const it of validation.data.items) {
      await client.query(
        `insert into public.compra_items (
          compra_id, producto_id, presentacion_id, numero_lote,
          fecha_vencimiento, cantidad, factor_base, costo_unitario_presentacion
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )`,
        [
          compraId,
          it.producto_id,
          it.presentacion_id,
          it.numero_lote,
          it.fecha_vencimiento,
          it.cantidad,
          it.factor_base,
          it.costo_unitario_presentacion,
        ]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/compras');

    return { success: true, compraId };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al registrar compra:', err);
    return { success: false, error: err.message || 'Error al guardar la compra' };
  } finally {
    client.release();
  }
}

/**
 * Server Action para procesar la recepción física de mercadería (`recibirCompraAction`).
 * Crea/actualiza los lotes en `public.lotes`, actualiza el stock en `public.stock_lotes`,
 * genera los asientos en el Kardex (`movimientos_stock`), recalcula costo promedio ponderado
 * y actualiza libros controlados si aplica (cumplimiento DIGEMID).
 */
export async function recibirCompraAction(input: RecibirCompraInput): Promise<CompraResult> {
  const validation = recibirCompraSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para recibir mercadería.' };
  }

  if (!['almacenero', 'director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return { success: false, error: 'No está autorizado para procesar ingresos físicos a almacén.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar compra
    const compraRes = await client.query(
      `select id, tenant_id, sucursal_id, estado, serie_numero 
       from public.compras 
       where id = $1 for update`,
      [validation.data.compra_id]
    );

    if (compraRes.rows.length === 0) {
      throw new Error('Compra no encontrada.');
    }

    const compra = compraRes.rows[0];
    if (compra.estado !== 'borrador') {
      throw new Error('Esta compra ya ha sido recibida o anulada previamente.');
    }

    // 2. Obtener todos los ítems de la compra
    const itemsRes = await client.query(
      `select 
         ci.id as item_id,
         ci.producto_id,
         ci.numero_lote,
         ci.fecha_vencimiento,
         ci.cantidad,
         ci.factor_base,
         ci.costo_unitario_presentacion::numeric as costo_unitario_presentacion,
         p.nombre_comercial,
         p.es_controlado,
         p.costo_promedio::numeric as costo_promedio,
         p.costo_ultimo::numeric as costo_ultimo
       from public.compra_items ci
       join public.productos p on p.id = ci.producto_id
       where ci.compra_id = $1`,
      [validation.data.compra_id]
    );

    if (itemsRes.rows.length === 0) {
      throw new Error('La compra no tiene ítems registrados para recibir.');
    }

    // 3. Procesar cada ítem
    for (const item of itemsRes.rows) {
      const cantBase = item.cantidad * item.factor_base;
      const costoUnitarioBase = Number((item.costo_unitario_presentacion / item.factor_base).toFixed(6));

      // a. Buscar o insertar lote en public.lotes
      const loteExistente = await client.query(
        `select id from public.lotes 
         where producto_id = $1 and numero_lote = $2 and fecha_vencimiento = $3`,
        [item.producto_id, item.numero_lote, item.fecha_vencimiento]
      );

      let loteId: string;
      if (loteExistente.rows.length > 0) {
        loteId = loteExistente.rows[0].id;
      } else {
        const insLote = await client.query(
          `insert into public.lotes (tenant_id, producto_id, numero_lote, fecha_vencimiento, created_at)
           values ($1, $2, $3, $4, now())
           returning id`,
          [compra.tenant_id, item.producto_id, item.numero_lote, item.fecha_vencimiento]
        );
        loteId = insLote.rows[0].id;
      }

      // Asociar lote_id al compra_item
      await client.query(
        `update public.compra_items set lote_id = $1 where id = $2`,
        [loteId, item.item_id]
      );

      // b. Upsert en public.stock_lotes
      const upsertStock = await client.query(
        `insert into public.stock_lotes (
          tenant_id, sucursal_id, lote_id, producto_id, cantidad_base, estado, updated_at
        ) values (
          $1, $2, $3, $4, $5, 'disponible', now()
        )
        on conflict (sucursal_id, lote_id) do update set
          cantidad_base = public.stock_lotes.cantidad_base + EXCLUDED.cantidad_base,
          updated_at = now()
        returning cantidad_base`,
        [compra.tenant_id, compra.sucursal_id, loteId, item.producto_id, cantBase]
      );

      const saldoLotePosterior = upsertStock.rows[0].cantidad_base;

      // c. Registrar movimiento en Kardex (movimientos_stock)
      await client.query(
        `insert into public.movimientos_stock (
          tenant_id, sucursal_id, lote_id, producto_id, tipo,
          cantidad_base, costo_unitario_base, saldo_lote_posterior,
          referencia_tipo, referencia_id, observacion, usuario_id, created_at
        ) values (
          $1, $2, $3, $4, 'compra',
          $5, $6, $7,
          'compra', $8, $9, $10, now()
        )`,
        [
          compra.tenant_id,
          compra.sucursal_id,
          loteId,
          item.producto_id,
          cantBase,
          costoUnitarioBase,
          saldoLotePosterior,
          compra.id,
          `Ingreso por Compra ${compra.serie_numero} (Lote: ${item.numero_lote})`,
          user.id,
        ]
      );

      // d. Recalcular costo promedio ponderado y costo último en public.productos
      const stockTotalRes = await client.query(
        `select coalesce(sum(cantidad_base), 0)::integer as stock_total 
         from public.stock_lotes 
         where producto_id = $1`,
        [item.producto_id]
      );
      const stockTotalActual = stockTotalRes.rows[0].stock_total;

      const costoPromedioAnterior = Number(item.costo_promedio) || costoUnitarioBase;
      const stockAnterior = Math.max(0, stockTotalActual - cantBase);

      const nuevoCostoPromedio = stockTotalActual > 0
        ? Number(((costoPromedioAnterior * stockAnterior + costoUnitarioBase * cantBase) / stockTotalActual).toFixed(6))
        : costoUnitarioBase;

      await client.query(
        `update public.productos
         set costo_ultimo = $1,
             costo_promedio = $2,
             updated_at = now()
         where id = $3`,
        [costoUnitarioBase, nuevoCostoPromedio, item.producto_id]
      );

      // e. Si es controlado, asentar en libro de controlados
      if (item.es_controlado) {
        await client.query(
          `insert into public.libro_controlados (
            tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
            cantidad_base, saldo_posterior, referencia_tipo, referencia_id,
            registrado_por, created_at
          ) values (
            $1, $2, $3, $4, 'compra',
            $5, $6, 'compra', $7,
            $8, now()
          )`,
          [
            compra.tenant_id,
            compra.sucursal_id,
            item.producto_id,
            loteId,
            cantBase,
            saldoLotePosterior,
            compra.id,
            user.id,
          ]
        );
      }
    }

    // 4. Marcar compra como recibida
    await client.query(
      `update public.compras 
       set estado = 'recibida',
           fecha_recepcion = current_date,
           updated_at = now()
       where id = $1`,
      [validation.data.compra_id]
    );

    await client.query('COMMIT');

    revalidatePath('/compras');
    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/controlados');
    revalidatePath('/');

    return { success: true, compraId: validation.data.compra_id };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al recibir compra:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar la recepción de mercadería',
      code: 'TRANSACTION_ERROR',
    };
  } finally {
    client.release();
  }
}

/**
 * Server Action para anular una factura de compra.
 * - Si está en 'borrador': anulación directa sin tocar inventario.
 * - Si está en 'recibida': valida que ningún lote haya sido vendido parcialmente;
 *   revierte el stock en `stock_lotes` y genera los asientos de salida en Kardex (`movimientos_stock`).
 */
export async function anularCompraAction(input: AnularCompraInput): Promise<CompraResult> {
  const validation = anularCompraSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para anular compras.' };
  }

  if (!['administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return { success: false, error: 'Solo el Administrador o Director Técnico pueden anular compras.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener la compra con bloqueo de fila
    const compraRes = await client.query(
      `select id, tenant_id, sucursal_id, estado, serie_numero, observacion 
       from public.compras 
       where id = $1 for update`,
      [validation.data.compra_id]
    );

    if (compraRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'La compra especificada no existe.' };
    }

    const compra = compraRes.rows[0];

    if (compra.estado === 'anulada') {
      await client.query('ROLLBACK');
      return { success: false, error: 'Esta factura de compra ya se encuentra anulada.' };
    }

    const obsActual = compra.observacion ? `${compra.observacion} | ` : '';
    const nuevaObservacion = `${obsActual}ANULADO por ${user.nombres}: ${validation.data.motivo.trim()}`;

    // 2. Si estaba en BORRADOR: anulación directa sin afectar Kardex
    if (compra.estado === 'borrador') {
      await client.query(
        `update public.compras 
         set estado = 'anulada',
             observacion = $1,
             updated_at = now()
         where id = $2`,
        [nuevaObservacion, compra.id]
      );

      await client.query('COMMIT');

      revalidatePath('/compras');
      revalidatePath('/compras', 'page');
      revalidatePath('/inventario');

      return { success: true, compraId: compra.id };
    }

    // 3. Si estaba RECIBIDA: validar que el stock de cada lote no se haya vendido
    if (compra.estado === 'recibida') {
      const itemsRes = await client.query(
        `select 
           ci.id,
           ci.producto_id,
           ci.lote_id,
           ci.numero_lote,
           (ci.cantidad * ci.factor_base)::integer as cantidad_base_recibida,
           ci.costo_unitario_presentacion,
           ci.factor_base,
           p.nombre_comercial,
           p.es_controlado,
           coalesce(sl.cantidad_base, 0)::integer as stock_lote_disponible
         from public.compra_items ci
         join public.productos p on p.id = ci.producto_id
         left join public.stock_lotes sl on sl.lote_id = ci.lote_id and sl.sucursal_id = $2
         where ci.compra_id = $1`,
        [compra.id, compra.sucursal_id]
      );

      const items = itemsRes.rows;

      // a. Verificar si alguno ya tiene unidades vendidas
      for (const it of items) {
        if (!it.lote_id) continue;
        if (it.stock_lote_disponible < it.cantidad_base_recibida) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: `No se puede anular la compra: El producto "${it.nombre_comercial}" (Lote: ${it.numero_lote}) ya tiene unidades vendidas o comprometidas (Stock disponible: ${it.stock_lote_disponible}, Cantidad ingresada en compra: ${it.cantidad_base_recibida}). Gestione una Devolución a Proveedor por el saldo restante.`,
          };
        }
      }

      // b. Revertir stock de cada lote y asentar en Kardex
      for (const it of items) {
        if (!it.lote_id) continue;

        // Descontar de stock_lotes
        const updStock = await client.query(
          `update public.stock_lotes
           set cantidad_base = cantidad_base - $1,
               updated_at = now()
           where sucursal_id = $2 and lote_id = $3
           returning cantidad_base`,
          [it.cantidad_base_recibida, compra.sucursal_id, it.lote_id]
        );

        const nuevoSaldoLote = updStock.rows[0]?.cantidad_base || 0;
        const costoUnitBase = Number((it.costo_unitario_presentacion / it.factor_base).toFixed(6));

        // Registrar salida en movimientos_stock (Kardex)
        await client.query(
          `insert into public.movimientos_stock (
            tenant_id, sucursal_id, lote_id, producto_id, tipo,
            cantidad_base, costo_unitario_base, saldo_lote_posterior,
            referencia_tipo, referencia_id, observacion, usuario_id, created_at
          ) values (
            $1, $2, $3, $4, 'devolucion_proveedor',
            $5, $6, $7,
            'compra', $8, $9, $10, now()
          )`,
          [
            compra.tenant_id,
            compra.sucursal_id,
            it.lote_id,
            it.producto_id,
            it.cantidad_base_recibida,
            costoUnitBase,
            nuevoSaldoLote,
            compra.id,
            `Salida por Anulación de Compra ${compra.serie_numero}: ${validation.data.motivo.trim()}`,
            user.id,
          ]
        );

        // Si es controlado, asentar salida en libro de controlados
        if (it.es_controlado) {
          await client.query(
            `insert into public.libro_controlados (
              tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
              cantidad_base, saldo_posterior, referencia_tipo, referencia_id,
              registrado_por, created_at
            ) values (
              $1, $2, $3, $4, 'devolucion_proveedor',
              $5, $6, 'compra', $7,
              $8, now()
            )`,
            [
              compra.tenant_id,
              compra.sucursal_id,
              it.producto_id,
              it.lote_id,
              it.cantidad_base_recibida,
              nuevoSaldoLote,
              compra.id,
              user.id,
            ]
          );
        }
      }

      // c. Marcar la compra como anulada
      await client.query(
        `update public.compras 
         set estado = 'anulada',
             observacion = $1,
             updated_at = now()
         where id = $2`,
        [nuevaObservacion, compra.id]
      );

      await client.query('COMMIT');

      revalidatePath('/compras');
      revalidatePath('/compras', 'page');
      revalidatePath('/inventario');
      revalidatePath('/pos');
      revalidatePath('/controlados');
      revalidatePath('/');

      return { success: true, compraId: compra.id };
    }

    await client.query('ROLLBACK');
    return { success: false, error: 'Estado de compra no válido para anulación.' };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al anular compra:', err);
    return {
      success: false,
      error: err.message || 'Error al anular la compra',
      code: 'TRANSACTION_ERROR',
    };
  } finally {
    client.release();
  }
}

/**
 * Server Action para modificar una compra en estado Borrador.
 * Permite agregar, remover o editar medicamentos, cantidades, costos, lotes y vencimientos
 * antes de que la compra sea recibida formalmente en almacén.
 */
export async function actualizarCompraAction(input: ActualizarCompraInput): Promise<CompraResult> {
  const validation = actualizarCompraSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para modificar compras.' };
  }

  if (!['almacenero', 'administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return { success: false, error: 'Su rol no tiene autorización para modificar compras de mercadería.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Bloquear y verificar estado de la compra
    const compraRes = await client.query(
      `select id, estado, serie_numero 
       from public.compras 
       where id = $1 
       for update`,
      [validation.data.compra_id]
    );

    if (compraRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'La compra no existe o fue eliminada.' };
    }

    const compra = compraRes.rows[0];

    if (compra.estado === 'recibida') {
      await client.query('ROLLBACK');
      return {
        success: false,
        error:
          'No se puede modificar una compra que ya fue recibida en almacén (Kardex y stock ya fueron afectados). Si requiere corrección física, use la anulación formal de comprobante.',
      };
    }

    if (compra.estado === 'anulada') {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'No se puede modificar una compra en estado anulada.',
      };
    }

    // 2. Calcular importes totales de los ítems actualizados
    let totalCompra = 0;
    for (const item of validation.data.items) {
      totalCompra += Number((item.cantidad * item.costo_unitario_presentacion).toFixed(2));
    }

    const subtotal = Number((totalCompra / 1.18).toFixed(2));
    const igv = Number((totalCompra - subtotal).toFixed(2));

    // 3. Actualizar cabecera de la compra
    await client.query(
      `update public.compras
       set 
         proveedor_id = $1,
         tipo_documento = $2,
         serie_numero = $3,
         fecha_emision = $4,
         subtotal = $5,
         igv = $6,
         total = $7,
         observacion = $8,
         updated_at = now()
       where id = $9`,
      [
        validation.data.proveedor_id,
        validation.data.tipo_documento,
        validation.data.serie_numero,
        validation.data.fecha_emision,
        subtotal,
        igv,
        totalCompra,
        validation.data.observacion || null,
        compra.id,
      ]
    );

    // 4. Eliminar ítems anteriores y registrar la nueva lista
    await client.query(
      `delete from public.compra_items where compra_id = $1`,
      [compra.id]
    );

    for (const it of validation.data.items) {
      await client.query(
        `insert into public.compra_items (
          compra_id, producto_id, presentacion_id, numero_lote,
          fecha_vencimiento, cantidad, factor_base, costo_unitario_presentacion
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )`,
        [
          compra.id,
          it.producto_id,
          it.presentacion_id,
          it.numero_lote,
          it.fecha_vencimiento,
          it.cantidad,
          it.factor_base,
          it.costo_unitario_presentacion,
        ]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/compras');
    revalidatePath('/compras', 'page');

    return { success: true, compraId: compra.id };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar compra borrador:', err);
    return { success: false, error: err.message || 'Error al actualizar la compra' };
  } finally {
    client.release();
  }
}

