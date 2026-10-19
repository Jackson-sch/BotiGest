import type { CondicionVenta, TipoAfectacionIgv, TipoComprobante, MetodoPago } from '@/types/database';

export type { MetodoPago, TipoComprobante, CondicionVenta, TipoAfectacionIgv };

export interface AlternativaGenerica {
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico: string;
  concentracion: string | null;
  laboratorio: string;
  precio_venta: number;
  ahorro_porcentaje: number;
  stock_disponible_base: number;
  presentacion_id: string;
  presentacion_nombre: string;
}

export interface HeldCart {
  id: string; // Ej: "TK-01"
  correlativo: number;
  createdAt: string;
  items: CartItem[];
  cliente: PosClientData | null;
  tipo_comprobante: TipoComprobante;
  receta: RecetaData | null;
  total: number;
  itemsCount: number;
  observacion?: string;
}

export interface PosProductItem {
  id: string;
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico: string | null;
  concentracion: string | null;
  laboratorio: string;
  condicion_venta: CondicionVenta;
  es_controlado: boolean;
  es_generico: boolean;
  tipo_afectacion_igv: TipoAfectacionIgv;
  presentaciones: {
    id: string;
    nombre: string;
    factor_base: number;
    codigo_barras: string | null;
    precio_venta: number;
    es_default: boolean;
  }[];
  stock_disponible_base: number;
  unidad_base: string;
  alternativa_generica?: AlternativaGenerica;
}

export interface CartItem {
  id: string;
  producto_id: string;
  nombre_comercial: string;
  nombre_generico: string | null;
  concentracion: string | null;
  condicion_venta: CondicionVenta;
  tipo_afectacion_igv: TipoAfectacionIgv;
  presentacion_id: string;
  presentacion_nombre: string;
  factor_base: number;
  precio_unitario: number;
  cantidad: number;
  descuento: number;
  total: number;
  stock_disponible_base: number;
  presentaciones: PosProductItem['presentaciones'];
  alternativa_generica?: AlternativaGenerica;
}

export interface RecetaData {
  medico_cmp: string;
  medico_nombre: string;
  paciente_nombre: string;
  paciente_documento: string;
  numero_receta: string;
  fecha_emision: string;
  retenida: boolean;
  diagnostico_cie10?: string;
  imagen_path?: string | null;
}

export interface PosClientData {
  tipo_documento: 'dni' | 'ruc' | 'ce' | 'sin_documento';
  numero_documento: string;
  nombres: string;
  direccion?: string;
}

export interface PosPayment {
  metodo: MetodoPago;
  monto: number;
  referencia?: string;
}
