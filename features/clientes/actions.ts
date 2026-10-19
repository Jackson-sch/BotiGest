'use server';

import { query, queryOne } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth';
import { ClienteFormSchema, AbonoFormSchema, type ClienteFormValues, type AbonoFormValues } from './schemas';
import { getClienteDetalle } from './queries';
import type { ClienteDetalleCompleto } from './types';

export interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Guarda o actualiza un cliente con su línea de crédito y perfil clínico
 */
export async function guardarClienteAction(
  rawValues: ClienteFormValues
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getSessionUser();
    const validated = ClienteFormSchema.safeParse(rawValues);

    if (!validated.success) {
      return {
        success: false,
        message: 'Por favor revise los campos del formulario.',
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    // Obtener tenantId de la sesión o el tenant predeterminado activo
    let tenantId = user?.tenantId;
    if (!tenantId) {
      const tenantRow = await queryOne<{ id: string }>(
        `select id from public.tenants where activo = true limit 1;`
      );
      if (!tenantRow) {
        return { success: false, message: 'No se encontró un tenant activo en el sistema.' };
      }
      tenantId = tenantRow.id;
    }

    if (data.id) {
      // 1. Actualización de cliente existente
      const sqlUpdate = `
        update public.clientes
        set 
          tipo_documento = $1,
          numero_documento = $2,
          nombres = $3,
          direccion = $4,
          telefono = $5,
          email = $6,
          tiene_credito = $7,
          limite_credito = $8,
          dias_credito = $9,
          alergias = $10,
          condicion_medica = $11,
          notas = $12,
          consentimiento_datos = $13,
          activo = $14,
          updated_at = now()
        where id = $15 and tenant_id = $16
        returning id;
      `;

      const updated = await query(sqlUpdate, [
        data.tipo_documento,
        data.numero_documento,
        data.nombres,
        data.direccion || null,
        data.telefono || null,
        data.email || null,
        data.tiene_credito,
        data.limite_credito,
        data.dias_credito,
        data.alergias || null,
        data.condicion_medica || null,
        data.notas || null,
        data.consentimiento_datos,
        data.activo,
        data.id,
        tenantId,
      ]);

      if (updated.length === 0) {
        return { success: false, message: 'No se encontró el cliente a actualizar.' };
      }

      revalidatePath('/clientes');
      revalidatePath('/pos');
      return { success: true, message: 'Cliente actualizado con éxito.', data: { id: data.id } };
    } else {
      // 2. Creación de nuevo cliente
      // Validar si ya existe el documento para el mismo tenant
      const existe = await queryOne(
        `select id from public.clientes where tenant_id = $1 and tipo_documento = $2 and numero_documento = $3;`,
        [tenantId, data.tipo_documento, data.numero_documento]
      );

      if (existe) {
        return {
          success: false,
          message: `Ya existe un cliente registrado con el ${data.tipo_documento.toUpperCase()} ${data.numero_documento}.`,
        };
      }

      const sqlInsert = `
        insert into public.clientes (
          tenant_id,
          tipo_documento,
          numero_documento,
          nombres,
          direccion,
          telefono,
          email,
          tiene_credito,
          limite_credito,
          dias_credito,
          saldo_deudor,
          alergias,
          condicion_medica,
          notas,
          consentimiento_datos,
          activo
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0.00, $11, $12, $13, $14, $15
        )
        returning id;
      `;

      const inserted = await query(sqlInsert, [
        tenantId,
        data.tipo_documento,
        data.numero_documento,
        data.nombres,
        data.direccion || null,
        data.telefono || null,
        data.email || null,
        data.tiene_credito,
        data.limite_credito,
        data.dias_credito,
        data.alergias || null,
        data.condicion_medica || null,
        data.notas || null,
        data.consentimiento_datos,
        data.activo,
      ]);

      revalidatePath('/clientes');
      revalidatePath('/pos');
      return {
        success: true,
        message: 'Cliente registrado exitosamente.',
        data: { id: inserted[0].id },
      };
    }
  } catch (error: any) {
    console.error('Error al guardar cliente:', error);
    return {
      success: false,
      message: error?.message || 'Error inesperado al procesar la solicitud.',
    };
  }
}

/**
 * Activa o desactiva un cliente
 */
export async function toggleActivoClienteAction(
  id: string,
  nuevoEstado: boolean
): Promise<ActionResponse> {
  try {
    await query(`update public.clientes set activo = $1, updated_at = now() where id = $2;`, [
      nuevoEstado,
      id,
    ]);

    revalidatePath('/clientes');
    revalidatePath('/pos');
    return {
      success: true,
      message: nuevoEstado ? 'Cliente reactivado.' : 'Cliente desactivado.',
    };
  } catch (error: any) {
    console.error('Error al cambiar estado de cliente:', error);
    return { success: false, message: 'No se pudo cambiar el estado del cliente.' };
  }
}

/**
 * Registra un abono/pago a la cuenta corriente del cliente y lo asienta en caja si hay turno abierto
 */
export async function registrarAbonoClienteAction(
  rawValues: AbonoFormValues
): Promise<ActionResponse<{ nuevoSaldo: number; comprobante: string }>> {
  try {
    const user = await getSessionUser();
    const validated = AbonoFormSchema.safeParse(rawValues);

    if (!validated.success) {
      return {
        success: false,
        message: 'Datos de abono no válidos.',
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { cliente_id, monto, metodo_pago, comprobante_referencia, observaciones } = validated.data;

    // 1. Obtener cliente y saldo actual
    const cliente = await queryOne<{
      id: string;
      tenant_id: string;
      nombres: string;
      saldo_deudor: number;
    }>(
      `select id, tenant_id, nombres, coalesce(saldo_deudor, 0)::numeric as saldo_deudor from public.clientes where id = $1;`,
      [cliente_id]
    );

    if (!cliente) {
      return { success: false, message: 'Cliente no encontrado.' };
    }

    const saldoAnterior = Number(cliente.saldo_deudor) || 0;
    if (saldoAnterior <= 0) {
      return { success: false, message: 'El cliente no tiene deuda pendiente para abonar.' };
    }

    if (monto > saldoAnterior) {
      return {
        success: false,
        message: `El monto a abonar (S/ ${monto.toFixed(2)}) supera la deuda actual (S/ ${saldoAnterior.toFixed(2)}).`,
      };
    }

    const saldoPosterior = Number((saldoAnterior - monto).toFixed(2));
    const correlativoAbono = `ABN-${Date.now().toString().slice(-6)}`;
    const referenciaFinal = comprobante_referencia?.trim() || correlativoAbono;

    // 2. Verificar si hay un turno de caja abierto
    const turnoActivo = await queryOne<{ id: string; sucursal_id: string }>(
      `select id, sucursal_id from public.turnos_caja where estado = 'abierto' order by apertura_at desc limit 1;`
    );

    const cajeroNombre = user ? `${user.nombres} ${user.apellidos}` : 'Cajero de Turno';

    // 3. Registrar el movimiento en la cuenta corriente
    const sqlMovimiento = `
      insert into public.cuentas_corrientes_movimientos (
        tenant_id,
        sucursal_id,
        cliente_id,
        tipo_movimiento,
        monto,
        saldo_anterior,
        saldo_posterior,
        comprobante_referencia,
        metodo_pago,
        turno_caja_id,
        registrado_por,
        registrado_por_nombre,
        observaciones
      ) values (
        $1, $2, $3, 'abono', $4, $5, $6, $7, $8, $9, $10, $11, $12
      );
    `;

    await query(sqlMovimiento, [
      cliente.tenant_id,
      turnoActivo?.sucursal_id || null,
      cliente.id,
      monto,
      saldoAnterior,
      saldoPosterior,
      referenciaFinal,
      metodo_pago,
      turnoActivo?.id || null,
      user?.id || null,
      cajeroNombre,
      observaciones || `Abono a cuenta corriente por ${cliente.nombres}`,
    ]);

    // 4. Actualizar el saldo deudor del cliente
    await query(`update public.clientes set saldo_deudor = $1, updated_at = now() where id = $2;`, [
      saldoPosterior,
      cliente.id,
    ]);

    // 5. Si hay turno de caja abierto y el pago fue en efectivo o Yape/Plin, registrar como ingreso de caja
    if (turnoActivo && ['efectivo', 'yape', 'plin'].includes(metodo_pago)) {
      await query(
        `
        insert into public.movimientos_caja (
          tenant_id,
          turno_id,
          tipo,
          concepto,
          monto,
          usuario_id
        ) values (
          $1, $2, 'ingreso', $3, $4, $5
        );
      `,
        [
          cliente.tenant_id,
          turnoActivo.id,
          `Abono Cta. Cte. [${referenciaFinal}] - ${cliente.nombres}`,
          monto,
          user?.id || null,
        ]
      );
    }

    revalidatePath('/clientes');
    revalidatePath('/caja');
    revalidatePath('/pos');

    return {
      success: true,
      message: `Abono de S/ ${monto.toFixed(2)} registrado con éxito. Nuevo saldo: S/ ${saldoPosterior.toFixed(2)}`,
      data: {
        nuevoSaldo: saldoPosterior,
        comprobante: referenciaFinal,
      },
    };
  } catch (error: any) {
    console.error('Error al registrar abono:', error);
    return {
      success: false,
      message: error?.message || 'Error inesperado al registrar el abono.',
    };
  }
}

/**
 * Consulta el detalle en vivo del cliente para el modal de estado de cuenta
 */
export async function obtenerEstadoCuentaClienteAction(
  clienteId: string
): Promise<ActionResponse<ClienteDetalleCompleto>> {
  try {
    const detalle = await getClienteDetalle(clienteId);
    if (!detalle) {
      return { success: false, message: 'Cliente no encontrado.' };
    }
    return { success: true, data: detalle };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
