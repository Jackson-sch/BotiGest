'use server';

import { pool } from '@/lib/db';
import { getSessionUser, hashPin, signSession, AUTH_COOKIE_NAME } from '@/lib/auth';
import { cookies } from 'next/headers';
import {
  guardarUsuarioSchema,
  guardarCajaSchema,
  type GuardarUsuarioInput,
  type GuardarCajaInput,
} from './schemas';
import { revalidatePath } from 'next/cache';

export async function guardarUsuarioAction(
  rawInput: GuardarUsuarioInput
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const validation = guardarUsuarioSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const currentUser = await getSessionUser();
  if (!currentUser) {
    return { success: false, error: 'Debe iniciar sesión para administrar usuarios.' };
  }

  if (currentUser.rol !== 'administrador' && currentUser.rol !== 'propietario') {
    return {
      success: false,
      error: 'Solo los Administradores o Propietarios pueden crear o editar perfiles de personal.',
    };
  }

  const input = validation.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tRes = await client.query(`select id from public.tenants where activo = true limit 1`);
    const tenantId = tRes.rows[0]?.id;
    if (!tenantId) throw new Error('Tenant activo no encontrado.');

    let userId = input.id;

    if (userId) {
      // 1. ACTUALIZAR USUARIO
      if (input.pin && input.pin.trim().length >= 4) {
        const hashed = await hashPin(input.pin.trim());
        await client.query(
          `update public.perfiles
           set nombres = $1, apellidos = $2, dni = $3, cqfp = $4,
               rol = $5, pin_hash = $6, activo = $7, updated_at = now()
           where id = $8 and tenant_id = $9`,
          [
            input.nombres.trim(),
            input.apellidos.trim(),
            input.dni.trim(),
            input.cqfp?.trim() || null,
            input.rol,
            hashed,
            input.activo,
            userId,
            tenantId,
          ]
        );
      } else {
        await client.query(
          `update public.perfiles
           set nombres = $1, apellidos = $2, dni = $3, cqfp = $4,
               rol = $5, activo = $6, updated_at = now()
           where id = $7 and tenant_id = $8`,
          [
            input.nombres.trim(),
            input.apellidos.trim(),
            input.dni.trim(),
            input.cqfp?.trim() || null,
            input.rol,
            input.activo,
            userId,
            tenantId,
          ]
        );
      }
    } else {
      // 2. CREAR NUEVO USUARIO
      if (!input.pin || input.pin.trim().length < 4) {
        throw new Error('Debe asignar un PIN de acceso numérico (mínimo 4 dígitos) para el nuevo usuario.');
      }

      // Verificar DNI único
      const exist = await client.query(
        `select id from public.perfiles where dni = $1 and tenant_id = $2`,
        [input.dni.trim(), tenantId]
      );
      if (exist.rows.length > 0) {
        throw new Error(`Ya existe un usuario registrado con el DNI ${input.dni}.`);
      }

      const hashed = await hashPin(input.pin.trim());
      const insRes = await client.query(
        `insert into public.perfiles (
           tenant_id, nombres, apellidos, dni, cqfp, rol, pin_hash, activo, created_at, updated_at
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, now(), now()
         ) returning id`,
        [
          tenantId,
          input.nombres.trim(),
          input.apellidos.trim(),
          input.dni.trim(),
          input.cqfp?.trim() || null,
          input.rol,
          hashed,
          input.activo,
        ]
      );
      userId = insRes.rows[0].id;
    }

    // 3. ASIGNAR SUCURSAL
    if (userId && input.sucursal_id) {
      await client.query(
        `delete from public.usuario_sucursal where perfil_id = $1`,
        [userId]
      );
      await client.query(
        `insert into public.usuario_sucursal (perfil_id, sucursal_id, tenant_id)
         values ($1, $2, $3)`,
        [userId, input.sucursal_id, tenantId]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/usuarios');
    return { success: true, userId };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en guardarUsuarioAction:', err);
    return { success: false, error: err.message || 'Error al guardar usuario.' };
  } finally {
    client.release();
  }
}

export async function toggleEstadoUsuarioAction(
  userId: string,
  activo: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getSessionUser();
  if (!currentUser || (currentUser.rol !== 'administrador' && currentUser.rol !== 'propietario')) {
    return { success: false, error: 'No autorizado para cambiar el estado de usuarios.' };
  }

  if (currentUser.id === userId) {
    return { success: false, error: 'No puede desactivar su propio perfil activo.' };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `update public.perfiles set activo = $1, updated_at = now() where id = $2`,
      [activo, userId]
    );

    revalidatePath('/usuarios');
    return { success: true };
  } catch (err: any) {
    console.error('Error en toggleEstadoUsuarioAction:', err);
    return { success: false, error: err.message || 'Error al cambiar estado del usuario.' };
  } finally {
    client.release();
  }
}

