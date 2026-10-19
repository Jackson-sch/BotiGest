import type { TipoMovimiento, CondicionVenta } from '@/types/database';

export interface RegistroLibroControlado {
  id: number;
  fecha: string;
  producto_id: string;
  producto_nombre: string;
  concentracion: string;
  condicion: 'psicotropico' | 'estupefaciente';
  numero_lote: string;
  fecha_vencimiento: string;
  tipo_movimiento: TipoMovimiento;
  cantidad_base: number; // con signo
  saldo_posterior: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  // Receta asociada (DIGEMID)
  receta?: {
    medico_cmp: string;
    medico_nombre: string;
    paciente_nombre: string;
    numero_receta: string;
    retenida: boolean;
  } | null;
  registrado_por: string;
  // Firma y validación obligatoria del Director Técnico (QF)
  validado_por?: string | null;
  validado_at?: string | null;
  cqfp_validador?: string | null;
}

export interface BalanceSustanciaControlada {
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  concentracion: string;
  condicion: 'psicotropico' | 'estupefaciente';
  saldo_actual_base: number;
  unidad_base: string;
  asientos_pendientes_firma: number;
  ultimo_movimiento: string;
}
