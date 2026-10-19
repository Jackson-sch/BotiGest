import type { EstadoCompra } from '@/types/database';

export interface Proveedor {
  id: string;
  ruc: string;
  razon_social: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
}

export interface CompraItemInput {
  producto_id: string;
  producto_nombre: string;
  presentacion_id: string;
  presentacion_nombre: string;
  factor_base: number;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad: number; // en presentación (ej. 10 cajas)
  costo_unitario_presentacion: number; // sin IGV
}

export interface CompraItemDetalle extends CompraItemInput {
  id: string;
  cantidad_base: number;
  costo_unitario_base: number;
  total_item: number;
  lote_id?: string | null;
}

export interface CompraResumen {
  id: string;
  sucursal_id: string;
  sucursal_nombre: string;
  proveedor_id: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  tipo_documento: 'factura' | 'boleta' | 'guia_remision' | 'otro';
  serie_numero: string;
  fecha_emision: string;
  fecha_recepcion?: string | null;
  subtotal: number;
  igv: number;
  total: number;
  estado: EstadoCompra;
  usuario_nombre: string;
  observacion?: string | null;
  items_count: number;
}

export interface CompraCompleta extends CompraResumen {
  items: CompraItemDetalle[];
}
