import { z } from 'zod';

export const anularVentaSchema = z.object({
  venta_id: z.string().uuid({ message: 'Identificador de venta inválido' }),
  motivo: z.string().min(6, { message: 'El motivo de anulación debe tener al menos 6 caracteres' }),
  pin_autorizacion: z.string().min(4, { message: 'Se requiere el PIN de autorización de Administrador o QF' }),
});

export type AnularVentaInput = z.infer<typeof anularVentaSchema>;

export const filtrosVentasSchema = z.object({
  query: z.string().optional(),
  tipo_comprobante: z.enum(['todos', 'boleta', 'factura', 'nota_venta']).default('todos'),
  estado_sunat: z.enum(['todos', 'pendiente', 'enviado', 'aceptado', 'rechazado', 'anulado', 'error']).default('todos'),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
});

export type FiltrosVentasInput = z.infer<typeof filtrosVentasSchema>;
