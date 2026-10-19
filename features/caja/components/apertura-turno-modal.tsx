'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, DollarSign, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { abrirTurnoAction } from '../actions';
import { toast } from 'sonner';


interface AperturaTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cajas: Array<{ id: string; nombre: string }>;
  onSuccess: () => void;
}

export function AperturaTurnoModal({
  isOpen,
  onClose,
  cajas,
  onSuccess,
}: AperturaTurnoModalProps) {
  const [cajaId, setCajaId] = React.useState<string>(cajas[0]?.id || '');
  const [montoApertura, setMontoApertura] = React.useState<string>('150.00');
  const [observacion, setObservacion] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (cajas.length > 0 && !cajaId) {
      setCajaId(cajas[0].id);
    }
  }, [cajas, cajaId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingrese un monto de apertura válido');
      return;
    }

    setIsLoading(true);
    try {
      const res = await abrirTurnoAction({
        caja_id: cajaId,
        monto_apertura: monto,
        observacion: observacion || undefined,
      });

      if (res.success) {
        toast.success('Turno de caja aperturado correctamente');
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || 'Error al abrir turno');
      }
    } catch {
      toast.error('Error inesperado al aperturar turno');
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
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-apple-title text-foreground">
                  Apertura de Turno
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ingreso de saldo inicial en gaveta
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                Caja Registradora
              </label>
              <Select value={cajaId} onValueChange={setCajaId}>
                <SelectTrigger className="w-full h-10 text-xs">
                  <SelectValue placeholder="Seleccionar caja..." />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Monto Inicial de Apertura (S/)
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-base font-bold font-mono text-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                placeholder="150.00"
                required
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Sencillo en monedas y billetes para cambio en atención.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Observación / Nota (Opcional)
              </label>
              <textarea
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej. Recibido de tesorería en sobre sellado"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
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
                className="rounded-xl text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback"
              >
                {isLoading ? 'Aperturando...' : 'Confirmar Apertura'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
