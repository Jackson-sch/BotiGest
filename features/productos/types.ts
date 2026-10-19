export interface PresentacionItem {
  id?: string;
  producto_id?: string;
  nombre: string; // e.g. "Unidad", "Blíster x10", "Caja x100"
  factor_base: number; // e.g. 1, 10, 100
  codigo_barras?: string | null;
  precio_venta: number;
  es_default: boolean;
  activo?: boolean;
}

export interface ProductoItem {
  id: string;
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico?: string | null; // DCI
  concentracion?: string | null;
  forma_farmaceutica_id?: number | null;
  forma_farmaceutica_nombre?: string | null;
  laboratorio_id?: string | null;
  laboratorio_nombre?: string | null;
  categoria_id?: string | null;
  categoria_nombre?: string | null;
  tipo_producto: string;
  registro_sanitario?: string | null;
  condicion_venta: 'sin_receta' | 'con_receta' | 'receta_retenida' | 'psicotropico' | 'estupefaciente';
  es_controlado: boolean;
  es_generico: boolean;
  requiere_cadena_frio: boolean;
  unidad_base: string;
  unidad_medida_sunat: string;
  tipo_afectacion_igv: 'gravado' | 'exonerado' | 'inafecto';
  costo_ultimo: number;
  costo_promedio: number;
  activo: boolean;
  total_stock?: number;
  presentaciones: PresentacionItem[];
}

export interface CatalogoAuxiliares {
  laboratorios: { id: string; nombre: string }[];
  formas: { id: number; nombre: string; abreviatura: string | null }[];
  categorias: { id: string; nombre: string }[];
}
