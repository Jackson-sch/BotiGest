'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import type { LoteConStock } from '../types';
import { ajustarStockAction } from '../actions';
import { toast } from 'sonner';

interface ModalAjusteStockProps {
  lote: LoteConStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAjusteStock({
  lote,
  isOpen,
  onClose,
  onSuccess,
}: ModalAjusteStockProps) {
  const [tipo, setTipo] = React.useState<'ajuste_positivo' | 'ajuste_negativo' | 'merma' | 'vencimiento'>('ajuste_positivo');
  const [cantidad, setCantidad] = React.useState<string>('1');
  const [motivo, setMotivo] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  if (!lote) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      toast.error('La cantidad debe ser un número entero mayor a 0');
      return;
    }
    if (motivo.trim().length < 5) {
      toast.error('El motivo debe tener al menos 5 caracteres descriptivos');
      return;
    }

    setLoading(true);
    try {
      // Llamada al Server Action modular
      const res = await ajustarStockAction({
        sucursal_id: '00000000-0000-0000-0000-000000000001', // Sede principal
        lote_id: lote.id,
        producto_id: lote.producto_id,
        tipo,
        cantidad_base: cantNum,
        motivo,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al procesar el ajuste');
      } else {
        toast.success('Ajuste de inventario registrado con éxito');
        onSuccess();
        onClose();
      }
    } catch {
      toast.error('Error al procesar el ajuste de inventario');
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
                <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                    Ajuste / Merma de Inventario
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Lote: <strong className="text-foreground">{lote.numero_lote}</strong>
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

            {/* Datos del Lote */}
            <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border text-xs space-y-1">
              <p className="font-medium text-foreground">{lote.nombre_comercial}</p>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Stock actual: <strong className="text-foreground">{lote.cantidad_base}</strong> {lote.unidad_base.toLowerCase()}s</span>
                <span>Vence: {lote.fecha_vencimiento}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Tipo de Ajuste */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
                  {[
                    { id: 'ajuste_positivo', label: 'Sobrante (+)' },
                    { id: 'ajuste_negativo', label: 'Faltante (-)' },
                    { id: 'merma', label: 'Merma / Rotura' },
                    { id: 'vencimiento', label: 'Baja Vencido' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all apple-press-feedback ${
                        tipo === t.id
                          ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Cantidad (en {lote.unidad_base.toLowerCase()}s)</label>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Motivo / Justificación (Auditoría)</label>
                <Input
                  placeholder="Ej. Conteo físico trimestral / Blíster dañado en estante..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl px-5 font-medium">
                  {loading ? 'Guardando...' : 'Aplicar al Kardex'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
