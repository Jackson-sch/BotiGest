'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ajustarStockSchema, type AjustarStockInput } from './schemas';
import { revalidatePath } from 'next/cache';

export interface AjusteResult {
  success: boolean;
  error?: string;
  code?: string;
}

/**
 * Server Action para registrar un ajuste de stock, merma o baja por vencimiento.
 * Exige perfil de Químico Farmacéutico (director_tecnico) o Administrador.
 * Ejecuta la transacción atómica actualizando stock_lotes y registrando el asiento de Kardex.
 */
export async function ajustarStockAction(input: AjustarStockInput): Promise<AjusteResult> {
  const validation = ajustarStockSchema.safeParse(input);
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
      error: 'Debe iniciar sesión para realizar ajustes de inventario.',
      code: 'UNAUTHORIZED',
    };
  }

  // Cumplimiento DIGEMID Ley 29459: Las mermas, destrucción y desmedros solo pueden ser autorizados por el Director Técnico o Administrador
  if (!['director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return {
      success: false,
      error: 'Acción denegada por regulación DIGEMID: Solo el Director Técnico (Q.F.) o Administrador puede autorizar ajustes de inventario o bajas por merma.',
      code: 'FORBIDDEN',
    };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener lote y producto
    const loteRes = await client.query(
      `select sl.cantidad_base, sl.sucursal_id, sl.tenant_id, p.id as producto_id, p.es_controlado, p.costo_ultimo
       from public.stock_lotes sl
       join public.productos p on p.id = sl.producto_id
       where sl.lote_id = $1 and sl.sucursal_id = $2
       for update`,
      [validation.data.lote_id, validation.data.sucursal_id]
    );

    if (loteRes.rows.length === 0) {
      throw new Error('Lote no encontrado en la sucursal especificada.');
    }

    const loteInfo = loteRes.rows[0];
    const tipo = validation.data.tipo;
    const cantAjuste = validation.data.cantidad_base;

    let nuevoStock = loteInfo.cantidad_base;
    let deltaKardex = 0;

    if (tipo === 'ajuste_positivo') {
      nuevoStock += cantAjuste;
      deltaKardex = cantAjuste;
    } else {
      if (loteInfo.cantidad_base < cantAjuste) {
        throw new Error(`Stock insuficiente en el lote para realizar el ajuste negativo (Disponible: ${loteInfo.cantidad_base}).`);
      }
      nuevoStock -= cantAjuste;
      deltaKardex = -cantAjuste;
    }

    // 2. Actualizar stock_lotes
    await client.query(
      `update public.stock_lotes
       set cantidad_base = $1,
           estado = case when $1 = 0 then 'disponible' else estado end,
           updated_at = now()
       where lote_id = $2 and sucursal_id = $3`,
      [nuevoStock, validation.data.lote_id, validation.data.sucursal_id]
    );

    // 3. Registrar asiento en Kardex (movimientos_stock)
    await client.query(
      `insert into public.movimientos_stock (
        tenant_id, sucursal_id, lote_id, producto_id, tipo,
        cantidad_base, costo_unitario_base, saldo_lote_posterior,
        referencia_tipo, observacion, usuario_id, created_at
      ) values (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        'ajuste_manual', $9, $10, now()
      )`,
      [
        loteInfo.tenant_id,
        validation.data.sucursal_id,
        validation.data.lote_id,
        loteInfo.producto_id,
        tipo,
        deltaKardex,
        loteInfo.costo_ultimo,
        nuevoStock,
        `[${user.rol.toUpperCase()}] ${validation.data.motivo}`,
        user.id,
      ]
    );

    // 4. Si es controlado, asentar en libro de controlados
    if (loteInfo.es_controlado) {
      await client.query(
        `insert into public.libro_controlados (
          tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
          cantidad_base, saldo_posterior, referencia_tipo, registrado_por, validado_por, validado_at, created_at
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, 'ajuste_manual', $8,
          case when $9 = 'director_tecnico' then $8 else null end,
          case when $9 = 'director_tecnico' then now() else null end,
          now()
        )`,
        [
          loteInfo.tenant_id,
          validation.data.sucursal_id,
          loteInfo.producto_id,
          validation.data.lote_id,
          tipo,
          deltaKardex,
          nuevoStock,
          user.id,
          user.rol,
        ]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/controlados');

    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en ajustarStockAction:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar el ajuste de inventario',
      code: 'TRANSACTION_ERROR',
    };
  } finally {
    client.release();
  }
}

export interface OfertaLoteInput {
  producto_id: string;
  lote_id: string;
  descuento_porcentaje: number;
  precio_promocion?: number;
  motivo?: string;
}

