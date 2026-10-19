export interface OppfItem {
  ruc: string;
  codigo_establecimiento: string;
  codigo_producto: string;
  nombre_comercial: string;
  nombre_generico: string | null;
  presentacion: string;
  precio_unitario: number;
  condicion_venta: string;
  registro_sanitario: string | null;
  stock_actual: number;
}

export interface BalanceTrimestralItem {
  producto_id: string;
  nombre_comercial: string;
  nombre_generico: string | null;
  concentracion: string | null;
  unidad_base: string;
  saldo_inicial: number;
  entradas_compras: number;
  salidas_recetas: number;
  bajas_mermas: number;
  saldo_final: number;
}

export interface SireVentaItem {
  id: string;
  fecha_emision: string;
  tipo_comprobante: string;
  serie: string;
  numero: number;
  cliente_documento: string | null;
  cliente_nombre: string | null;
  subtotal: number;
  igv: number;
  total: number;
  estado_sunat: string;
}

export interface MetricasGerenciales {
  ventasMesTotal: number;
  comprasMesTotal: number;
  margenBrutoEstimado: number;
  ticketPromedio: number;
  topProductos: { nombre: string; unidades: number; total: number }[];
}
