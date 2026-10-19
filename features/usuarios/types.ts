import type { UserRole } from '@/lib/permissions';

export interface PerfilUsuarioItem {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cqfp: string | null;
  rol: UserRole;
  activo: boolean;
  sucursal_id?: string | null;
  sucursal_nombre?: string | null;
  created_at: string;
}

export interface SerieItem {
  id: string;
  tipo: string;
  serie: string;
  ultimo_numero: number;
}

export interface CajaItem {
  id: string;
  nombre: string;
  activo: boolean;
  series: SerieItem[];
}

export interface SucursalItem {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  codigo_establecimiento_sunat: string;
  autorizacion_digemid: string | null;
  activo: boolean;
  cajas: CajaItem[];
}
