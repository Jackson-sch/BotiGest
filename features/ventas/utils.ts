import type { VentaResumen } from './types';

/**
 * Obtiene la fecha en formato ISO YYYY-MM-DD para una venta.
 */
export function getVentaDateISO(v: VentaResumen): string {
  if (v.fecha_emision_date) return v.fecha_emision_date;
  if (!v.fecha_emision) return '';
  const datePart = v.fecha_emision.split(' ')[0];
  const parts = datePart.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Obtiene la fecha de hoy en hora peruana (America/Lima) en formato YYYY-MM-DD.
 */
export function getTodayPeruISO(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Obtiene la fecha de ayer en hora peruana en formato YYYY-MM-DD.
 */
export function getYesterdayPeruISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/**
 * Obtiene la fecha de hace N días en hora peruana en formato YYYY-MM-DD.
 */
export function getDaysAgoPeruISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/**
 * Obtiene el primer día del mes actual en formato YYYY-MM-DD.
 */
export function getMonthStartPeruISO(): string {
  const today = getTodayPeruISO();
  return today.substring(0, 7) + '-01';
}
