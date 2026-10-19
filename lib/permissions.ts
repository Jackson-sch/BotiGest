export type UserRole =
  | 'propietario'
  | 'administrador'
  | 'director_tecnico'
  | 'cajero'
  | 'almacenero'
  | 'contador';

export interface UserSession {
  id: string;
  tenantId: string;
  tenantNombre: string;
  sucursalId: string | null;
  sucursalNombre: string | null;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  cqfp: string | null;
  rol: UserRole;
  exp: number;
}

export const AUTH_COOKIE_NAME = 'botigest_session';
export const AUTH_SECRET = (() => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(' [ALERTA DE SEGURIDAD]: AUTH_SECRET no está configurado en producción. Defina una clave secreta segura.');
    }
    return 'botigest-secret-key-2026-secure-pharmacy-jwt';
  }
  return secret;
})();

/**
 * Matriz de Permisos por Ruta y Rol Farmacéutico
 */
export const ROUTE_PERMISSIONS: Record<string, { roles: UserRole[]; label: string; motivo?: string }> = {
  '/': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'cajero', 'almacenero', 'contador'],
    label: 'Panel de Control',
  },
  '/pos': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'cajero'],
    label: 'Punto de Venta POS',
    motivo: 'El módulo de cobro y despacho POS está reservado para personal de caja, administración y dirección técnica.',
  },
  '/caja': {
    roles: ['propietario', 'administrador', 'cajero'],
    label: 'Caja & Turnos',
    motivo: 'El arqueo y cuadre de caja chica está reservado exclusivamente para cajeros y administración.',
  },
  '/clientes': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'cajero', 'contador'],
    label: 'Clientes & Cuentas Corrientes',
    motivo: 'La administración de clientes y cobranza de cuentas corrientes está disponible para administración, caja y contabilidad.',
  },
  '/inventario': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'almacenero'],
    label: 'Inventario & Lotes FEFO',
    motivo: 'La administración de kardex, ajustes y lotes requiere rol de almacén, dirección técnica o administración.',
  },
  '/compras': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'almacenero', 'contador'],
    label: 'Compras Droguerías',
    motivo: 'El registro y recepción de facturas de droguerías está reservado para compras, almacén y contabilidad.',
  },
  '/ventas': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'cajero', 'contador'],
    label: 'Ventas & Facturas SUNAT',
    motivo: 'El historial tributario y comprobantes electrónicos está restringido a ventas, contabilidad y administración.',
  },
  '/controlados': {
    roles: ['propietario', 'administrador', 'director_tecnico'],
    label: 'Libro de Controlados DIGEMID',
    motivo: 'Conforme a la Ley N° 29459, el Libro Oficial de Psicotrópicos y Estupefacientes exige custodia exclusiva del Director Técnico (Químico Farmacéutico).',
  },
  '/productos': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'almacenero'],
    label: 'Catálogo Maestro de Fármacos',
    motivo: 'La administración del catálogo y registros sanitarios está reservada para el Director Técnico, Almacén y Administración.',
  },
  '/usuarios': {
    roles: ['propietario', 'administrador'],
    label: 'Personal, Sedes & Cajas',
    motivo: 'La creación de usuarios, asignación de roles, colegiaturas CQFP y configuración de cajas exige privilegios de Administrador o Propietario.',
  },
  '/proveedores': {
    roles: ['propietario', 'administrador', 'director_tecnico', 'almacenero', 'contador'],
    label: 'Proveedores & Droguerías',
    motivo: 'El directorio de droguerías y proveedores está reservado para compras, logística y administración.',
  },
  '/configuracion': {
    roles: ['propietario', 'administrador', 'director_tecnico'],
    label: 'Configuración de la Botica',
    motivo: 'La modificación de datos fiscales SUNAT, autorizaciones sanitarias DIGEMID y parámetros de la botica exige privilegios de Administrador o Dirección Técnica.',
  },
};

/**
 * Verifica si un rol tiene autorización para acceder a una ruta determinada.
 */
export function isRouteAllowed(pathname: string, role?: UserRole): boolean {
  if (!role) return false;
  if (role === 'administrador' || role === 'propietario') return true;

  // Buscar coincidencia exacta o por prefijo
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  if (!matchedRoute) return true; // Rutas sin restricción explícita
  return ROUTE_PERMISSIONS[matchedRoute].roles.includes(role);
}

/**
 * Retorna la primera ruta autorizada por defecto para un rol.
 */
export function getDefaultRouteForRole(role?: UserRole): string {
  if (role === 'cajero') return '/pos';
  if (role === 'almacenero') return '/inventario';
  return '/';
}

// ───────────── CRIPTOGRAFÍA PURA (Web Crypto API para Node y Proxy) ─────────────

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload: UserSession): Promise<string> {
  const key = await getHmacKey();
  const enc = new TextEncoder();
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataB64));
  const sigB64 = Buffer.from(signature).toString('base64url');
  return `${dataB64}.${sigB64}`;
}

export async function verifySession(token: string): Promise<UserSession | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [dataB64, sigB64] = parts;
    const key = await getHmacKey();
    const enc = new TextEncoder();

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(sigB64, 'base64url'),
      enc.encode(dataB64)
    );

    if (!isValid) return null;

    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf-8')) as UserSession;

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
