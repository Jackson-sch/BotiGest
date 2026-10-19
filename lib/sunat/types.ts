/**
 * Tipos oficiales para Facturación Electrónica SUNAT (UBL 2.1 - Perú)
 */

export type TipoComprobanteSunat = '01' | '03' | '07' | '08'; 
// 01: Factura, 03: Boleta, 07: Nota de Crédito, 08: Nota de Débito

export type TipoDocumentoIdentidadSunat = '0' | '1' | '4' | '6' | '7'; 
// 0: Doc Trib No Dom, 1: DNI, 4: Carnet Extranjería, 6: RUC, 7: Pasaporte

export interface SunatEmisor {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion: string;
  ubigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  codigoEstablecimiento: string; // ej: '0000'
}

export interface SunatCliente {
  tipoDoc: TipoDocumentoIdentidadSunat;
  numeroDoc: string;
  razonSocialONombre: string;
  direccion?: string;
}

export interface SunatItem {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string; // 'NIU' para unidades, 'BX' para cajas
  cantidad: number;
  valorUnitario: number; // Precio sin IGV
  precioUnitario: number; // Precio con IGV
  tipoAfectacion: '10' | '20' | '30'; // 10: Gravado, 20: Exonerado, 30: Inafecto
  subtotal: number;
  igv: number;
  total: number;
  lote?: string;
  fechaVencimiento?: string;
}

export interface SunatComprobantePayload {
  tipoComprobante: TipoComprobanteSunat;
  serie: string;
  numero: number;
  fechaEmision: string; // YYYY-MM-DD
  horaEmision: string; // HH:mm:ss
  moneda: 'PEN' | 'USD';
  emisor: SunatEmisor;
  cliente: SunatCliente;
  items: SunatItem[];
  subtotalGravado: number;
  subtotalExonerado: number;
  subtotalInafecto: number;
  totalIgv: number;
  totalDescuento: number;
  totalVenta: number;
  observaciones?: string;
}

export interface SunatRespuestaEnvio {
  success: boolean;
  codigoSunat?: string; // '0' para aceptado
  mensajeSunat: string;
  hashCpe?: string;
  xmlBase64?: string;
  cdrBase64?: string;
  ticketSunat?: string; // Para envíos asíncronos / resumen de boletas
  observaciones?: string[];
  error?: string;
}
