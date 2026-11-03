'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ban, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { appleSprings, formatMoney } from '@/lib/utils';
import { toast } from 'sonner';
import { anularCompraAction } from '../actions';
import type { CompraResumen } from '../types';

interface ModalAnularCompraProps {
  compra: CompraResumen | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalAnularCompra({
  compra,
  isOpen,
  onClose,
  onSuccess,
}: ModalAnularCompraProps) {
  const [motivo, setMotivo] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !compra) return null;

  const esRecibida = compra.estado === 'recibida';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!motivo.trim() || motivo.trim().length < 4) {
      toast.error('Debe ingresar un motivo de anulación válido (mínimo 4 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await anularCompraAction({
        compra_id: compra.id,
        motivo: motivo.trim(),
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo anular la compra.');
        setIsSubmitting(false);
        return;
      }

      toast.success(
        esRecibida
          ? `Factura ${compra.serie_numero} anulada. El stock ingresado fue revertido en el Kardex.`
          : `Borrador ${compra.serie_numero} anulado exitosamente.`
      );

      onSuccess?.();
      onClose();
    } catch {
      toast.error('Ocurrió un error inesperado al procesar la anulación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-lg bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  Anular Factura de Compra
                </h3>
                <p className="text-xs text-muted-foreground">
                  {compra.tipo_documento.toUpperCase()} {compra.serie_numero} · {compra.proveedor_nombre}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Resumen de la Compra */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado actual:</span>
              {esRecibida ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                  Recibida en Almacén
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                  Borrador (Por Recibir)
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monto Total:</span>
              <span className="font-mono font-bold text-foreground">{formatMoney(compra.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ítems incluidos:</span>
              <span className="font-mono text-foreground">{compra.items_count} producto(s)</span>
            </div>
          </div>

          {/* Advertencia contextual */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
            esRecibida
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {esRecibida
                  ? 'Atención: Reversión de Stock en Kardex'
                  : 'Anulación de Borrador'}
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {esRecibida
                  ? 'Esta compra ya ingresó mercadería a la botica. El sistema verificará que ninguno de los lotes tenga unidades vendidas en el POS y descontará el stock del inventario asentando la salida en el Kardex.'
                  : 'Esta compra está en estado borrador y no ha ingresado al inventario. Al anularla no se afectará el stock ni el Kardex.'}
              </p>
            </div>
          </div>

          {/* Formulario de Motivo */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo de la Anulación *
              </label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Factura rechazada por droguería / Error en precios / Comprobante duplicado"
                className="text-xs rounded-xl"
                autoFocus
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || motivo.trim().length < 4}
                className="text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>{isSubmitting ? 'Procesando...' : 'Confirmar Anulación'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
