import { query } from '@/lib/db';
import type { PerfilUsuarioItem, SucursalItem } from './types';

export async function getPersonalUsuarios(): Promise<PerfilUsuarioItem[]> {
  try {
    const rows = await query<any>(`
      select 
        p.id,
        p.nombres,
        p.apellidos,
        p.dni,
        p.cqfp,
        p.rol,
        p.activo,
        p.created_at,
        s.id as sucursal_id,
        s.nombre as sucursal_nombre
      from public.perfiles p
      left join public.usuario_sucursal us on us.perfil_id = p.id
      left join public.sucursales s on s.id = us.sucursal_id
      order by p.activo desc, p.rol asc, p.nombres asc
    `);

    return rows.map((r) => ({
      id: r.id,
      nombres: r.nombres,
      apellidos: r.apellidos,
      dni: r.dni,
      cqfp: r.cqfp,
      rol: r.rol,
      activo: r.activo,
      sucursal_id: r.sucursal_id,
      sucursal_nombre: r.sucursal_nombre,
      created_at: r.created_at,
    }));
  } catch (err) {
    console.error('Error en getPersonalUsuarios:', err);
    return [];
  }
}

export async function getSucursalesYCajas(): Promise<SucursalItem[]> {
  try {
    const [sucRows, cajaRows, serieRows] = await Promise.all([
      query<any>(`
        select id, codigo, nombre, direccion, codigo_establecimiento_sunat, autorizacion_digemid, activo
        from public.sucursales
        order by codigo asc
      `),
      query<any>(`
        select id, sucursal_id, nombre, activo
        from public.cajas
        order by nombre asc
      `),
      query<any>(`
        select id, caja_id, tipo, serie, ultimo_numero
        from public.series_comprobante
        order by tipo asc
      `),
    ]);

    const seriesByCaja = new Map<string, any[]>();
    for (const s of serieRows) {
      if (!seriesByCaja.has(s.caja_id)) {
        seriesByCaja.set(s.caja_id, []);
      }
      seriesByCaja.get(s.caja_id)!.push({
        id: s.id,
        tipo: s.tipo,
        serie: s.serie,
        ultimo_numero: s.ultimo_numero,
      });
    }

    const cajasBySucursal = new Map<string, any[]>();
    for (const c of cajaRows) {
      if (!cajasBySucursal.has(c.sucursal_id)) {
        cajasBySucursal.set(c.sucursal_id, []);
      }
      cajasBySucursal.get(c.sucursal_id)!.push({
        id: c.id,
        nombre: c.nombre,
        activo: c.activo,
        series: seriesByCaja.get(c.id) || [],
      });
    }

    return sucRows.map((s) => ({
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      codigo_establecimiento_sunat: s.codigo_establecimiento_sunat,
      autorizacion_digemid: s.autorizacion_digemid,
      activo: s.activo,
      cajas: cajasBySucursal.get(s.id) || [],
    }));
  } catch (err) {
    console.error('Error en getSucursalesYCajas:', err);
    return [];
  }
}
