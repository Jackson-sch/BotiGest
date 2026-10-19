import type {
  TipoComprobante,
  EstadoVenta,
  EstadoSunat,
  MetodoPago,
  TipoAfectacionIgv,
} from '@/types/database';

export interface VentaResumen {
  id: string;
  tipo_comprobante: TipoComprobante;
  serie: string;
  numero: number;
  correlativo: string; // ej. B001-000154
  fecha_emision: string;
  cliente_documento?: string | null;
  cliente_nombre: string;
  total: number;
  igv: number;
  estado: EstadoVenta;
  estado_sunat: EstadoSunat;
  mensaje_sunat?: string | null;
  vendedor_nombre: string;
  caja_nombre: string;
  requiere_receta: boolean;
}

export interface VentaItemDetalle {
  id: string;
  producto_nombre: string;
  presentacion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  total: number;
  tipo_afectacion_igv: TipoAfectacionIgv;
  lotes_despachados: {
    lote_id: string;
    numero_lote: string;
    cantidad_base: number;
  }[];
}

export interface VentaCompleta extends VentaResumen {
  items: VentaItemDetalle[];
  pagos: {
    metodo: MetodoPago;
    monto: number;
    referencia?: string | null;
  }[];
  receta?: {
    medico_cmp: string;
    medico_nombre: string;
    paciente_nombre: string;
    numero_receta: string;
    retenida: boolean;
  } | null;
  motivo_anulacion?: string | null;
  anulada_por_nombre?: string | null;
  anulada_at?: string | null;
  comprobante_electronico?: {
    hash?: string | null;
    codigo_sunat?: string | null;
    mensaje_sunat?: string | null;
    pdf_url?: string | null;
    xml_url?: string | null;
    cdr_url?: string | null;
  } | null;
}
