import { z } from 'zod';

export const itemVentaSchema = z.object({
  presentacion_id: z.string().uuid({ message: 'Presentación inválida' }),
  cantidad: z.number().int().positive({ message: 'La cantidad debe ser mayor a 0' }),
  descuento: z.number().min(0, { message: 'El descuento no puede ser negativo' }).default(0),
});

export const pagoVentaSchema = z.object({
  metodo: z.enum(['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia', 'credito', 'convenio']),
  monto: z.number().positive({ message: 'El monto pagado debe ser mayor a 0' }),
  referencia: z.string().optional().nullable(),
});

export const recetaVentaSchema = z.object({
  medico_id: z.string().uuid().optional().nullable(),
  medico_nombre: z.string().min(2, { message: 'Nombre del médico requerido' }),
  medico_cmp: z.string().min(3, { message: 'CMP del médico requerido' }),
  paciente_nombre: z.string().min(2, { message: 'Nombre del paciente requerido' }),
  paciente_documento: z.string().optional().nullable(),
  numero_receta: z.string().optional().nullable(),
  fecha_emision: z.string().min(10, { message: 'Fecha de emisión requerida' }),
  retenida: z.boolean().default(false),
  diagnostico_cie10: z.string().optional().nullable(),
  imagen_path: z.string().optional().nullable(),
});

export const registrarVentaSchema = z.object({
  offline_id: z.string().uuid().optional().nullable(),
  sucursal_id: z.string().uuid().optional(),
  caja_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional().nullable(),
  cliente_documento: z.string().optional().nullable(),
  cliente_nombre: z.string().optional().nullable(),
  convenio_id: z.string().uuid().optional().nullable(),
  tipo_comprobante: z.enum(['boleta', 'factura', 'nota_venta']),
  items: z.array(itemVentaSchema).min(1, { message: 'El carrito debe tener al menos un ítem' }),
  pagos: z.array(pagoVentaSchema).min(1, { message: 'Debe ingresar al menos un método de pago' }),
  receta: recetaVentaSchema.optional().nullable(),
});

export type RegistrarVentaInput = z.infer<typeof registrarVentaSchema>;
