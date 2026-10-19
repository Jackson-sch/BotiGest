'use server';

import { query, queryOne } from '@/lib/db';
import {
  abrirTurnoSchema,
  registrarMovimientoEfectivoSchema,
  cerrarTurnoSchema,
  type AbrirTurnoInput,
  type RegistrarMovimientoEfectivoInput,
  type CerrarTurnoInput,
} from './schemas';
import { calcularResumenEfectivoSistema } from './queries';
import { revalidatePath } from 'next/cache';

import { getSessionUser, authenticateWithDniAndPin } from '@/lib/auth';

export interface CajaActionResult {
  success: boolean;
  turnoId?: string;
  error?: string;
  requiereAutorizacion?: boolean;
  cuadraExacto?: boolean;
  diferencia?: number;
  montoDeclarado?: number;
  montoSistema?: number;
}

/**
 * Server Action para abrir un nuevo turno de caja con saldo inicial
 */
export async function abrirTurnoAction(input: AbrirTurnoInput): Promise<CajaActionResult> {
  const val = abrirTurnoSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.errors.map((e) => e.message).join(', ') };
  }

  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
    }

    if (!['cajero', 'administrador', 'propietario'].includes(user.rol)) {
      return { success: false, error: 'Su rol no tiene autorización para operar cajas registradoras.' };
    }

    // 1. Verificar si ya existe un turno abierto para esa caja
    const turnoExistente = await queryOne<{ id: string }>(
      `select id from public.turnos_caja where caja_id = $1 and estado = 'abierto'`,
      [val.data.caja_id]
    );

    if (turnoExistente) {
      return { success: false, error: 'Esta caja ya tiene un turno abierto. Debe cerrarlo primero.' };
    }

    // 2. Obtener tenant_id y sucursal_id de la caja
    const cajaInfo = await queryOne<{ tenant_id: string; sucursal_id: string }>(
      `select tenant_id, sucursal_id from public.cajas where id = $1`,
      [val.data.caja_id]
    );

    if (!cajaInfo) {
      return { success: false, error: 'Caja no encontrada.' };
    }

    // 3. Insertar nuevo turno vinculado al usuario autenticado
    const res = await queryOne<{ id: string }>(
      `insert into public.turnos_caja (
        tenant_id, sucursal_id, caja_id, usuario_id,
        estado, apertura_at, monto_apertura, observacion
      )
      values ($1, $2, $3, $4, 'abierto', now(), $5, $6)
      returning id;`,
      [
        cajaInfo.tenant_id,
        cajaInfo.sucursal_id,
        val.data.caja_id,
        user.id,
        val.data.monto_apertura,
        val.data.observacion || null,
      ]
    );

    revalidatePath('/caja');
    revalidatePath('/pos');
    revalidatePath('/');
    return { success: true, turnoId: res?.id };
  } catch (error: any) {
    console.error('Error al abrir turno:', error);
    return { success: false, error: error.message || 'Error al abrir turno de caja' };
  }
}

/**
 * Server Action para registrar un ingreso o egreso de efectivo (movimientos menores o remesas)
 */
export async function registrarMovimientoEfectivoAction(
  input: RegistrarMovimientoEfectivoInput
): Promise<CajaActionResult> {
  const val = registrarMovimientoEfectivoSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.errors.map((e) => e.message).join(', ') };
  }

  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Debe iniciar sesión para registrar movimientos.' };
    }

    const turno = await queryOne<{ tenant_id: string; usuario_id: string; estado: string }>(
      `select tenant_id, usuario_id, estado from public.turnos_caja where id = $1`,
      [val.data.turno_id]
    );

    if (!turno || turno.estado !== 'abierto') {
      return { success: false, error: 'El turno no está abierto o no existe.' };
    }

    await query(
      `insert into public.movimientos_caja (
        tenant_id, turno_id, tipo, concepto, monto, usuario_id
      )
      values ($1, $2, $3, $4, $5, $6)`,
      [
        turno.tenant_id,
        val.data.turno_id,
        val.data.tipo,
        val.data.concepto,
        val.data.monto,
        user.id,
      ]
    );

    revalidatePath('/caja');
    return { success: true, turnoId: val.data.turno_id };
  } catch (error: any) {
    console.error('Error al registrar movimiento:', error);
    return { success: false, error: error.message || 'Error al registrar movimiento' };
  }
}

