import { z } from 'zod';

export const compraItemSchema = z.object({
  producto_id: z.string().uuid({ message: 'Producto inválido' }),
  presentacion_id: z.string().uuid({ message: 'Presentación inválida' }),
  numero_lote: z.string().min(2, { message: 'El número de lote es obligatorio' }),
  fecha_vencimiento: z.string().min(10, { message: 'Fecha de vencimiento requerida' }),
  cantidad: z.number().int().positive({ message: 'La cantidad debe ser mayor a 0' }),
  factor_base: z.number().int().positive({ message: 'Factor de conversión inválido' }),
  costo_unitario_presentacion: z.number().min(0, { message: 'El costo unitario no puede ser negativo' }),
});

export const registrarCompraSchema = z.object({
  sucursal_id: z.string().uuid().optional(),
  proveedor_id: z.string().uuid({ message: 'Proveedor requerido' }),
  tipo_documento: z.enum(['factura', 'boleta', 'guia_remision', 'otro']),
  serie_numero: z.string().min(3, { message: 'Número de comprobante del proveedor requerido' }),
  fecha_emision: z.string().min(10, { message: 'Fecha de emisión requerida' }),
  observacion: z.string().optional().nullable(),
  items: z.array(compraItemSchema).min(1, { message: 'La compra debe contener al menos un producto' }),
});

export type RegistrarCompraInput = z.infer<typeof registrarCompraSchema>;

export const recibirCompraSchema = z.object({
  compra_id: z.string().uuid({ message: 'ID de compra inválido' }),
});

export type RecibirCompraInput = z.infer<typeof recibirCompraSchema>;