export async function guardarCajaAction(
  rawInput: GuardarCajaInput
): Promise<{ success: boolean; error?: string; cajaId?: string }> {
  const validation = guardarCajaSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const currentUser = await getSessionUser();
  if (!currentUser || (currentUser.rol !== 'administrador' && currentUser.rol !== 'propietario')) {
    return { success: false, error: 'Solo administradores pueden crear o configurar cajas de cobro.' };
  }

  const input = validation.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tRes = await client.query(`select id from public.tenants where activo = true limit 1`);
    const tenantId = tRes.rows[0]?.id;
    if (!tenantId) throw new Error('Tenant activo no encontrado.');

    // 1. Crear caja
    const insCaja = await client.query(
      `insert into public.cajas (tenant_id, sucursal_id, nombre, activo, created_at)
       values ($1, $2, $3, true, now())
       returning id`,
      [tenantId, input.sucursal_id, input.nombre.trim()]
    );
    const cajaId = insCaja.rows[0].id;

    // 2. Crear series electrónicas asociadas a la caja
    const seriesConfig = [
      { tipo: 'boleta', serie: input.serie_boleta },
      { tipo: 'factura', serie: input.serie_factura },
      { tipo: 'nota_venta', serie: input.serie_nota },
    ];

    for (const sc of seriesConfig) {
      await client.query(
        `insert into public.series_comprobante (
           tenant_id, sucursal_id, caja_id, tipo, serie, ultimo_numero
         ) values (
           $1, $2, $3, $4, $5, 0
         )`,
        [tenantId, input.sucursal_id, cajaId, sc.tipo, sc.serie]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/usuarios');
    revalidatePath('/caja');
    revalidatePath('/pos');

    return { success: true, cajaId };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en guardarCajaAction:', err);
    return { success: false, error: err.message || 'Error al crear terminal de caja.' };
  } finally {
    client.release();
  }
}

export interface ActualizarPerfilQFInput {
  nombres: string;
  apellidos: string;
  dni: string;
  cqfp?: string | null;
  nuevoPin?: string | null;
}

export async function actualizarPerfilQFAction(
  input: ActualizarPerfilQFInput
): Promise<{ success: boolean; error?: string; user?: any }> {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return { success: false, error: 'Debe iniciar sesión para actualizar su perfil.' };
  }

  const nombres = input.nombres?.trim();
  const apellidos = input.apellidos?.trim();
  const dni = input.dni?.trim();
  const cqfp = input.cqfp?.trim() || null;
  const pin = input.nuevoPin?.trim();

  if (!nombres || nombres.length < 2) {
    return { success: false, error: 'Ingrese sus nombres completos.' };
  }
  if (!apellidos || apellidos.length < 2) {
    return { success: false, error: 'Ingrese sus apellidos completos.' };
  }
  if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
    return { success: false, error: 'El DNI debe tener exactamente 8 dígitos numéricos.' };
  }

  // Si es director técnico, validar que tenga colegiatura CQFP
  if (currentUser.rol === 'director_tecnico' && (!cqfp || cqfp.length < 3)) {
    return {
      success: false,
      error: 'El número de Colegiatura CQFP es obligatorio para el Director Técnico (Q.F.).',
    };
  }

  // Si desea cambiar PIN, validar longitud
  if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
    return { success: false, error: 'El nuevo PIN de acceso debe tener entre 4 y 6 dígitos numéricos.' };
  }

  const client = await pool.connect();
  try {
    // 1. Verificar si el DNI ya pertenece a otro usuario
    const checkDni = await client.query(
      `select id from public.perfiles where dni = $1 and id <> $2 and tenant_id = $3 limit 1`,
      [dni, currentUser.id, currentUser.tenantId]
    );
    if (checkDni.rows.length > 0) {
      return { success: false, error: `Ya existe otro usuario registrado con el DNI ${dni}.` };
    }

    // 2. Actualizar perfil
    if (pin) {
      const hashed = await hashPin(pin);
      await client.query(
        `update public.perfiles
         set nombres = $1, apellidos = $2, dni = $3, cqfp = $4, pin_hash = $5, updated_at = now()
         where id = $6 and tenant_id = $7`,
        [nombres, apellidos, dni, cqfp, hashed, currentUser.id, currentUser.tenantId]
      );
    } else {
      await client.query(
        `update public.perfiles
         set nombres = $1, apellidos = $2, dni = $3, cqfp = $4, updated_at = now()
         where id = $5 and tenant_id = $6`,
        [nombres, apellidos, dni, cqfp, currentUser.id, currentUser.tenantId]
      );
    }

    // 3. Actualizar la cookie de sesión firmada
    const cookieStore = await cookies();
    const updatedUserSession = {
      ...currentUser,
      nombres,
      apellidos,
      nombreCompleto: `${nombres} ${apellidos}`,
      dni,
      cqfp,
    };
    const token = await signSession(updatedUserSession);
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/');
    revalidatePath('/usuarios');
    revalidatePath('/controlados');
    revalidatePath('/perfil');

    return { success: true, user: updatedUserSession };
  } catch (err: any) {
    console.error('Error al actualizar perfil QF:', err);
    return { success: false, error: err.message || 'Error al guardar los datos del perfil.' };
  } finally {
    client.release();
  }
}
