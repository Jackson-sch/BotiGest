'use server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface GuardarRegistroTemperaturaInput {
  sucursalId: string;
  zona: 'ambiente' | 'cadena_frio';
  turno: 'mañana' | 'tarde';
  fecha?: string;
  temperatura: number;
  humedad?: number;
  observacion?: string;
}

export async function guardarRegistroTemperaturaAction(input: GuardarRegistroTemperaturaInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autorizado' };

  if (isNaN(input.temperatura)) {
    return { success: false, error: 'La temperatura ingresada no es válida' };
  }

  // Evaluar conformidad regulatoria DIGEMID / BPA
  let conformidad = true;
  if (input.zona === 'ambiente') {
    // Ambiente: T <= 30°C y Humedad <= 70%
    if (input.temperatura > 30 || input.temperatura < 15) conformidad = false;
    if (input.humedad !== undefined && (input.humedad > 70 || input.humedad < 30)) conformidad = false;
  } else if (input.zona === 'cadena_frio') {
    // Cadena de frío: 2°C a 8°C
    if (input.temperatura < 2 || input.temperatura > 8) conformidad = false;
  }

  const client = await pool.connect();
  try {
    const fecha = input.fecha || new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO public.registros_temperatura_humedad (
        tenant_id,
        sucursal_id,
        zona,
        turno,
        fecha,
        temperatura,
        humedad,
        usuario_id,
        conformidad,
        observacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (sucursal_id, zona, fecha, turno)
      DO UPDATE SET
        temperatura = EXCLUDED.temperatura,
        humedad = EXCLUDED.humedad,
        usuario_id = EXCLUDED.usuario_id,
        conformidad = EXCLUDED.conformidad,
        observacion = EXCLUDED.observacion,
        hora = current_time
      RETURNING id;
    `;

    await client.query(sql, [
      user.tenantId,
      input.sucursalId,
      input.zona,
      input.turno,
      fecha,
      input.temperatura,
      input.humedad !== undefined ? input.humedad : null,
      user.id,
      conformidad,
      input.observacion || null,
    ]);

    revalidatePath('/controlados');
    revalidatePath('/');
    return { success: true, conformidad };
  } catch (error: any) {
    console.error('Error al guardar registro BPA:', error);
    return { success: false, error: error.message || 'Error al guardar lectura' };
  } finally {
    client.release();
  }
}
