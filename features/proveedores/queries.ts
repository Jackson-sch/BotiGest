import { query } from '@/lib/db';
import type { ProveedorItem } from './types';

/**
 * Consulta la lista consolidada de proveedores y droguerías con sus métricas de compra.
 */
export async function obtenerProveedores(): Promise<ProveedorItem[]> {
  const sql = `
    select 
      p.id,
      p.ruc,
      p.razon_social,
      p.contacto,
      p.telefono,
      p.email,
      p.direccion,
      p.activo,
      coalesce(count(c.id), 0)::integer as total_compras,
      coalesce(sum(case when c.estado = 'recibida' then c.total else 0 end), 0)::numeric as total_monto_compras,
      to_char(p.created_at, 'DD/MM/YYYY') as created_at
    from public.proveedores p
    left join public.compras c on c.proveedor_id = p.id
    group by p.id
    order by p.razon_social asc;
  `;

  try {
    const rows = await query(sql);
    return rows.map((r) => ({
      id: r.id,
      ruc: r.ruc,
      razon_social: r.razon_social,
      contacto: r.contacto || null,
      telefono: r.telefono || null,
      email: r.email || null,
      direccion: r.direccion || null,
      activo: Boolean(r.activo),
      total_compras: Number(r.total_compras || 0),
      total_monto_compras: Number(r.total_monto_compras || 0),
      created_at: r.created_at || '',
    }));
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return [];
  }
}
