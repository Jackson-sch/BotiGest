'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registrarMovimientoEfectivoAction } from '../actions';
import { toast } from 'sonner';

interface MovimientoEfectivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: string;
  onSuccess: () => void;
}

export function MovimientoEfectivoModal({
  isOpen,
  onClose,
  turnoId,
  onSuccess,
}: MovimientoEfectivoModalProps) {
  const [tipo, setTipo] = React.useState<'ingreso' | 'egreso'>('egreso');
  const [concepto, setConcepto] = React.useState<string>('');
  const [monto, setMonto] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      toast.error('Ingrese un monto válido mayor a 0');
      return;
    }

    if (!concepto.trim()) {
      toast.error('Ingrese el motivo o concepto del movimiento');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registrarMovimientoEfectivoAction({
        turno_id: turnoId,
        tipo,
        concepto: concepto.trim(),
        monto: parsedMonto,
      });

      if (res.success) {
        toast.success(
          tipo === 'ingreso'
            ? 'Ingreso de efectivo registrado'
            : 'Egreso de efectivo registrado'
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || 'Error al registrar movimiento');
      }
    } catch {
      toast.error('Error al procesar movimiento de efectivo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold tracking-apple-title text-foreground">
                Movimiento de Efectivo
              </h3>
              <p className="text-xs text-muted-foreground">
                Ingreso de sencillo o egreso para gastos menores / remesas
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Toggle Tipo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => setTipo('egreso')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tipo === 'egreso'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                <span>Egreso / Retiro</span>
              </button>
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tipo === 'ingreso'
                    ? 'bg-[#34c759] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Ingreso / Sencillo</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Monto (S/)
              </label>
              <input
                type="number"
                step="0.10"
                min="0.10"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border border-border bg-background text-base font-bold font-mono focus:outline-none focus:ring-2 ${
                  tipo === 'egreso'
                    ? 'text-red-500 focus:ring-red-500'
                    : 'text-[#34c759] focus:ring-[#34c759]'
                }`}
                placeholder="25.00"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Concepto / Justificación
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder={
                  tipo === 'egreso'
                    ? 'Ej. Compra de rollos térmicos o remesa a caja fuerte'
                    : 'Ej. Sencillo adicional de billetes pequeños'
                }
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className={`rounded-xl text-xs font-semibold text-white apple-press-feedback ${
                  tipo === 'egreso'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#34c759] hover:bg-[#28a745]'
                }`}
              >
                {isLoading ? 'Registrando...' : 'Confirmar Movimiento'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
