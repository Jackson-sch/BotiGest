'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  X,
  Play,
  Trash2,
  ShoppingCart,
  User,
  Receipt,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { appleSprings, formatMoney } from '@/lib/utils';
import { usePosStore } from '../store';
import { toast } from 'sonner';

export function PosHeldCartsModal() {
  const {
    heldCarts,
    isHeldCartsModalOpen,
    setHeldCartsModalOpen,
    restoreHeldCart,
    removeHeldCart,
    items,
  } = usePosStore();

  if (!isHeldCartsModalOpen) return null;

  const handleRestore = (id: string, ticketNum: string) => {
    if (items.length > 0) {
      toast.warning('Tienes una venta en curso en el carrito.', {
        description: `Al recuperar el ticket ${ticketNum} se reemplazará el carrito actual.`,
        action: {
          label: 'Reemplazar y Recuperar',
          onClick: () => {
            restoreHeldCart(id);
            toast.success(`Ticket ${ticketNum} recuperado en caja`);
          },
        },
        duration: 8000,
      });
      return;
    }
    restoreHeldCart(id);
    toast.success(`Ticket ${ticketNum} recuperado en caja`);
  };

  const handleRemove = (id: string, ticketNum: string) => {
    removeHeldCart(id);
    toast.info(`Ticket ${ticketNum} descartado`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con Blur progresivo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-md"
          onClick={() => setHeldCartsModalOpen(false)}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#ff9f0a]/15 text-[#ff9f0a] flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-apple-title text-foreground">
                    Ventas en Espera (Multiticket)
                  </h2>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {heldCarts.length} {heldCarts.length === 1 ? 'ticket' : 'tickets'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recupera atenciones pausadas para no detener la cola de clientes en mostrador.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHeldCartsModalOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de Tickets en Espera */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {heldCarts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground flex items-center justify-center mx-auto">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No hay ventas en espera actualmente
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    Usa el botón <strong>&quot;Poner en Espera [F6]&quot;</strong> en el carrito para pausar una atención y atender al siguiente cliente.
                  </p>
                </div>
              </div>
            ) : (
              heldCarts.map((held) => (
                <Card
                  key={held.id}
                  className="p-4 rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.03] hover:border-[#ff9f0a]/50 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-[#ff9f0a]/15 text-[#b25e00] dark:text-[#ffd60a]">
                        {held.id}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {held.createdAt}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Total: </span>
                      <span className="font-mono font-bold text-sm text-[#0071e3] dark:text-[#2997ff]">
                        {formatMoney(held.total)}
                      </span>
                    </div>
                  </div>

                  {/* Resumen del Cliente y Comprobante */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {held.cliente?.nombres
                          ? `${held.cliente.numero_documento} · ${held.cliente.nombres}`
                          : 'Clientes Varios'}
                      </span>
                    </div>
                    <span className="uppercase text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                      {held.tipo_comprobante}
                    </span>
                  </div>

                  {/* Items resumidos */}
                  <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-xs space-y-1">
                    {held.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-muted-foreground">
                        <span className="truncate max-w-[280px]">
                          <strong className="text-foreground">{it.cantidad}x</strong> {it.nombre_comercial} ({it.presentacion_nombre})
                        </span>
                        <span className="font-mono text-foreground text-[11px]">
                          {formatMoney(it.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(held.id, held.id)}
                      className="rounded-xl text-xs text-muted-foreground hover:text-destructive gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Descartar</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(held.id, held.id)}
                      className="rounded-xl text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white gap-1.5 font-medium apple-press-feedback"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Recuperar a Caja</span>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-sidebar/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">Atajo rápido: [F6]</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHeldCartsModalOpen(false)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
