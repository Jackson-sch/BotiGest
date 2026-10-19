import { z } from 'zod';

export const guardarUsuarioSchema = z.object({
  id: z.string().uuid().optional(),
  nombres: z.string().min(2, 'Los nombres son obligatorios'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  dni: z.string().length(8, 'El DNI debe tener exactamente 8 dígitos').regex(/^\d+$/, 'El DNI solo debe contener números'),
  cqfp: z.string().optional().nullable(),
  rol: z.enum(['propietario', 'administrador', 'director_tecnico', 'cajero', 'almacenero', 'contador']),
  pin: z.string().min(4, 'El PIN debe tener al menos 4 dígitos').max(6, 'El PIN no puede exceder 6 dígitos').optional().nullable(),
  sucursal_id: z.string().uuid().optional().nullable(),
  activo: z.boolean().default(true),
}).refine((data) => {
  if (data.rol === 'director_tecnico' && (!data.cqfp || data.cqfp.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'El número de Colegiatura CQFP es obligatorio para el Director Técnico (Q.F.)',
  path: ['cqfp'],
});

export type GuardarUsuarioInput = z.infer<typeof guardarUsuarioSchema>;

export const guardarCajaSchema = z.object({
  sucursal_id: z.string().uuid('Sucursal inválida'),
  nombre: z.string().min(2, 'El nombre de la caja es obligatorio'),
  serie_boleta: z.string().length(4, 'La serie de boleta debe tener 4 caracteres (ej. B001)').toUpperCase(),
  serie_factura: z.string().length(4, 'La serie de factura debe tener 4 caracteres (ej. F001)').toUpperCase(),
  serie_nota: z.string().length(4, 'La serie de nota de venta debe tener 4 caracteres (ej. NV01)').toUpperCase(),
});

export type GuardarCajaInput = z.infer<typeof guardarCajaSchema>;
