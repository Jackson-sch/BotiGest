import { query, queryOne } from '@/lib/db';

export interface RegistroTemperaturaHumedad {
  id: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  zona: 'ambiente' | 'cadena_frio';
  turno: 'mañana' | 'tarde';
  fecha: string;
  hora: string;
  temperatura: number;
  humedad?: number;
  conformidad: boolean;
  observacion?: string;
  usuario_nombre?: string;
  created_at: string;
}

export async function obtenerRegistrosTemperatura(
  sucursalId?: string,
  diasAtras: number = 30
): Promise<RegistroTemperaturaHumedad[]> {
  try {
    const params: any[] = [diasAtras];
    let sucursalFilter = '';
    if (sucursalId) {
      params.push(sucursalId);
      sucursalFilter = `AND r.sucursal_id = $2`;
    }

    const sql = `
      SELECT 
        r.id,
        r.sucursal_id,
        s.nombre as sucursal_nombre,
        r.zona,
        r.turno,
        to_char(r.fecha, 'YYYY-MM-DD') as fecha,
        to_char(r.hora, 'HH24:MI') as hora,
        r.temperatura::numeric as temperatura,
        r.humedad::numeric as humedad,
        r.conformidad,
        r.observacion,
        concat(p.nombres, ' ', p.apellidos) as usuario_nombre,
        to_char(r.created_at, 'YYYY-MM-DD HH24:MI') as created_at
      FROM public.registros_temperatura_humedad r
      JOIN public.sucursales s ON s.id = r.sucursal_id
      LEFT JOIN public.perfiles p ON p.id = r.usuario_id
      WHERE r.fecha >= (current_date - ($1 || ' days')::interval)
      ${sucursalFilter}
      ORDER BY r.fecha DESC, r.hora DESC;
    `;

    return await query<RegistroTemperaturaHumedad>(sql, params);
  } catch (error) {
    console.error('Error al obtener registros de temperatura:', error);
    return [];
  }
}
