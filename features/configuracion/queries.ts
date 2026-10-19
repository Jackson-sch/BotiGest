import { query } from '@/lib/db';
import type { BoticaConfiguracion } from './types';

export interface FarmaceuticoOption {
  id: string;
  nombre_completo: string;
  cqfp: string;
  dni: string;
}

/**
 * Obtiene la configuración consolidada del establecimiento farmacéutico.
 */
export async function obtenerConfiguracionBotica(): Promise<{
  configuracion: BoticaConfiguracion | null;
  farmaceuticos: FarmaceuticoOption[];
}> {
  try {
    // 1. Obtener tenant y sucursal principal
    const sql = `
      select 
        t.id as tenant_id,
        t.ruc,
        t.razon_social,
        t.nombre_comercial,
        t.configuracion,
        s.id as sucursal_id,
        s.nombre as sucursal_nombre,
        s.direccion as direccion_fiscal,
        s.ubigeo,
        s.telefono as sucursal_telefono,
        s.codigo_establecimiento_sunat,
        s.autorizacion_digemid,
        s.director_tecnico_id,
        p.nombres || ' ' || p.apellidos as director_tecnico_nombre,
        p.cqfp as director_tecnico_cqfp
      from public.tenants t
      left join public.sucursales s on s.tenant_id = t.id and s.codigo_establecimiento_sunat = '0000' and s.activo = true
      left join public.perfiles p on p.id = s.director_tecnico_id
      where t.activo = true
      limit 1;
    `;

    const rows = await query(sql);
    if (rows.length === 0) {
      return { configuracion: null, farmaceuticos: [] };
    }

    const row = rows[0];
    const cfg = row.configuracion || {};

    const configuracion: BoticaConfiguracion = {
      tenant_id: row.tenant_id,
      ruc: row.ruc,
      razon_social: row.razon_social,
      nombre_comercial: row.nombre_comercial,
      telefono_contacto: cfg.telefono_contacto || row.sucursal_telefono || '',
      email_contacto: cfg.email_contacto || '',
      direccion_fiscal: row.direccion_fiscal || 'Av. Principal 123',
      ubigeo: row.ubigeo || '200101',

      autorizacion_digemid: row.autorizacion_digemid || cfg.autorizacion_digemid || '',
      director_tecnico_id: row.director_tecnico_id || null,
      director_tecnico_nombre: row.director_tecnico_nombre || 'No asignado',
      director_tecnico_cqfp: row.director_tecnico_cqfp || '',
      modo_fefo_estricto: cfg.modo_fefo_estricto ?? true,

      dias_alerta_preventiva: cfg.dias_alerta_preventiva ?? 180,
      dias_alerta_critica: cfg.dias_alerta_critica ?? 60,

      formato_ticket_termico: cfg.formato_ticket_termico || '80mm',
      mensaje_pie_ticket: cfg.mensaje_pie_ticket || '¡Gracias por su preferencia! Conserve su comprobante para cualquier reclamo.',
      max_descuento_cajero_pct: cfg.max_descuento_cajero_pct ?? 10,
      imprimir_qr_sunat: cfg.imprimir_qr_sunat ?? true,
      igv_pct: cfg.igv_pct ?? 18,

      sucursal_id: row.sucursal_id,
      sucursal_nombre: row.sucursal_nombre || 'Sede Principal',
      codigo_establecimiento_sunat: row.codigo_establecimiento_sunat || '0000',
    };

    // 2. Obtener lista de profesionales Químicos Farmacéuticos registrados para asignar Director Técnico
    const qfSql = `
      select 
        id,
        nombres || ' ' || apellidos as nombre_completo,
        coalesce(cqfp, 'S/C') as cqfp,
        coalesce(dni, '') as dni
      from public.perfiles
      where tenant_id = $1 and rol in ('director_tecnico', 'administrador', 'propietario') and activo = true
      order by nombres asc;
    `;
    const qfRows = await query(qfSql, [row.tenant_id]);
    const farmaceuticos: FarmaceuticoOption[] = qfRows.map((q) => ({
      id: q.id,
      nombre_completo: q.nombre_completo,
      cqfp: q.cqfp,
      dni: q.dni,
    }));

    return { configuracion, farmaceuticos };
  } catch (error) {
    console.error('Error al obtener configuración de botica:', error);
    return { configuracion: null, farmaceuticos: [] };
  }
}
