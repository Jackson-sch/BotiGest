import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind asegurando precedencia limpia.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Configuraciones de resortes (springs) basadas en los principios de Apple Design (WWDC).
 * Damping ratio 1.0 = críticamente amortiguado (sin rebote artificial en UI estructural).
 * Damping ratio ~0.8 = rebote suave para gestos y drawers/sheets con inercia física.
 */
export const appleSprings = {
  // Para diálogos, menús y modales
  default: {
    type: "spring",
    bounce: 0,
    duration: 0.35,
  },
  // Para drawers, sheets y paneles laterales
  sheet: {
    type: "spring",
    bounce: 0.08,
    duration: 0.4,
  },
  // Para elementos interactivos rápidos (botones, chips, toggles)
  snappy: {
    type: "spring",
    bounce: 0,
    duration: 0.2,
  },
  // Para transiciones de vista completas
  smooth: {
    type: "spring",
    bounce: 0,
    duration: 0.45,
  },
} as const;

/**
 * Formatea montos en moneda Soles (PEN) según estándar contable y comercial peruano.
 */
export function formatMoney(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
