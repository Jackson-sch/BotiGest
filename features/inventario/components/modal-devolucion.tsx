'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, X, Building2, Truck, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';

import { devolverLoteAction } from '../actions';
import type { AlertaVencimientoItem } from '../types';

interface ModalDevolucionProps {
  alerta: AlertaVencimientoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DROGUERIAS_HABITUALES = [
  'Droguería Albis S.A.C.',
  'Quicorp / Química Suiza S.A.C.',
  'Medifarma S.A.',
  'Laboratorios Portugal S.R.L.',
  'Laboratorios Bagó del Perú',
  'Genfar Perú S.A.',
];

const MOTIVOS_DEVOLUCION = [
  'Canje por vencimiento próximo (<60 días) según convenio',
  'Devolución por rotación baja y riesgo inminente de caducidad',
  'Lote observado o retiro preventivo del fabricante',
  'Sobrante de pedido con fecha corta de vencimiento',
];

export function ModalDevolucion({
  alerta,
  isOpen,
  onClose,
  onSuccess,
}: ModalDevolucionProps) {
  const [cantidad, setCantidad] = React.useState<number>(0);
  const [proveedor, setProveedor] = React.useState<string>('Droguería Albis S.A.C.');
  const [guiaRemision, setGuiaRemision] = React.useState<string>('');
  const [motivo, setMotivo] = React.useState<string>(MOTIVOS_DEVOLUCION[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && alerta) {
      setCantidad(alerta.cantidad_base);
      setGuiaRemision(`DEV-${alerta.numero_lote}-${new Date().getFullYear().toString().slice(-2)}`);
      if (alerta.laboratorio && alerta.laboratorio !== 'Laboratorio Farmacéutico') {
        const found = DROGUERIAS_HABITUALES.find((d) =>
          d.toLowerCase().includes(alerta.laboratorio!.toLowerCase())
        );
        if (found) setProveedor(found);
        else setProveedor(`${alerta.laboratorio} (Droguería Titular)`);
      }
    }
  }, [isOpen, alerta]);

  if (!isOpen || !alerta) return null;

  const handleDevolverTodo = () => {
    setCantidad(alerta.cantidad_base);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cantidad <= 0) {
      toast.error('La cantidad a devolver debe ser mayor a cero.');
      return;
    }
    if (cantidad > alerta.cantidad_base) {
      toast.error(`Stock insuficiente. El lote solo dispone de ${alerta.cantidad_base} unidades.`);
      return;
    }
    if (!proveedor.trim()) {
      toast.error('Debe indicar la droguería o distribuidor destinatario.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await devolverLoteAction({
        lote_id: alerta.lote_id,
        sucursal_id: alerta.sucursal_id,
        cantidad,
        proveedor_nombre: proveedor.trim(),
        guia_remision: guiaRemision.trim() || undefined,
        motivo,
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo procesar la devolución.');
        return;
      }

      toast.success(
        `✅ Devolución de ${cantidad} ${alerta.unidad_base.toLowerCase()}s registrada exitosamente en Kardex.`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Error inesperado al registrar la devolución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
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
              <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/15 text-[#0071e3] flex items-center justify-center font-bold">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                  Devolución / Canje a Droguería
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registro oficial en Kardex conforme a regulación DIGEMID
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
            {/* Detalle del Lote */}
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {alerta.nombre_comercial}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Lote: <span className="font-bold text-foreground">{alerta.numero_lote}</span> · Vence: {alerta.fecha_vencimiento}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">
                  {alerta.dias_para_vencer} días restantes
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">Stock actual en anaquel:</span>
                <span className="font-mono font-bold text-foreground">
                  {alerta.cantidad_base} {alerta.unidad_base.toLowerCase()}s
                </span>
              </div>
            </div>

            {/* Droguería / Distribuidor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Droguería o Proveedor Destinatario</span>
              </label>
              <div className="space-y-1.5">
                <Select
                  value={DROGUERIAS_HABITUALES.includes(proveedor) ? proveedor : 'Otro'}
                  onValueChange={(val) => setProveedor(val)}
                >
                  <SelectTrigger className="w-full h-10 text-xs">
                    <SelectValue placeholder="Seleccionar droguería o proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DROGUERIAS_HABITUALES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                    <SelectItem value="Otro">Otro proveedor / droguería</SelectItem>
                  </SelectContent>
                </Select>
                {proveedor === 'Otro' && (
                  <Input
                    placeholder="Escriba el nombre de la droguería..."
                    onChange={(e) => setProveedor(e.target.value)}
                    className="h-9 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Cantidad a Devolver */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Cantidad a Devolver ({alerta.unidad_base.toLowerCase()}s)
                </label>
                <button
                  type="button"
                  onClick={handleDevolverTodo}
                  className="text-xs text-[#0071e3] hover:underline font-medium"
                >
                  Devolver todo el lote ({alerta.cantidad_base})
                </button>
              </div>
              <Input
                type="number"
                min={1}
                max={alerta.cantidad_base}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value) || 0)}
                className="h-10 font-mono font-bold text-base"
              />
            </div>

            {/* Motivo de Devolución */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo Farmacéutico
              </label>
              <Select value={motivo} onValueChange={(val) => setMotivo(val)}>
                <SelectTrigger className="w-full h-10 text-xs">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_DEVOLUCION.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* N° de Guía de Remisión o Acta */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>N° Guía de Remisión / Acta de Devolución</span>
              </label>
              <Input
                value={guiaRemision}
                onChange={(e) => setGuiaRemision(e.target.value)}
                placeholder="Ej. GR-001-000421"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Botones */}
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
                disabled={isSubmitting || cantidad <= 0 || cantidad > alerta.cantidad_base}
                className="rounded-xl gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold apple-press-feedback"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
