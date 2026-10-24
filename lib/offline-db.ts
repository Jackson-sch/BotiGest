import Dexie, { type Table } from 'dexie';

export interface OfflineProducto {
  id: string;
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico?: string;
  concentracion?: string;
  presentacion_nombre: string;
  presentacion_id: string;
  precio_venta: number;
  stock_actual: number;
  codigo_barras?: string;
  lote_id: string;
  numero_lote: string;
  fecha_vencimiento: string;
  unidad_base: string;
  factor_base: number;
  tipo_afectacion_igv: string;
  condicion_venta: string;
  laboratorio?: string;
  updated_at: number;
}

export interface OfflineVentaQueue {
  id?: number;
  offline_id: string;
  sucursal_id: string;
  caja_id: string;
  turno_id: string;
  cliente_id?: string;
  tipo_comprobante: string;
  metodo_pago: string;
  monto_recibido?: number;
  vuelto?: number;
  subtotal: number;
  igv: number;
  total: number;
  items: {
    producto_id: string;
    presentacion_id: string;
    lote_id: string;
    descripcion: string;
    cantidad: number;
    factor_base: number;
    precio_unitario: number;
    descuento: number;
    tipo_afectacion_igv: string;
    valor_venta: number;
    igv: number;
    total: number;
  }[];
  estado_sync: 'pendiente' | 'sincronizando' | 'error' | 'sincronizado';
  error_mensaje?: string;
  created_at: number;
}

export class BotiGestOfflineDB extends Dexie {
  productos!: Table<OfflineProducto, string>;
  ventasQueue!: Table<OfflineVentaQueue, number>;

  constructor() {
    super('botigest_offline_db');
    this.version(1).stores({
      productos: 'id, codigo_barras, nombre_comercial, nombre_generico',
      ventasQueue: '++id, offline_id, estado_sync, created_at'
    });
  }
}

export const offlineDB = new BotiGestOfflineDB();
