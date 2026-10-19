import { z } from 'zod';

export const presentacionSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1, 'El nombre de la presentación es requerido'),
  factor_base: z.number().int().positive('El factor debe ser mayor a 0'),
  codigo_barras: z.string().optional().nullable(),
  precio_venta: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  es_default: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export const guardarProductoSchema = z.object({
  id: z.string().uuid().optional(),
  codigo_interno: z.string().min(2, 'Código interno requerido'),
  nombre_comercial: z.string().min(2, 'Nombre comercial requerido'),
  nombre_generico: z.string().optional().nullable(), // DCI
  concentracion: z.string().optional().nullable(),
  forma_farmaceutica_id: z.number().int().positive().optional().nullable(),
  laboratorio_id: z.string().uuid().optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
  registro_sanitario: z.string().optional().nullable(),
  condicion_venta: z.enum([
    'sin_receta',
    'con_receta',
    'receta_retenida',
    'psicotropico',
    'estupefaciente',
  ]).default('sin_receta'),
  es_controlado: z.boolean().default(false),
  es_generico: z.boolean().default(false),
  requiere_cadena_frio: z.boolean().default(false),
  unidad_base: z.string().default('UNIDAD'),
  unidad_medida_sunat: z.string().default('NIU'),
  tipo_afectacion_igv: z.enum(['gravado', 'exonerado', 'inafecto']).default('gravado'),
  costo_ultimo: z.number().min(0).default(0),
  activo: z.boolean().default(true),
  presentaciones: z.array(presentacionSchema).min(1, 'Debe incluir al menos una presentación (ej. Unidad)'),
});

export type GuardarProductoInput = z.infer<typeof guardarProductoSchema>;
