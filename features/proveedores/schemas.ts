import { z } from 'zod';

export const proveedorSchema = z.object({
  id: z.string().uuid().optional(),
  ruc: z
    .string()
    .trim()
    .length(11, 'El RUC debe tener exactamente 11 dígitos numéricos.')
    .regex(/^[0-9]+$/, 'El RUC solo debe contener números.'),
  razon_social: z
    .string()
    .trim()
    .min(3, 'La razón social debe tener al menos 3 caracteres.')
    .max(255, 'La razón social no puede exceder los 255 caracteres.'),
  contacto: z.string().trim().max(150).optional().nullable(),
  telefono: z.string().trim().max(50).optional().nullable(),
  email: z
    .string()
    .trim()
    .email('Ingrese un correo electrónico válido.')
    .max(100)
    .optional()
    .nullable()
    .or(z.literal('')),
  direccion: z.string().trim().max(255).optional().nullable(),
  activo: z.boolean().default(true),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;
