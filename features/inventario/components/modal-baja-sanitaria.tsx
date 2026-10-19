'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, AlertOctagon, FileWarning, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';
import { darDeBajaLoteAction } from '../actions';
import type { AlertaVencimientoItem } from '../types';

interface ModalBajaSanitariaProps {
  alerta: AlertaVencimientoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIPOS_BAJA = [
  { id: 'vencimiento', label: 'Caducidad / Vencimiento Cumplido', desc: 'No canjeable por proveedor' },
  { id: 'rotura', label: 'Rotura Física de Envase / Frasco', desc: 'Frasco quebrado o blíster roto' },
  { id: 'deterioro', label: 'Deterioro Físicoquímico', desc: 'Cambio de coloración o precipitado' },
  { id: 'observacion_sanitaria', label: 'Retiro Preventivo / Alerta DIGEMID', desc: 'Disposición de la autoridad sanitaria' },
] as const;

export function ModalBajaSanitaria({
  alerta,
  isOpen,
  onClose,
  onSuccess,
}: ModalBajaSanitariaProps) {
  const [cantidad, setCantidad] = React.useState<number>(0);
  const [tipoBaja, setTipoBaja] = React.useState<'vencimiento' | 'merma' | 'deterioro' | 'rotura' | 'observacion_sanitaria'>('vencimiento');
  const [actaNumero, setActaNumero] = React.useState<string>('');
  const [motivo, setMotivo] = React.useState<string>('Baja definitiva por fecha de vencimiento expirada sin canje comercial.');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && alerta) {
      setCantidad(alerta.cantidad_base);
      setActaNumero(`ACTA-DEST-${alerta.numero_lote}-${new Date().getFullYear()}`);
      if (alerta.dias_para_vencer < 0) {
        setTipoBaja('vencimiento');
        setMotivo(`Baja sanitaria por vencimiento de producto con ${Math.abs(alerta.dias_para_vencer)} días de caducidad.`);
      }
    }
  }, [isOpen, alerta]);

  if (!isOpen || !alerta) return null;

  const handleBajaTotal = () => {
    setCantidad(alerta.cantidad_base);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cantidad <= 0) {
      toast.error('La cantidad a dar de baja debe ser mayor a 0');
      return;
    }
    if (cantidad > alerta.cantidad_base) {
      toast.error(`La cantidad no puede superar el stock del lote (${alerta.cantidad_base})`);
      return;
    }
    if (!motivo.trim() || motivo.trim().length < 5) {
      toast.error('Debe ingresar una justificación técnica válida (mínimo 5 caracteres)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await darDeBajaLoteAction({
        lote_id: alerta.lote_id,
        cantidad,
        tipo_baja: tipoBaja,
        motivo,
        acta_numero: actaNumero.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo procesar la baja sanitaria.');
        return;
      }

      toast.success(
        `Baja sanitaria de ${cantidad} ${alerta.unidad_base || 'unidades'} procesada con éxito.`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop glass */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-lg bg-white dark:bg-[#161618] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/50 bg-rose-500/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  Baja y Destrucción Sanitaria
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    DIGEMID BPA
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Retiro definitivo del stock y registro oficial en Kardex
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Lote Summary Box */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-rose-400 uppercase">
                    Producto a dar de baja
                  </span>
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    {alerta.nombre_comercial}
                  </p>
                  {alerta.laboratorio && (
                    <p className="text-muted-foreground text-[11px] italic">
                      Titular: {alerta.laboratorio}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Lote N°</span>
                  <span className="font-mono font-bold text-foreground text-xs">
                    {alerta.numero_lote}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Stock actual del lote:</span>{' '}
                  <span className="font-semibold text-foreground">
                    {alerta.cantidad_base} {alerta.unidad_base || 'unidades'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencimiento:</span>{' '}
                  <span className={`font-semibold ${alerta.dias_para_vencer < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {new Date(alerta.fecha_vencimiento).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Tipo de Baja */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FileWarning className="h-3.5 w-3.5 text-rose-400" />
                Causal de Baja Sanitaria:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_BAJA.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setTipoBaja(tipo.id as any)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      tipoBaja === tipo.id
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 ring-1 ring-rose-500/30'
                        : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span className="font-semibold block text-[11px] leading-snug">{tipo.label}</span>
                    <span className="text-[10px] text-muted-foreground/80 block mt-0.5">{tipo.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad a Dar de Baja */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Cantidad a dar de baja ({alerta.unidad_base || 'unidades'}):
                </label>
                <button
                  type="button"
                  onClick={handleBajaTotal}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2"
                >
                  Baja total ({alerta.cantidad_base})
                </button>
              </div>
              <Input
                type="number"
                min={1}
                max={alerta.cantidad_base}
                value={cantidad || ''}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="bg-background/80 border-border/60 focus:border-rose-500 font-mono text-base font-semibold"
                placeholder="0"
                required
              />
            </div>

            {/* Número de Acta / Informe de Destrucción */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                N° de Acta de Destrucción / Informe Q.F. (Opcional):
              </label>
              <Input
                type="text"
                value={actaNumero}
                onChange={(e) => setActaNumero(e.target.value)}
                placeholder="Ej. ACTA-DEST-2026-004"
                className="bg-background/80 border-border/60 text-xs font-mono"
              />
            </div>

            {/* Justificación Técnica */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Justificación Técnica (Auditoría DIGEMID):
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border/60 bg-background/80 p-2.5 text-xs text-foreground focus:outline-none focus:border-rose-500 transition-colors resize-none"
                placeholder="Detalle el motivo técnico de la destrucción..."
                required
              />
            </div>

            {/* Advertencia DIGEMID */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300">
              <AlertOctagon className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Esta acción es <strong>irreversible</strong> y descargará el stock físico del Kardex
                mediante asiento tipo <em>merma/vencimiento</em> según las Buenas Prácticas de Almacenamiento.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || cantidad <= 0}
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? (
                  'Procesando...'
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Confirmar Baja Sanitaria
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
