import { z } from 'zod';

export const boticaConfiguracionSchema = z.object({
  tenant_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),

  // Datos de la empresa
  ruc: z
    .string()
    .trim()
    .length(11, 'El RUC debe tener 11 dígitos.')
    .regex(/^[0-9]+$/, 'El RUC debe contener solo números.'),
  razon_social: z.string().trim().min(3, 'La razón social debe tener al menos 3 caracteres.'),
  nombre_comercial: z.string().trim().min(2, 'El nombre comercial es obligatorio.'),
  telefono_contacto: z.string().trim().max(50).default(''),
  email_contacto: z.string().trim().max(100).default(''),
  direccion_fiscal: z.string().trim().min(3, 'La dirección fiscal es obligatoria.'),
  ubigeo: z.string().trim().length(6, 'El código de ubigeo debe tener 6 dígitos.').default('200101'),

  // Regulación Sanitaria DIGEMID
  autorizacion_digemid: z.string().trim().default(''),
  director_tecnico_id: z.string().uuid().optional().nullable(),
  modo_fefo_estricto: z.boolean().default(true),

  // Alertas de vencimiento
  dias_alerta_preventiva: z.coerce.number().int().min(30).max(365).default(180),
  dias_alerta_critica: z.coerce.number().int().min(15).max(180).default(60),

  // Formato de Ticket y Caja
  formato_ticket_termico: z.enum(['80mm', '58mm']).default('80mm'),
  mensaje_pie_ticket: z.string().trim().max(255).default('¡Gracias por su preferencia! Conserve su comprobante.'),
  max_descuento_cajero_pct: z.coerce.number().min(0).max(50).default(10),
  imprimir_qr_sunat: z.boolean().default(true),
  igv_pct: z.coerce.number().default(18),
  codigo_establecimiento_sunat: z.string().trim().length(4, 'El código de anexo SUNAT debe tener 4 dígitos.').default('0000'),
});

export type BoticaConfiguracionInput = z.infer<typeof boticaConfiguracionSchema>;
