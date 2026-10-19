import { z } from 'zod';

export const abrirTurnoSchema = z.object({
  caja_id: z.string().uuid('Caja inválida'),
  monto_apertura: z.number().min(0, 'El monto inicial no puede ser negativo'),
  observacion: z.string().optional(),
});

export const registrarMovimientoEfectivoSchema = z.object({
  turno_id: z.string().uuid('Turno inválido'),
  tipo: z.enum(['ingreso', 'egreso']),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export const autorizacionDescuadreSchema = z.object({
  supervisor_dni: z.string().min(8, 'Ingrese un DNI de supervisor válido (8 dígitos)'),
  supervisor_pin: z.string().min(4, 'Ingrese el PIN de autorización (mínimo 4 dígitos)'),
  motivo_descuadre: z.string().min(5, 'Debe indicar el motivo o justificación del descuadre (mínimo 5 caracteres)'),
});

export const cerrarTurnoSchema = z.object({
  turno_id: z.string().uuid('Turno inválido'),
  monto_declarado: z.number().min(0, 'El monto contado no puede ser negativo'),
  total_piezas: z.number().min(0).optional(),
  declarar_gaveta_vacia: z.boolean().optional(),
  observacion: z.string().optional(),
  autorizacion: autorizacionDescuadreSchema.optional(),
});

export type AbrirTurnoInput = z.infer<typeof abrirTurnoSchema>;
export type RegistrarMovimientoEfectivoInput = z.infer<typeof registrarMovimientoEfectivoSchema>;
export type AutorizacionDescuadreInput = z.infer<typeof autorizacionDescuadreSchema>;
export type CerrarTurnoInput = z.infer<typeof cerrarTurnoSchema>;
