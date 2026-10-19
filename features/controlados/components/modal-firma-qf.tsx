'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import type { RegistroLibroControlado } from '../types';
import { validarAsientoQfAction } from '../actions';
import { toast } from 'sonner';

interface ModalFirmaQfProps {
  asiento: RegistroLibroControlado | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asientoId: number) => void;
}

export function ModalFirmaQf({
  asiento,
  isOpen,
  onClose,
  onSuccess,
}: ModalFirmaQfProps) {
  const [pin, setPin] = React.useState('');
  const [observacion, setObservacion] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (!asiento) return null;

  const handleFirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('El PIN debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await validarAsientoQfAction({
        asiento_id: asiento.id,
        pin_director_tecnico: pin,
        observacion,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al asentar la validación');
      } else {
        toast.success(`Asiento N° ${asiento.id} validado correctamente con firma de Director Técnico.`);
        onSuccess(asiento.id);
        onClose();
        setPin('');
      }
    } catch {
      toast.error('Error al asentar la validación del Director Técnico.');
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
                <div className="h-9 w-9 rounded-xl bg-[#af52de]/15 text-[#af52de] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                    Firma de Validación · QF Director Técnico
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Reglamento de Estupefacientes y Psicotrópicos
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

            {/* Resumen del Asiento a Firmar */}
            <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-foreground">
                <span>{asiento.producto_nombre}</span>
                <span className="font-mono text-[#af52de]">
                  {asiento.cantidad_base > 0 ? '+' : ''}{asiento.cantidad_base}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Lote: {asiento.numero_lote}</span>
                <span>Saldo posterior: {asiento.saldo_posterior}</span>
              </div>
              {asiento.receta && (
                <div className="pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                  Paciente: <strong className="text-foreground">{asiento.receta.paciente_nombre}</strong> · CMP: {asiento.receta.medico_cmp}
                </div>
              )}
            </div>

            <form onSubmit={handleFirmar} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>PIN de Autorización del QF</span>
                </label>
                <Input
                  type="password"
                  placeholder="Ingrese su PIN de 4 dígitos"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="font-mono text-center tracking-widest text-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Observación de Visado (Opcional)</label>
                <Input
                  placeholder="Ej. Receta retenida archivada en legajo 2026..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-5 font-medium bg-[#af52de] hover:bg-[#9d3cd0] text-white"
                >
                  {loading ? 'Firmando...' : 'Asentar Firma Colegiada'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
