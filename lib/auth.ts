import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import {
  type UserSession,
  type UserRole,
  AUTH_COOKIE_NAME,
  signSession,
  verifySession,
  isRouteAllowed,
  ROUTE_PERMISSIONS,
  getDefaultRouteForRole,
} from './permissions';

export type { UserSession, UserRole };
export {
  AUTH_COOKIE_NAME,
  signSession,
  verifySession,
  isRouteAllowed,
  ROUTE_PERMISSIONS,
  getDefaultRouteForRole,
};

// ───────────── RATE LIMITING EN MEMORIA (Seguridad contra ataques de fuerza bruta) ─────────────
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(dni: string): { allowed: boolean; remainingMinutes?: number } {
  const record = loginRateLimitMap.get(dni);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, remainingMinutes };
  }

  // Si el bloqueo expiró, reiniciar
  if (record.blockedUntil <= now && record.attempts >= MAX_LOGIN_ATTEMPTS) {
    loginRateLimitMap.delete(dni);
  }

  return { allowed: true };
}

function recordFailedAttempt(dni: string) {
  const now = Date.now();
  const record = loginRateLimitMap.get(dni) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
  loginRateLimitMap.set(dni, record);
}

function clearRateLimit(dni: string) {
  loginRateLimitMap.delete(dni);
}

/**
 * Genera el hash seguro bcrypt para almacenar el PIN de un usuario.
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin.trim(), salt);
}

/**
 * Autentica un usuario por DNI y PIN contra la base de datos PostgreSQL.
 * Valida mediante bcrypt y migra de manera transparente hashes legados en texto plano.
 */
export async function authenticateWithDniAndPin(
  dni: string,
  pin: string
): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  const cleanDni = dni.trim();
  const cleanPin = pin.trim();

  if (!cleanDni || cleanDni.length < 8) {
    return { success: false, error: 'Ingrese un DNI válido de 8 dígitos.' };
  }

  if (!cleanPin) {
    return { success: false, error: 'Ingrese su PIN o clave de acceso.' };
  }

  // 1. Verificación de Rate Limiting
  const rateLimit = checkRateLimit(cleanDni);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Cuenta temporalmente bloqueada por ${rateLimit.remainingMinutes} minuto(s) debido a múltiples intentos fallidos.`,
    };
  }

  try {
    const sql = `
      SELECT p.id, p.tenant_id, p.nombres, p.apellidos, p.dni, p.cqfp, p.rol, p.pin_hash, p.activo,
             t.nombre_comercial as tenant_nombre, t.ruc as tenant_ruc,
             s.id as sucursal_id, s.nombre as sucursal_nombre
        FROM public.perfiles p
        JOIN public.tenants t ON t.id = p.tenant_id
        LEFT JOIN public.usuario_sucursal us ON us.perfil_id = p.id
        LEFT JOIN public.sucursales s ON s.id = us.sucursal_id
       WHERE p.dni = $1
       LIMIT 1;
    `;

    const profile = await queryOne(sql, [cleanDni]);

    if (!profile) {
      recordFailedAttempt(cleanDni);
      return { success: false, error: 'DNI no encontrado o no registrado en el sistema.' };
    }

    if (!profile.activo) {
      return { success: false, error: 'El usuario se encuentra inactivo. Contacte al Administrador.' };
    }

    // 2. Verificar PIN con bcrypt o migración transparente si es legado
    let isMatch = false;
    const isBcryptHash = typeof profile.pin_hash === 'string' && (profile.pin_hash.startsWith('$2a$') || profile.pin_hash.startsWith('$2b$'));

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(cleanPin, profile.pin_hash);
    } else {
      // Legado (texto plano o seed de desarrollo)
      isMatch = profile.pin_hash === cleanPin;
      // Si coincide, migrar inmediatamente a bcrypt en segundo plano
      if (isMatch) {
        try {
          const newHashedPin = await hashPin(cleanPin);
          await queryOne(`UPDATE public.perfiles SET pin_hash = $1 WHERE id = $2`, [newHashedPin, profile.id]);
          console.log(`[Seguridad] PIN de usuario ${cleanDni} migrado exitosamente a bcrypt.`);
        } catch (migErr) {
          console.warn('[Seguridad] Advertencia al migrar PIN legado:', migErr);
        }
      }
    }

    if (!isMatch) {
      recordFailedAttempt(cleanDni);
      return { success: false, error: 'El PIN de acceso ingresado es incorrecto.' };
    }

    // Login exitoso: limpiar historial de intentos fallidos
    clearRateLimit(cleanDni);

    const sessionUser: UserSession = {
      id: profile.id,
      tenantId: profile.tenant_id,
      tenantNombre: profile.tenant_nombre || 'Botica San Martín',
      sucursalId: profile.sucursal_id,
      sucursalNombre: profile.sucursal_nombre || 'Sede Principal',
      nombres: profile.nombres,
      apellidos: profile.apellidos,
      nombreCompleto: `${profile.nombres} ${profile.apellidos}`,
      dni: profile.dni,
      cqfp: profile.cqfp,
      rol: profile.rol,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días de sesión
    };

    return { success: true, user: sessionUser };
  } catch (err: any) {
    console.error('Error en authenticateWithDniAndPin:', err);
    return { success: false, error: 'Error de conexión con la base de datos farmacéutica.' };
  }
}

/**
 * Obtiene el usuario actual desde la cookie de sesión HTTP.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const getSessionUser = getCurrentUser;

