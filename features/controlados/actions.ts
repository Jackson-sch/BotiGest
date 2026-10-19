'use server';

import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validarAsientoQfSchema, type ValidarAsientoQfInput } from './schemas';
import { revalidatePath } from 'next/cache';

export interface ValidacionQfResult {
  success: boolean;
  error?: string;
  code?: string;
}

/**
 * Server Action exclusivo del Director Técnico (Químico Farmacéutico) para firmar y validar
 * asientos en el libro oficial de sustancias controladas según D.S. 023-2001-SA y Ley 29459.
 */
export async function validarAsientoQfAction(input: ValidarAsientoQfInput): Promise<ValidacionQfResult> {
  const validation = validarAsientoQfSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      error: 'Debe iniciar sesión para validar libros oficiales.',
      code: 'UNAUTHORIZED',
    };
  }

  // Custodia legal indelegable del Químico Farmacéutico
  if (user.rol !== 'director_tecnico' && user.rol !== 'administrador' && user.rol !== 'propietario') {
    return {
      success: false,
      error: 'Acción rechazada por DIGEMID: La firma de libros oficiales de psicotrópicos y estupefacientes es potestad exclusiva del Director Técnico (Q.F.).',
      code: 'FORBIDDEN',
    };
  }

  try {
    // Si es Director Técnico, verificar que tenga Colegiatura registrada (CQFP)
    const perfil = await queryOne<{ cqfp: string | null }>(
      `select cqfp from public.perfiles where id = $1`,
      [user.id]
    );

    if (user.rol === 'director_tecnico' && (!perfil?.cqfp || perfil.cqfp.trim().length === 0)) {
      return {
        success: false,
        error: 'Su perfil de Director Técnico no tiene un número de Colegiatura CQFP válido registrado.',
        code: 'MISSING_CQFP',
      };
    }

    // Actualizar asiento con firma electrónica y marca de tiempo
    const res = await query(
      `update public.libro_controlados
       set 
         validado_por = $1,
         validado_at = now()
       where id = $2 and validado_por is null
       returning id`,
      [user.id, validation.data.asiento_id]
    );

    if (res.length === 0) {
      return {
        success: false,
        error: 'El asiento no existe o ya ha sido validado previamente.',
        code: 'ALREADY_VALIDATED',
      };
    }

    revalidatePath('/controlados');
    return { success: true };
  } catch (err: any) {
    console.error('Excepción en validarAsientoQfAction:', err);
    return {
      success: false,
      error: err.message || 'Error inesperado del servidor al asentar firma de Q.F.',
      code: 'INTERNAL_ERROR',
    };
  }
}