/**
/**
 * Server Action para verificar el balance del arqueo antes de confirmar el cierre.
 * Permite conocer si la caja cuadra exactamente o si requiere autorización por descuadre.
 */
export async function verificarArqueoAction(
  turnoId: string,
  montoDeclarado: number
): Promise<CajaActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Debe iniciar sesión para verificar el arqueo.' };
    }

    const turno = await queryOne<{ id: string; estado: string }>(
      `select id, estado from public.turnos_caja where id = $1`,
      [turnoId]
    );

    if (!turno || turno.estado !== 'abierto') {
      return { success: false, error: 'El turno no está abierto o no existe.' };
    }

    const resumen = await calcularResumenEfectivoSistema(turnoId);
    const montoEsperado = resumen.saldo_esperado;
    const diferencia = Number((montoDeclarado - montoEsperado).toFixed(2));
    const cuadraExacto = Math.abs(diferencia) <= 0.10;

    return {
      success: true,
      turnoId,
      cuadraExacto,
      requiereAutorizacion: !cuadraExacto,
      diferencia,
      montoDeclarado,
      montoSistema: montoEsperado,
    };
  } catch (error: any) {
    console.error('Error al verificar arqueo:', error);
    return { success: false, error: error.message || 'Error al verificar arqueo de caja' };
  }
}

/**
 * Server Action para cierre de turno con Arqueo Ciego, protección contra estado vacío
 * y autorización obligatoria de Supervisor / Director Técnico si la caja no cuadra.
 */
