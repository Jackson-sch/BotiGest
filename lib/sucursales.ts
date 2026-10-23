import { cookies } from 'next/headers';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const ACTIVE_SUCURSAL_COOKIE = 'botigest_active_sucursal_id';

export interface SucursalItem {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  codigo_establecimiento_sunat: string;
  es_almacen: boolean;
  activo: boolean;
}

/**
 * Consulta todas las sucursales activas registradas en la base de datos.
 */
export async function obtenerSucursales(tenantId?: string): Promise<SucursalItem[]> {
  try {
    const params: any[] = [];
    let whereClause = 'where activo = true';
    if (tenantId) {
      params.push(tenantId);
      whereClause += ` and tenant_id = $${params.length}`;
    }

    const sql = `
      select 
        id,
        codigo,
        nombre,
        direccion,
        telefono,
        codigo_establecimiento_sunat,
        es_almacen,
        activo
      from public.sucursales
      ${whereClause}
      order by es_almacen asc, codigo asc;
    `;

    const rows = await query<SucursalItem>(sql, params);
    return rows;
  } catch (error) {
    console.error('Error al obtener sucursales de la base de datos:', error);
    return [];
  }
}

/**
 * Obtiene el ID de la sucursal activa en la sesión actual.
 * - Si el usuario es 'cajero' o 'almacenero', restringe estrictamente a su sucursal asignada.
 * - Si es 'administrador' o 'propietario', respeta la cookie 'botigest_active_sucursal_id'
 *   o retorna la primera sucursal disponible.
 */
export async function obtenerSucursalActivaId(): Promise<string> {
  const cookieStore = await cookies();
  const cookieSucursal = cookieStore.get(ACTIVE_SUCURSAL_COOKIE)?.value;
  const user = await getCurrentUser();

  // Roles operativos restringidos a su sede física asignada
  if (user && (user.rol === 'cajero' || user.rol === 'almacenero') && user.sucursalId) {
    return user.sucursalId;
  }

  // Si hay cookie válida establecida
  if (cookieSucursal) {
    return cookieSucursal;
  }

  // Si el usuario tiene una sucursal por defecto en su perfil
  if (user?.sucursalId) {
    return user.sucursalId;
  }

  // Fallback: primera sucursal activa en la base de datos
  const sucursales = await obtenerSucursales(user?.tenantId);
  return sucursales[0]?.id || 'b0000000-0000-0000-0000-000000000001';
}

/**
 * Obtiene la información detallada de la sucursal activa.
 */
export async function obtenerSucursalActiva(): Promise<SucursalItem | null> {
  const activeId = await obtenerSucursalActivaId();
  if (activeId === 'todas') {
    return {
      id: 'todas',
      codigo: 'ALL',
      nombre: 'Todas las Sedes (Consolidado)',
      direccion: 'Vista General de Cadena',
      codigo_establecimiento_sunat: '0000',
      es_almacen: false,
      activo: true,
    };
  }

  try {
    const row = await queryOne<SucursalItem>(
      `select id, codigo, nombre, direccion, telefono, codigo_establecimiento_sunat, es_almacen, activo
         from public.sucursales
        where id = $1`,
      [activeId]
    );
    return row;
  } catch (err) {
    console.error('Error al obtener sucursal activa:', err);
    return null;
  }
}
