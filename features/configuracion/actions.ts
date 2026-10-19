'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { boticaConfiguracionSchema, type BoticaConfiguracionInput } from './schemas';
import { consultarRucApi } from '@/lib/sunat/client';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Actualiza la configuración global del establecimiento farmacéutico.
 */
export async function actualizarConfiguracionBoticaAction(
  input: BoticaConfiguracionInput
): Promise<ActionResponse> {
  const validation = boticaConfiguracionSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar cambios de configuración.' };
  }

  if (!['administrador', 'propietario'].includes(user.rol)) {
    return {
      success: false,
      error: 'Solo el Administrador o Propietario tiene permisos para modificar la configuración de la botica.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const data = validation.data;

    // 1. Obtener jsonb existente para hacer merge limpio
    const tenantRes = await client.query('select configuracion from public.tenants where id = $1', [
      data.tenant_id,
    ]);
    const prevConfig = tenantRes.rows[0]?.configuracion || {};

    const updatedConfig = {
      ...prevConfig,
      telefono_contacto: data.telefono_contacto,
      email_contacto: data.email_contacto,
      autorizacion_digemid: data.autorizacion_digemid,
      modo_fefo_estricto: data.modo_fefo_estricto,
      dias_alerta_preventiva: data.dias_alerta_preventiva,
      dias_alerta_critica: data.dias_alerta_critica,
      formato_ticket_termico: data.formato_ticket_termico,
      mensaje_pie_ticket: data.mensaje_pie_ticket,
      max_descuento_cajero_pct: data.max_descuento_cajero_pct,
      imprimir_qr_sunat: data.imprimir_qr_sunat,
      igv_pct: data.igv_pct,
    };

    // 2. Actualizar tabla tenants
    await client.query(
      `update public.tenants set
        ruc = $1,
        razon_social = $2,
        nombre_comercial = $3,
        configuracion = $4,
        updated_at = now()
      where id = $5`,
      [data.ruc, data.razon_social, data.nombre_comercial, JSON.stringify(updatedConfig), data.tenant_id]
    );

    // 3. Actualizar sucursal principal
    await client.query(
      `update public.sucursales set
        direccion = $1,
        ubigeo = $2,
        telefono = $3,
        codigo_establecimiento_sunat = $4,
        autorizacion_digemid = $5,
        director_tecnico_id = $6,
        updated_at = now()
      where id = $7 and tenant_id = $8`,
      [
        data.direccion_fiscal,
        data.ubigeo,
        data.telefono_contacto,
        data.codigo_establecimiento_sunat,
        data.autorizacion_digemid,
        data.director_tecnico_id || null,
        data.sucursal_id,
        data.tenant_id,
      ]
    );

    await client.query('COMMIT');

    revalidatePath('/configuracion');
    revalidatePath('/pos');
    revalidatePath('/inventario');
    revalidatePath('/reportes');
    revalidatePath('/');

    return {
      success: true,
      message: 'Configuración de la botica actualizada correctamente.',
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar configuración:', error);
    return {
      success: false,
      error: error.message || 'Error al persistir la configuración.',
    };
  } finally {
    client.release();
  }
}

/**
 * Consulta SUNAT para validar datos fiscales de la propia botica.
 */
export async function consultarRucEmpresaAction(ruc: string) {
  try {
    return await consultarRucApi(ruc);
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al consultar SUNAT.' };
  }
}
