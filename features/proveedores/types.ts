export interface ProveedorItem {
  id: string;
  ruc: string;
  razon_social: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  total_compras: number;
  total_monto_compras: number;
  created_at: string;
}

export interface ProveedorFormData {
  id?: string;
  ruc: string;
  razon_social: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}
