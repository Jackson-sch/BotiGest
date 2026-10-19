import type { TipoDocumentoIdentidad } from '@/types/database';

export interface Cliente {
  id: string;
  tenant_id: string;
  tipo_documento: TipoDocumentoIdentidad;
  numero_documento: string;
  nombres: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  puntos: number;
  consentimiento_datos: boolean;
  activo: boolean;
  tiene_credito: boolean;
  limite_credito: number;
  dias_credito: number;
  saldo_deudor: number;
  alergias?: string | null;
  condicion_medica?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados agregados
  total_compras?: number;
  ultima_compra?: string | null;
}

export type TipoMovimientoCC = 'cargo' | 'abono' | 'ajuste';

export interface ClienteMovimientoCC {
  id: string;
  tenant_id: string;
  sucursal_id?: string | null;
  cliente_id: string;
  tipo_movimiento: TipoMovimientoCC;
  monto: number;
  saldo_anterior: number;
  saldo_posterior: number;
  venta_id?: string | null;
  comprobante_referencia?: string | null;
  metodo_pago?: string | null;
  turno_caja_id?: string | null;
  registrado_por?: string | null;
  registrado_por_nombre?: string | null;
  observaciones?: string | null;
  created_at: string;
}

export interface ClienteDetalleCompleto extends Cliente {
  movimientos: ClienteMovimientoCC[];
  ventas_recientes: Array<{
    id: string;
    correlativo: string;
    tipo_comprobante: string;
    total: number;
    fecha_emision: string;
    estado: string;
  }>;
}

export interface ClientesMetricas {
  totalClientes: number;
  clientesConCredito: number;
  totalDeudaEnCalle: number;
  clientesDeudoresActivos: number;
  totalAbonosMes: number;
}
