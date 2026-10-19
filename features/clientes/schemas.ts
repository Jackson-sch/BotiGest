import { z } from 'zod';

export const ClienteFormSchema = z
  .object({
    id: z.string().optional(),
    tipo_documento: z.enum(['dni', 'ruc', 'ce', 'pasaporte'], {
      required_error: 'Seleccione un tipo de documento.',
    }),
    numero_documento: z
      .string()
      .min(3, 'El número de documento debe tener al menos 3 caracteres.')
      .max(20, 'El número de documento no puede superar 20 caracteres.')
      .trim(),
    nombres: z
      .string()
      .min(2, 'Ingrese los nombres o razón social del cliente.')
      .max(200, 'El nombre no puede exceder 200 caracteres.')
      .trim(),
    direccion: z.string().max(255).optional().or(z.literal('')),
    telefono: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email('Ingrese un correo válido').optional().or(z.literal('')),
    // Línea de Crédito & Cuenta Corriente
    tiene_credito: z.boolean().default(false),
    limite_credito: z.coerce.number().min(0, 'El límite no puede ser negativo').default(0),
    dias_credito: z.coerce.number().int().min(1, 'El plazo mínimo es 1 día').default(30),
    // Perfil Clínico Farmacéutico
    alergias: z.string().max(300).optional().or(z.literal('')),
    condicion_medica: z.string().max(300).optional().or(z.literal('')),
    notas: z.string().max(500).optional().or(z.literal('')),
    // Protección de datos personales (Ley 29733)
    consentimiento_datos: z.boolean().default(true),
    activo: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_documento === 'dni' && !/^\d{8}$/.test(data.numero_documento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El DNI debe contener exactamente 8 dígitos numéricos.',
        path: ['numero_documento'],
      });
    } else if (data.tipo_documento === 'ruc' && !/^\d{11}$/.test(data.numero_documento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El RUC debe contener exactamente 11 dígitos numéricos.',
        path: ['numero_documento'],
      });
    }

    if (data.tiene_credito && data.limite_credito <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Si habilita crédito, defina un límite mayor a S/ 0.00.',
        path: ['limite_credito'],
      });
    }
  });

export type ClienteFormValues = z.infer<typeof ClienteFormSchema>;

export const AbonoFormSchema = z.object({
  cliente_id: z.string().uuid('ID de cliente inválido.'),
  monto: z.coerce
    .number()
    .positive('El monto a abonar debe ser mayor a 0.')
    .max(50000, 'El monto es excesivo.'),
  metodo_pago: z.enum(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'], {
    required_error: 'Seleccione el medio de pago.',
  }),
  comprobante_referencia: z
    .string()
    .max(50, 'La referencia no puede exceder 50 caracteres.')
    .optional()
    .or(z.literal('')),
  observaciones: z
    .string()
    .max(300, 'Las observaciones no pueden exceder 300 caracteres.')
    .optional()
    .or(z.literal('')),
});

export type AbonoFormValues = z.infer<typeof AbonoFormSchema>;
