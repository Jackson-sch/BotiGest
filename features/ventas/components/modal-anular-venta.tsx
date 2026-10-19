'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, X, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings, formatMoney } from '@/lib/utils';
import type { VentaResumen } from '../types';
import { anularVentaAction } from '../actions';
import { toast } from 'sonner';

interface ModalAnularVentaProps {
  venta: VentaResumen | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ventaId: string) => void;
}

export function ModalAnularVenta({
  venta,
  isOpen,
  onClose,
  onSuccess,
}: ModalAnularVentaProps) {
  const [motivo, setMotivo] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (!venta) return null;

  const handleAnular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 6) {
      toast.error('El motivo debe tener al menos 6 caracteres descriptivos.');
      return;
    }
    if (pin.length < 4) {
      toast.error('Ingrese su PIN de autorización de Administrador o QF.');
      return;
    }

    setLoading(true);
    try {
      const res = await anularVentaAction({
        venta_id: venta.id,
        motivo,
        pin_autorizacion: pin,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al anular la venta');
      } else {
        toast.success(`Comprobante ${venta.correlativo} anulado. El stock ha sido devuelto a los lotes originales.`);
        onSuccess(venta.id);
        onClose();
        setMotivo('');
        setPin('');
      }
    } catch {
      toast.error('Error al anular la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={appleSprings.sheet}
            className="relative w-full max-w-md bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#ff3b30]/15 text-[#ff3b30] flex items-center justify-center">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                    Anulación de Venta & Devolución
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {venta.correlativo} · {formatMoney(venta.total)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-xs text-[#c92a2a] dark:text-[#ff453a] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Reversión Automática en Kardex</span>
              </div>
              <p className="text-[11px] opacity-90">
                El stock será reingresado a los mismos lotes de origen (`devolucion_cliente`) y se emitirá la Nota de Crédito respectiva ante SUNAT.
              </p>
            </div>

            <form onSubmit={handleAnular} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Motivo de Anulación (SUNAT / Auditoría)</label>
                <Input
                  placeholder="Ej. Devolución por error en presentación / Paciente canceló..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>PIN de Autorización (Admin o QF)</span>
                </label>
                <Input
                  type="password"
                  placeholder="PIN de 4 dígitos"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="font-mono text-center tracking-widest text-base"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-5 font-medium bg-[#ff3b30] hover:bg-[#e03126] text-white"
                >
                  {loading ? 'Anulando...' : 'Confirmar Anulación'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
