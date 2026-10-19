import type { TipoMovimiento } from '@/types/database';

export type EstadoLoteStock = 'disponible' | 'cuarentena' | 'bloqueado' | 'vencido';

export interface LoteConStock {
  id: string; // lote_id
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  concentracion: string | null;
  laboratorio: string;
  numero_lote: string;
  fecha_vencimiento: string;
  dias_para_vencer: number;
  cantidad_base: number;
  unidad_base: string;
  estado: EstadoLoteStock;
  costo_promedio: number;
  stock_minimo: number;
  requiere_cadena_frio: boolean;
}

export interface MovimientoKardex {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  producto_codigo?: string;
  producto_nombre: string;
  unidad_base?: string;
  numero_lote: string;
  fecha_vencimiento?: string;
  cantidad_base: number; // con signo (+ o -)
  costo_unitario: number;
  saldo_lote_posterior: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  usuario_nombre: string;
  observacion?: string | null;
  tenant_ruc?: string;
  tenant_razon_social?: string;
}

export interface AlertaVencimientoItem {
  lote_id: string;
  producto_id: string;
  nombre_comercial: string;
  numero_lote: string;
  fecha_vencimiento: string;
  dias_para_vencer: number;
  cantidad_base: number;
  unidad_base: string;
  nivel: 'urgente' | 'alerta' | 'preventivo'; // <30d, <60d, <90d
  laboratorio?: string;
  precio_venta?: number;
  costo_promedio?: number;
  sucursal_id?: string;
}

export interface ResumenInventario {
  totalProductosActivos: number;
  totalUnidadesStock: number;
  valorizadoTotalPEN: number;
  lotesPorVencer90d: number;
  lotesVencidos: number;
  productosStockBajo: number;
}
