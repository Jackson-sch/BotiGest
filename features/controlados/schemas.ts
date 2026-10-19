import { z } from 'zod';

export const validarAsientoQfSchema = z.object({
  asiento_id: z.number().int().positive(),
  pin_director_tecnico: z.string().min(4, { message: 'El PIN de validación debe tener al menos 4 dígitos' }),
  observacion: z.string().optional(),
});

export type ValidarAsientoQfInput = z.infer<typeof validarAsientoQfSchema>;

export const validarLoteAsientosSchema = z.object({
  asiento_ids: z.array(z.number().int().positive()).min(1, { message: 'Seleccione al menos un asiento para firmar' }),
  pin_director_tecnico: z.string().min(4, { message: 'Ingrese su PIN de Director Técnico' }),
});

export type ValidarLoteAsientosInput = z.infer<typeof validarLoteAsientosSchema>;