/**
 * Server Action para lanzar una oferta / rebaja de precio promocional por vencimiento próximo FEFO.
 */
export async function lanzarOfertaLoteAction(
  input: OfertaLoteInput
): Promise<{ success: boolean; nuevoPrecio?: number; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para lanzar promociones.' };
  }
  if (!['director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return {
      success: false,
      error: 'Solo el Director Técnico o Administrador puede autorizar ofertas o descuentos de lotes.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const presRes = await client.query(
      `select id, precio_venta, nombre from public.producto_presentaciones
       where producto_id = $1 and activo = true
       order by es_default desc, factor_base asc
       limit 1`,
      [input.producto_id]
    );

    if (presRes.rows.length === 0) {
      throw new Error('No se encontró presentación activa para este producto.');
    }

    const pres = presRes.rows[0];
    const precioActual = Number(pres.precio_venta);
    const nuevoPrecio = input.precio_promocion
      ? Number(input.precio_promocion.toFixed(2))
      : Number((precioActual * (1 - input.descuento_porcentaje / 100)).toFixed(2));

    await client.query(
      `update public.producto_presentaciones
       set precio_venta = $1, updated_at = now()
       where id = $2`,
      [nuevoPrecio, pres.id]
    );

    await client.query('COMMIT');

    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/');

    return { success: true, nuevoPrecio };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en lanzarOfertaLoteAction:', err);
    return { success: false, error: err.message || 'Error al aplicar oferta.' };
  } finally {
    client.release();
  }
}

export interface DevolucionLoteInput {
  lote_id: string;
  sucursal_id?: string;
  cantidad: number;
  proveedor_nombre: string;
  guia_remision?: string;
  motivo: string;
}

/**
 * Server Action para registrar una devolución formal de lote a droguería o laboratorio.
 */
export async function devolverLoteAction(
  input: DevolucionLoteInput
): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para procesar devoluciones.' };
  }
  if (!['director_tecnico', 'administrador', 'propietario', 'almacenero'].includes(user.rol)) {
    return {
      success: false,
      error: 'No cuenta con autorización para procesar devoluciones a droguerías.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slRes = await client.query(
      `select sl.cantidad_base, sl.sucursal_id, sl.tenant_id, p.id as producto_id, p.es_controlado, p.costo_ultimo, l.numero_lote
       from public.stock_lotes sl
       join public.productos p on p.id = sl.producto_id
       join public.lotes l on l.id = sl.lote_id
       where sl.lote_id = $1 and sl.sucursal_id = coalesce($2, sl.sucursal_id)
       for update`,
      [input.lote_id, input.sucursal_id || null]
    );

    if (slRes.rows.length === 0) {
      throw new Error('Lote no encontrado para la sucursal.');
    }

    const sl = slRes.rows[0];
    if (sl.cantidad_base < input.cantidad) {
      throw new Error(
        `Stock insuficiente en el lote para devolver (Disponible: ${sl.cantidad_base}, Solicitado: ${input.cantidad}).`
      );
    }

    const nuevoStock = sl.cantidad_base - input.cantidad;

    await client.query(
      `update public.stock_lotes
       set cantidad_base = $1, updated_at = now()
       where lote_id = $2 and sucursal_id = $3`,
      [nuevoStock, input.lote_id, sl.sucursal_id]
    );

    await client.query(
      `insert into public.movimientos_stock (
        tenant_id, sucursal_id, lote_id, producto_id, tipo,
        cantidad_base, costo_unitario_base, saldo_lote_posterior,
        referencia_tipo, observacion, usuario_id, created_at
      ) values (
        $1, $2, $3, $4, 'devolucion_proveedor',
        $5, $6, $7,
        'devolucion_drogueria', $8, $9, now()
      )`,
      [
        sl.tenant_id,
        sl.sucursal_id,
        input.lote_id,
        sl.producto_id,
        -input.cantidad,
        sl.costo_ultimo,
        nuevoStock,
        `[DEVOLUCIÓN A DROGUERÍA] Proveedor: ${input.proveedor_nombre} | Guía/Acta: ${input.guia_remision || 'S/N'} | Motivo: ${input.motivo}`,
        user.id,
      ]
    );

    if (sl.es_controlado) {
      await client.query(
        `insert into public.libro_controlados (
          tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
          cantidad_base, saldo_posterior, referencia_tipo, registrado_por, validado_por, validado_at, created_at
        ) values (
          $1, $2, $3, $4, 'devolucion_proveedor',
          $5, $6, 'devolucion_drogueria', $7,
          case when $8 = 'director_tecnico' then $7 else null end,
          case when $8 = 'director_tecnico' then now() else null end,
          now()
        )`,
        [
          sl.tenant_id,
          sl.sucursal_id,
          sl.producto_id,
          input.lote_id,
          -input.cantidad,
          nuevoStock,
          user.id,
          user.rol,
        ]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/controlados');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en devolverLoteAction:', err);
    return { success: false, error: err.message || 'Error al procesar devolución.' };
  } finally {
    client.release();
  }
}

