import type { EstadoTurno } from '@/types/database';

export interface TurnoCajaResumen {
  id: string;
  sucursal_id: string;
  sucursal_nombre: string;
  caja_id: string;
  caja_nombre: string;
  usuario_id: string;
  cajero_nombre: string;
  estado: EstadoTurno;
  apertura_at: string;
  monto_apertura: number;
  cierre_at?: string | null;
  monto_cierre_declarado?: number | null;
  monto_cierre_sistema?: number | null;
  diferencia?: number | null;
  observacion?: string | null;
}

export interface MovimientoCaja {
  id: string;
  turno_id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  usuario_nombre: string;
  created_at: string;
}

export interface ArqueoDenominacion {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

export interface ResumenEfectivoSistema {
  monto_apertura: number;
  total_ventas_efectivo: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_esperado: number;
}
