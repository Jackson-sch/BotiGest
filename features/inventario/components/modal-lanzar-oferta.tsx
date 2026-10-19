'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Tag, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings, formatMoney } from '@/lib/utils';
import { toast } from 'sonner';
import { lanzarOfertaLoteAction } from '../actions';
import type { AlertaVencimientoItem } from '../types';

interface ModalLanzarOfertaProps {
  alerta: AlertaVencimientoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DESCUENTOS_RAPIDOS = [15, 25, 35, 50];

export function ModalLanzarOferta({
  alerta,
  isOpen,
  onClose,
  onSuccess,
}: ModalLanzarOfertaProps) {
  const [descuento, setDescuento] = React.useState<number>(25);
  const [motivo, setMotivo] = React.useState<string>('Liquidación FEFO por proximidad de vencimiento');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && alerta) {
      // Si vence en menos de 20 días, sugerir 40% de descuento automáticamente
      if (alerta.dias_para_vencer <= 20) {
        setDescuento(40);
      } else if (alerta.dias_para_vencer <= 45) {
        setDescuento(25);
      } else {
        setDescuento(15);
      }
    }
  }, [isOpen, alerta]);

  if (!isOpen || !alerta) return null;

  const precioBase = alerta.precio_venta || 10.0;
  const precioOferta = Number((precioBase * (1 - descuento / 100)).toFixed(2));
  const ahorro = Number((precioBase - precioOferta).toFixed(2));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (descuento <= 0 || descuento > 90) {
      toast.error('El porcentaje de descuento debe estar entre 1% y 90%.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await lanzarOfertaLoteAction({
        lote_id: alerta.lote_id,
        producto_id: alerta.producto_id,
        descuento_porcentaje: descuento,
        precio_promocion: precioOferta,
        motivo,
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo aplicar la oferta.');
        return;
      }

      toast.success(
        `🎉 ¡Oferta del ${descuento}% aplicada! Nuevo precio POS: ${formatMoney(precioOferta)}`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Error inesperado al registrar la oferta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop translúcido */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-lg bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#ff9f0a]/15 text-[#ff9f0a] flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                  Lanzar Oferta de Liquidación FEFO
                </h3>
                <p className="text-xs text-muted-foreground">
                  Acelerar rotación en mostrador antes del vencimiento
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tarjeta de Medicamento en Riesgo */}
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {alerta.nombre_comercial}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Laboratorio: {alerta.laboratorio || 'Nacional'}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    alerta.nivel === 'urgente'
                      ? 'bg-red-500/15 text-red-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  Vence en {alerta.dias_para_vencer} días
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Lote</span>
                  <span className="font-mono font-bold text-foreground">
                    {alerta.numero_lote}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Fecha Vcto.</span>
                  <span className="font-mono font-medium text-foreground">
                    {alerta.fecha_vencimiento}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Stock en Riesgo</span>
                  <span className="font-mono font-bold text-[#ff9f0a]">
                    {alerta.cantidad_base} {alerta.unidad_base.toLowerCase()}s
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Descuento Promocional */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Porcentaje de Descuento a Aplicar</span>
                <span className="text-[#ff9f0a] font-mono font-bold text-sm">
                  -{descuento}%
                </span>
              </label>

              {/* Chips rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {DESCUENTOS_RAPIDOS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDescuento(pct)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 apple-press-feedback ${
                      descuento === pct
                        ? 'border-[#ff9f0a] bg-[#ff9f0a]/15 text-[#ff9f0a] shadow-xs'
                        : 'border-border bg-black/[0.02] dark:bg-white/[0.03] text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>

              {/* Slider o Input libre */}
              <div className="pt-1">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                  placeholder="Porcentaje personalizado"
                  className="h-10 text-center font-mono font-bold"
                />
              </div>
            </div>

            {/* Comparativa Visual de Precios */}
            <div className="p-4 rounded-2xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block">Precio Regular POS</span>
                <span className="text-sm font-mono text-muted-foreground line-through">
                  {formatMoney(precioBase)}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#ff9f0a]" />
              <div className="text-right">
                <span className="text-[11px] text-[#ff9f0a] font-semibold block">
                  Nuevo Precio de Oferta
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {formatMoney(precioOferta)}
                </span>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo / Glosa de Promoción
              </label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Promoción especial por vencimiento en 30 días"
                className="h-9 text-xs"
              />
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || descuento <= 0}
                className="rounded-xl gap-2 bg-[#ff9f0a] hover:bg-[#e08905] text-black font-semibold apple-press-feedback"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSubmitting ? 'Aplicando...' : 'Activar Oferta en POS'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
