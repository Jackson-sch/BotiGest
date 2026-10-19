'use client';

import * as React from 'react';
import {
  Keyboard,
  X,
  ShoppingCart,
  ReceiptText,
  Boxes,
  Pill,
  Search,
  CreditCard,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-slate-50 dark:bg-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Atajos de Teclado del Sistema</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold">
                  F1
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Optimiza la velocidad en caja y navega por el sistema sin tocar el ratón.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[75vh]">
          {/* Sección 1: Navegación Global */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Navegación Global (Desde cualquier pantalla)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Punto de Venta</span>
                    <span className="text-[10px] text-muted-foreground">Acceso instantáneo a ventas</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-primary shadow-xs">
                  F4
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Caja & Turnos</span>
                    <span className="text-[10px] text-muted-foreground">Arqueos y apertura/cierre</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-foreground shadow-xs">
                  F8
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Catálogo Medicamentos</span>
                    <span className="text-[10px] text-muted-foreground">Precios y presentaciones</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-foreground shadow-xs">
                  F9
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Inventario & Lotes FEFO</span>
                    <span className="text-[10px] text-muted-foreground">Stock y vencimientos</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-foreground shadow-xs">
                  F7
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Búsqueda Rápida</span>
                    <span className="text-[10px] text-muted-foreground">Enfocar barra superior</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-foreground shadow-xs">
                  Ctrl + K
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
                    <Keyboard className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Ayuda de Atajos</span>
                    <span className="text-[10px] text-muted-foreground">Abrir este panel</span>
                  </div>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-foreground shadow-xs">
                  F1
                </kbd>
              </div>
            </div>
          </div>

          {/* Sección 2: Punto de Venta (POS) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-3.5 w-3.5 text-blue-400" />
              <span>Operaciones en el Punto de Venta (/pos)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Buscar / Lector Barras</span>
                  <span className="text-[10px] text-muted-foreground">Enfoca el input de escaneo</span>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-primary shadow-xs">
                  F2
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Cobrar / Finalizar Venta</span>
                  <span className="text-[10px] text-muted-foreground">Abre modal de pago y boleta</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-emerald-500 shadow-xs">
                    F4
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">o</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 text-[10px] font-mono font-bold text-foreground shadow-xs">
                    Ctrl+Enter
                  </kbd>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Pausar / Ventas en Espera</span>
                  <span className="text-[10px] text-muted-foreground">Multiticket sin perder carrito</span>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-amber-500 shadow-xs">
                  F6
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Cancelar / Limpiar Carrito</span>
                  <span className="text-[10px] text-muted-foreground">Vaciar pedido actual</span>
                </div>
                <kbd className="px-2 py-1 rounded bg-background border border-border/80 text-xs font-mono font-bold text-rose-500 shadow-xs">
                  Alt + C
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-slate-50 dark:bg-[#1a1a1d] flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> para cerrar
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
