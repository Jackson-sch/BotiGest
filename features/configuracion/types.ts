export interface BoticaConfiguracion {
  // Datos de la empresa / tenant
  tenant_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  telefono_contacto: string;
  email_contacto: string;
  direccion_fiscal: string;
  ubigeo: string;

  // Regulación Sanitaria DIGEMID / DIRIS
  autorizacion_digemid: string;
  director_tecnico_nombre: string;
  director_tecnico_cqfp: string;
  director_tecnico_id: string | null;
  modo_fefo_estricto: boolean;

  // Parámetros de Alertas de Vencimiento
  dias_alerta_preventiva: number; // Ej. 180 días (6 meses)
  dias_alerta_critica: number;   // Ej. 60 días (2 meses)

  // Configuración de POS & Ticket Térmico
  formato_ticket_termico: '80mm' | '58mm';
  mensaje_pie_ticket: string;
  max_descuento_cajero_pct: number;
  imprimir_qr_sunat: boolean;
  igv_pct: number;

  // Sucursal principal
  sucursal_id: string;
  sucursal_nombre: string;
  codigo_establecimiento_sunat: string;
}
