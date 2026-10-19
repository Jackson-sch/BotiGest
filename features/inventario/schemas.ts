import { z } from 'zod';

export const ajustarStockSchema = z.object({
  sucursal_id: z.string().uuid({ message: 'Sucursal inválida' }),
  lote_id: z.string().uuid({ message: 'Lote inválido' }),
  producto_id: z.string().uuid({ message: 'Producto inválido' }),
  tipo: z.enum(['ajuste_positivo', 'ajuste_negativo', 'merma', 'vencimiento']),
  cantidad_base: z.number().int().positive({ message: 'La cantidad debe ser mayor a 0' }),
  motivo: z.string().min(5, { message: 'El motivo del ajuste debe tener al menos 5 caracteres' }),
});

export type AjustarStockInput = z.infer<typeof ajustarStockSchema>;

export const darDeBajaSchema = z.object({
  lote_id: z.string().uuid({ message: 'Lote inválido' }),
  sucursal_id: z.string().uuid().optional(),
  cantidad: z.number().int().positive({ message: 'La cantidad debe ser mayor a 0' }),
  tipo_baja: z.enum(['vencimiento', 'merma', 'deterioro', 'rotura', 'observacion_sanitaria']).default('vencimiento'),
  motivo: z.string().min(5, { message: 'Debe especificar el motivo o justificación técnica' }),
  acta_numero: z.string().optional(),
});

export type DarDeBajaInput = z.infer<typeof darDeBajaSchema>;

