export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario =
  | 'propietario'
  | 'administrador'
  | 'director_tecnico'
  | 'cajero'
  | 'almacenero'
  | 'contador';

export type CondicionVenta =
  | 'sin_receta'
  | 'con_receta'
  | 'receta_retenida'
  | 'psicotropico'
  | 'estupefaciente';

export type TipoAfectacionIgv = 'gravado' | 'exonerado' | 'inafecto';
export type TipoDocumentoIdentidad = 'dni' | 'ruc' | 'ce' | 'pasaporte' | 'sin_documento';
export type TipoComprobante = 'boleta' | 'factura' | 'nota_credito' | 'nota_debito' | 'nota_venta';
export type EstadoVenta = 'completada' | 'anulada';
export type EstadoSunat = 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'anulado' | 'error';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'credito' | 'convenio';
export type EstadoCompra = 'borrador' | 'recibida' | 'anulada';
export type EstadoTransferencia = 'borrador' | 'en_transito' | 'recibida' | 'anulada';
export type EstadoTurno = 'abierto' | 'cerrado';
export type TipoMovimiento =
  | 'compra'
  | 'venta'
  | 'devolucion_cliente'
  | 'devolucion_proveedor'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'merma'
  | 'vencimiento'
  | 'transferencia_salida'
  | 'transferencia_entrada'
  | 'stock_inicial';

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          ruc: string;
          razon_social: string;
          nombre_comercial: string;
          plan: 'basico' | 'pro' | 'cadena';
          activo: boolean;
          configuracion: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tenants']['Row']>;
        Update: Partial<Database['public']['Tables']['tenants']['Row']>;
      };
      sucursales: {
        Row: {
          id: string;
          tenant_id: string;
          codigo: string;
          nombre: string;
          direccion: string;
          ubigeo: string | null;
          telefono: string | null;
          codigo_establecimiento_sunat: string;
          autorizacion_digemid: string | null;
          director_tecnico_id: string | null;
          es_almacen: boolean;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['sucursales']['Row']>;
        Update: Partial<Database['public']['Tables']['sucursales']['Row']>;
      };
      perfiles: {
        Row: {
          id: string;
          tenant_id: string;
          nombres: string;
          apellidos: string;
          dni: string | null;
          cqfp: string | null;
          rol: RolUsuario;
          pin_hash: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['perfiles']['Row']>;
        Update: Partial<Database['public']['Tables']['perfiles']['Row']>;
      };
      cajas: {
        Row: {
          id: string;
          tenant_id: string;
          sucursal_id: string;
          nombre: string;
          activo: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cajas']['Row']>;
        Update: Partial<Database['public']['Tables']['cajas']['Row']>;
      };
      turnos_caja: {
        Row: {
          id: string;
          tenant_id: string;
          sucursal_id: string;
          caja_id: string;
          usuario_id: string;
          estado: EstadoTurno;
          apertura_at: string;
          monto_apertura: number;
          cierre_at: string | null;
          monto_cierre_declarado: number | null;
          monto_cierre_sistema: number | null;
          diferencia: number | null;
          observacion: string | null;
        };
        Insert: Partial<Database['public']['Tables']['turnos_caja']['Row']>;
        Update: Partial<Database['public']['Tables']['turnos_caja']['Row']>;
      };
      productos: {
        Row: {
          id: string;
          tenant_id: string;
          codigo_interno: string;
          nombre_comercial: string;
          nombre_generico: string | null;
          concentracion: string | null;
          forma_farmaceutica_id: number | null;
          laboratorio_id: string | null;
          categoria_id: string | null;
          tipo_producto: 'medicamento' | 'dispositivo_medico' | 'producto_sanitario' | 'cosmetico' | 'suplemento' | 'otro';
          registro_sanitario: string | null;
          condicion_venta: CondicionVenta;
          es_controlado: boolean;
          es_generico: boolean;
          requiere_cadena_frio: boolean;
          unidad_base: string;
          unidad_medida_sunat: string;
          tipo_afectacion_igv: TipoAfectacionIgv;
          costo_ultimo: number;
          costo_promedio: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['productos']['Row']>;
        Update: Partial<Database['public']['Tables']['productos']['Row']>;
      };
      producto_presentaciones: {
        Row: {
          id: string;
          tenant_id: string;
          producto_id: string;
          nombre: string;
          factor_base: number;
          codigo_barras: string | null;
          precio_venta: number;
          es_default: boolean;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['producto_presentaciones']['Row']>;
        Update: Partial<Database['public']['Tables']['producto_presentaciones']['Row']>;
      };
      lotes: {
        Row: {
          id: string;
          tenant_id: string;
          producto_id: string;
          numero_lote: string;
          fecha_vencimiento: string;
          fecha_fabricacion: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['lotes']['Row']>;
        Update: Partial<Database['public']['Tables']['lotes']['Row']>;
      };
      stock_lotes: {
        Row: {
          tenant_id: string;
          sucursal_id: string;
          lote_id: string;
          producto_id: string;
          cantidad_base: number;
          estado: 'disponible' | 'cuarentena' | 'bloqueado' | 'vencido';
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['stock_lotes']['Row']>;
        Update: Partial<Database['public']['Tables']['stock_lotes']['Row']>;
      };
      ventas: {
        Row: {
          id: string;
          tenant_id: string;
          sucursal_id: string;
          caja_id: string;
          turno_id: string;
          offline_id: string | null;
          cliente_id: string | null;
          convenio_id: string | null;
          vendedor_id: string;
          tipo_comprobante: TipoComprobante;
          serie: string;
          numero: number;
          fecha_emision: string;
          moneda: string;
          subtotal_gravado: number;
          subtotal_exonerado: number;
          subtotal_inafecto: number;
          igv: number;
          descuento_total: number;
          redondeo: number;
          total: number;
          estado: EstadoVenta;
          requiere_receta: boolean;
          motivo_anulacion: string | null;
          anulada_por: string | null;
          anulada_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ventas']['Row']>;
        Update: Partial<Database['public']['Tables']['ventas']['Row']>;
      };
      venta_items: {
        Row: {
          id: string;
          tenant_id: string;
          venta_id: string;
          producto_id: string;
          presentacion_id: string;
          descripcion: string;
          cantidad: number;
          factor_base: number;
          cantidad_base: number;
          precio_unitario: number;
          descuento: number;
          tipo_afectacion_igv: TipoAfectacionIgv;
          valor_venta: number;
          igv: number;
          total: number;
          costo_unitario_base: number;
        };
        Insert: Partial<Database['public']['Tables']['venta_items']['Row']>;
        Update: Partial<Database['public']['Tables']['venta_items']['Row']>;
      };
      libro_controlados: {
        Row: {
          id: number;
          tenant_id: string;
          sucursal_id: string;
          producto_id: string;
          lote_id: string;
          tipo_movimiento: TipoMovimiento;
          cantidad_base: number;
          saldo_posterior: number;
          referencia_tipo: string | null;
          referencia_id: string | null;
          receta_id: string | null;
          registrado_por: string | null;
          validado_por: string | null;
          validado_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['libro_controlados']['Row']>;
        Update: Partial<Database['public']['Tables']['libro_controlados']['Row']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      registrar_venta: {
        Args: { p: Json };
        Returns: string;
      };
      recibir_compra: {
        Args: { p_compra_id: string };
        Returns: void;
      };
    };
    Enums: {
      rol_usuario: RolUsuario;
      condicion_venta: CondicionVenta;
      tipo_afectacion_igv: TipoAfectacionIgv;
      tipo_documento_identidad: TipoDocumentoIdentidad;
      tipo_comprobante: TipoComprobante;
      estado_venta: EstadoVenta;
      estado_sunat: EstadoSunat;
      metodo_pago: MetodoPago;
      estado_compra: EstadoCompra;
      estado_transferencia: EstadoTransferencia;
      estado_turno: EstadoTurno;
      tipo_movimiento: TipoMovimiento;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
