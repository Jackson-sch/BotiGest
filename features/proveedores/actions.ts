'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { proveedorSchema, type ProveedorInput } from './schemas';
import { consultarRucApi } from '@/lib/sunat/client';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Crea o actualiza un proveedor / droguería farmacéutica.
 */
export async function guardarProveedorAction(input: ProveedorInput): Promise<ActionResponse> {
  const validation = proveedorSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
  }

  if (!['administrador', 'propietario', 'almacenero', 'director_tecnico'].includes(user.rol)) {
    return { success: false, error: 'Su rol no tiene autorización para gestionar proveedores.' };
  }

  const client = await pool.connect();
  try {
    // 1. Obtener tenant_id activo
    const tenantRes = await client.query('select id from public.tenants where activo = true limit 1');
    const tenantId = tenantRes.rows[0]?.id;
    if (!tenantId) {
      return { success: false, error: 'No se encontró una organización activa.' };
    }

    const { id, ruc, razon_social, contacto, telefono, email, direccion, activo } = validation.data;

    // 2. Verificar duplicidad de RUC en el mismo tenant
    if (id) {
      const exist = await client.query(
        'select id from public.proveedores where tenant_id = $1 and ruc = $2 and id != $3',
        [tenantId, ruc, id]
      );
      if (exist.rows.length > 0) {
        return { success: false, error: `Ya existe otro proveedor registrado con el RUC ${ruc}.` };
      }

      await client.query(
        `update public.proveedores set
          ruc = $1,
          razon_social = $2,
          contacto = $3,
          telefono = $4,
          email = $5,
          direccion = $6,
          activo = $7
        where id = $8 and tenant_id = $9`,
        [ruc, razon_social, contacto || null, telefono || null, email || null, direccion || null, activo, id, tenantId]
      );

      revalidatePath('/proveedores');
      revalidatePath('/compras');
      return { success: true, message: 'Proveedor actualizado exitosamente.' };
    } else {
      const exist = await client.query(
        'select id from public.proveedores where tenant_id = $1 and ruc = $2',
        [tenantId, ruc]
      );
      if (exist.rows.length > 0) {
        return { success: false, error: `Ya existe un proveedor registrado con el RUC ${ruc}.` };
      }

      const res = await client.query(
        `insert into public.proveedores (
          tenant_id, ruc, razon_social, contacto, telefono, email, direccion, activo
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) returning id`,
        [tenantId, ruc, razon_social, contacto || null, telefono || null, email || null, direccion || null, activo]
      );

      revalidatePath('/proveedores');
      revalidatePath('/compras');
      return { success: true, message: 'Proveedor registrado exitosamente.', data: { id: res.rows[0].id } };
    }
  } catch (error: any) {
    console.error('Error al guardar proveedor:', error);
    return { success: false, error: error.message || 'Error interno al procesar el proveedor.' };
  } finally {
    client.release();
  }
}

/**
 * Alterna el estado activo/inactivo de un proveedor.
 */
export async function toggleEstadoProveedorAction(id: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || !['administrador', 'propietario', 'almacenero', 'director_tecnico'].includes(user.rol)) {
    return { success: false, error: 'No autorizado para cambiar el estado de proveedores.' };
  }

  try {
    await pool.query(
      'update public.proveedores set activo = not activo where id = $1',
      [id]
    );

    revalidatePath('/proveedores');
    revalidatePath('/compras');
    return { success: true, message: 'Estado del proveedor actualizado.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar estado.' };
  }
}

/**
 * Elimina un proveedor si no tiene compras registradas.
 */
export async function eliminarProveedorAction(id: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || !['administrador', 'propietario'].includes(user.rol)) {
    return { success: false, error: 'Solo el administrador puede eliminar proveedores del registro.' };
  }

  const client = await pool.connect();
  try {
    // Verificar si tiene compras
    const comprasCheck = await client.query(
      'select count(*)::integer as count from public.compras where proveedor_id = $1',
      [id]
    );

    if (comprasCheck.rows[0].count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el proveedor porque tiene ${comprasCheck.rows[0].count} compra(s) asociada(s). Se recomienda desactivarlo en su lugar.`,
      };
    }

    await client.query('delete from public.proveedores where id = $1', [id]);
    revalidatePath('/proveedores');
    revalidatePath('/compras');
    return { success: true, message: 'Proveedor eliminado correctamente.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar proveedor.' };
  } finally {
    client.release();
  }
}

/**
 * Consulta en línea los datos de la droguería a través de SUNAT por su número de RUC.
 */
export async function consultarRucProveedorAction(ruc: string) {
  try {
    return await consultarRucApi(ruc);
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al consultar RUC en SUNAT.' };
  }
}