/**
 * Server Action para dar de baja definitiva un lote (por Vencimiento o Merma/Deterioro).
 * Restringido por regulación DIGEMID a Director Técnico (Q.F.) y Administrador.
 * Registra asiento en Kardex ('vencimiento' o 'merma') y descuenta stock_lotes.
 */
export async function darDeBajaLoteAction(input: {
  lote_id: string;
  sucursal_id?: string;
  cantidad: number;
  tipo_baja: 'vencimiento' | 'merma' | 'deterioro' | 'rotura' | 'observacion_sanitaria';
  motivo: string;
  acta_numero?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para procesar bajas de inventario.' };
  }

  if (!['director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return {
      success: false,
      error: 'Acción denegada por DIGEMID: La baja y destrucción sanitaria de medicamentos es potestad exclusiva del Director Técnico (Q.F.) o Administrador.',
    };
  }

  if (!input.lote_id || input.cantidad <= 0) {
    return { success: false, error: 'Parámetros de baja inválidos.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener stock_lotes bloqueando la fila
    const slRes = await client.query(
      `select sl.cantidad_base, sl.sucursal_id, sl.tenant_id, l.producto_id, l.numero_lote,
              p.costo_ultimo, p.es_controlado, p.nombre_comercial
       from public.stock_lotes sl
       join public.lotes l on l.id = sl.lote_id
       join public.productos p on p.id = l.producto_id
       where sl.lote_id = $1
       for update`,
      [input.lote_id]
    );

    if (slRes.rows.length === 0) {
      throw new Error('El lote seleccionado no existe en el inventario.');
    }

    const sl = slRes.rows[0];
    const stockActual = Number(sl.cantidad_base);

    if (input.cantidad > stockActual) {
      throw new Error(`La cantidad a dar de baja (${input.cantidad}) supera el stock físico disponible (${stockActual}).`);
    }

    const nuevoStock = stockActual - input.cantidad;

    // 2. Actualizar stock_lotes
    await client.query(
      `update public.stock_lotes
       set cantidad_base = $1, updated_at = now()
       where lote_id = $2 and sucursal_id = $3`,
      [nuevoStock, input.lote_id, sl.sucursal_id]
    );

    // 3. Determinar tipo de movimiento válido en Kardex enum
    const tipoKardex = input.tipo_baja === 'vencimiento' ? 'vencimiento' : 'merma';

    // 4. Asiento en Kardex
    await client.query(
      `insert into public.movimientos_stock (
        tenant_id, sucursal_id, lote_id, producto_id, tipo,
        cantidad_base, costo_unitario_base, saldo_lote_posterior,
        referencia_tipo, observacion, usuario_id, created_at
      ) values (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        'baja_sanitaria', $9, $10, now()
      )`,
      [
        sl.tenant_id,
        sl.sucursal_id,
        input.lote_id,
        sl.producto_id,
        tipoKardex,
        -input.cantidad,
        sl.costo_ultimo,
        nuevoStock,
        `[BAJA/DESTRUCCIÓN SANITARIA] Motivo: ${input.motivo} | Acta DIGEMID: ${input.acta_numero || 'S/N'} | Autorizado por: ${user.nombreCompleto} (${user.rol.toUpperCase()})`,
        user.id,
      ]
    );

    // 5. Si es controlado, asentar en libro oficial
    if (sl.es_controlado) {
      await client.query(
        `insert into public.libro_controlados (
          tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
          cantidad_base, saldo_posterior, referencia_tipo, registrado_por, validado_por, validado_at, created_at
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, 'baja_sanitaria', $8,
          case when $9 = 'director_tecnico' then $8 else null end,
          case when $9 = 'director_tecnico' then now() else null end,
          now()
        )`,
        [
          sl.tenant_id,
          sl.sucursal_id,
          sl.producto_id,
          input.lote_id,
          tipoKardex,
          -input.cantidad,
          nuevoStock,
          user.id,
          user.rol,
        ]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/inventario');
    revalidatePath('/pos');
    revalidatePath('/controlados');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en darDeBajaLoteAction:', err);
    return { success: false, error: err.message || 'Error al procesar baja de lote.' };
  } finally {
    client.release();
  }
}