export async function cerrarTurnoAction(input: CerrarTurnoInput): Promise<CajaActionResult> {
  const val = cerrarTurnoSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.errors.map((e) => e.message).join(', ') };
  }

  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Debe iniciar sesión para cerrar el turno.' };
    }

    // 1. Protección contra cierre en estado vacío / sin conteo físico
    const montoDeclarado = Number(val.data.monto_declarado.toFixed(2));
    if (montoDeclarado === 0 && !val.data.declarar_gaveta_vacia) {
      return {
        success: false,
        error:
          'No se puede cerrar la caja con saldo S/ 0.00 sin ingresar el desglose físico. Si la gaveta realmente está vacía, debe activar la casilla de confirmación explícita.',
      };
    }

    const turno = await queryOne<{ id: string; usuario_id: string; estado: string }>(
      `select id, usuario_id, estado from public.turnos_caja where id = $1`,
      [val.data.turno_id]
    );

    if (!turno || turno.estado !== 'abierto') {
      return { success: false, error: 'El turno ya está cerrado o no existe.' };
    }

    // Solo el cajero titular o un administrador/director técnico pueden cerrarlo
    if (
      turno.usuario_id !== user.id &&
      !['administrador', 'propietario', 'director_tecnico'].includes(user.rol)
    ) {
      return { success: false, error: 'No está autorizado para cerrar el turno de otro operador.' };
    }

    // 2. Calcular el saldo esperado del sistema y la diferencia
    const resumen = await calcularResumenEfectivoSistema(val.data.turno_id);
    const montoEsperado = resumen.saldo_esperado;
    const diferencia = Number((montoDeclarado - montoEsperado).toFixed(2));
    const hayDescuadre = Math.abs(diferencia) > 0.10;

    let autorizadoPor = '';
    let motivoDescuadre = '';

    // 3. Verificación de Autorización si la caja NO cuadra
    if (hayDescuadre) {
      const esAdminOQF = ['administrador', 'propietario', 'director_tecnico'].includes(user.rol);

      if (esAdminOQF) {
        // El usuario logueado ya tiene rol de jerarquía suficiente
        if (!val.data.autorizacion?.motivo_descuadre) {
          return {
            success: false,
            requiereAutorizacion: true,
            diferencia,
            montoDeclarado,
            montoSistema: montoEsperado,
            error:
              'La caja presenta un descuadre. Debe ingresar el motivo que justifique la diferencia para autorizar el cierre.',
          };
        }
        autorizadoPor = `${user.nombres} ${user.apellidos} (${user.rol.toUpperCase()}, DNI ${user.dni})`;
        motivoDescuadre = val.data.autorizacion.motivo_descuadre.trim();
      } else {
        // Es cajero regular: requiere obligatoriamente validación de supervisor
        if (!val.data.autorizacion) {
          return {
            success: false,
            requiereAutorizacion: true,
            diferencia,
            montoDeclarado,
            montoSistema: montoEsperado,
            error: `La caja no cuadra (${diferencia < 0 ? 'Faltante: -S/ ' + Math.abs(diferencia).toFixed(2) : 'Sobrante: +S/ ' + diferencia.toFixed(2)}). Se requiere autorización de un Supervisor o Administrador.`,
          };
        }

        const { supervisor_dni, supervisor_pin, motivo_descuadre } = val.data.autorizacion;
        const authSup = await authenticateWithDniAndPin(supervisor_dni, supervisor_pin);

        if (!authSup.success || !authSup.user) {
          return {
            success: false,
            requiereAutorizacion: true,
            diferencia,
            montoDeclarado,
            montoSistema: montoEsperado,
            error: authSup.error || 'DNI o PIN de supervisor inválido.',
          };
        }

        if (!['administrador', 'propietario', 'director_tecnico'].includes(authSup.user.rol)) {
          return {
            success: false,
            requiereAutorizacion: true,
            diferencia,
            montoDeclarado,
            montoSistema: montoEsperado,
            error:
              'El usuario ingresado no posee rango de Supervisor, Administrador o Director Técnico para autorizar descuadres.',
          };
        }

        autorizadoPor = `${authSup.user.nombreCompleto} (${authSup.user.rol.toUpperCase()}, DNI ${authSup.user.dni})`;
        motivoDescuadre = motivo_descuadre.trim();
      }
    }

    // 4. Construir registro histórico y auditoría
    let observacionFinal = val.data.observacion?.trim() || '';
    if (hayDescuadre) {
      const tipo = diferencia < 0 ? 'FALTANTE' : 'SOBRANTE';
      const auditMsg = `[DESCUADRE ${tipo} S/ ${Math.abs(diferencia).toFixed(2)} AUTORIZADO por ${autorizadoPor} | Justificación: "${motivoDescuadre}"]`;
      observacionFinal = observacionFinal ? `${auditMsg} · ${observacionFinal}` : auditMsg;
    } else {
      const auditOk = `[CIERRE CUADRADO EXACTO verificado por ${user.nombres} ${user.apellidos}]`;
      observacionFinal = observacionFinal ? `${auditOk} · ${observacionFinal}` : auditOk;
    }

    // 5. Actualizar el turno en base de datos
    await query(
      `update public.turnos_caja
       set 
         estado = 'cerrado',
         cierre_at = now(),
         monto_cierre_declarado = $1,
         monto_cierre_sistema = $2,
         diferencia = $3,
         observacion = coalesce(observacion || ' | ', '') || $4
       where id = $5 and estado = 'abierto'`,
      [
        montoDeclarado,
        montoEsperado,
        diferencia,
        observacionFinal,
        val.data.turno_id,
      ]
    );

    revalidatePath('/caja');
    revalidatePath('/caja/arqueo');
    revalidatePath('/pos');
    revalidatePath('/');

    return {
      success: true,
      turnoId: val.data.turno_id,
      cuadraExacto: !hayDescuadre,
      diferencia,
      montoDeclarado,
      montoSistema: montoEsperado,
    };
  } catch (error: any) {
    console.error('Error al cerrar turno:', error);
    return { success: false, error: error.message || 'Error al cerrar turno de caja' };
  }
}
