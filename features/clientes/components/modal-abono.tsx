'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { appleSprings, formatMoney } from '@/lib/utils';
import { registrarAbonoClienteAction } from '../actions';
import { toast } from 'sonner';
import type { Cliente } from '../types';

interface ModalAbonoProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (nuevoSaldo: number) => void;
}

export function ModalAbono({ cliente, open, onOpenChange, onSuccess }: ModalAbonoProps) {
  const [monto, setMonto] = React.useState<string>('');
  const [metodoPago, setMetodoPago] = React.useState<'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta'>('efectivo');
  const [referencia, setReferencia] = React.useState<string>('');
  const [observaciones, setObservaciones] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (cliente) {
      setMonto('');
      setReferencia('');
      setObservaciones('');
    }
  }, [cliente, open]);

  if (!open || !cliente) return null;

  const saldoActual = Number(cliente.saldo_deudor) || 0;
  const montoNum = parseFloat(monto) || 0;
  const saldoRestante = Math.max(0, saldoActual - montoNum);
  const esExcesivo = montoNum > saldoActual;

  const handlePagarTotal = () => {
    setMonto(saldoActual.toFixed(2));
  };

  const handlePagarMitad = () => {
    setMonto((saldoActual / 2).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (montoNum <= 0) {
      toast.error('El monto a abonar debe ser mayor a S/ 0.00');
      return;
    }

    if (montoNum > saldoActual) {
      toast.error('El monto a abonar supera la deuda pendiente.');
      return;
    }

    setLoading(true);
    try {
      const res = await registrarAbonoClienteAction({
        cliente_id: cliente.id,
        monto: montoNum,
        metodo_pago: metodoPago,
        comprobante_referencia: referencia.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(res.message);
        onSuccess?.(res.data.nuevoSaldo);
        onOpenChange(false);
      } else {
        toast.error(res.message || 'Error al procesar el abono.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error inesperado al registrar el abono.');
    } finally {
      setLoading(false);
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-md flex flex-col rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-apple-title text-foreground">
                  Registrar Abono a Cuenta Corriente
                </h3>
                <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                  {cliente.nombres} · {cliente.tipo_documento.toUpperCase()}: {cliente.numero_documento}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Resumen de Deuda Actual */}
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Deuda Pendiente de Pago
                </span>
                <span className="font-mono text-2xl font-extrabold text-foreground tracking-tight">
                  {formatMoney(saldoActual)}
                </span>
              </div>
              <Badge variant={saldoActual > 0 ? 'secondary' : 'default'} className="text-xs">
                {saldoActual > 0 ? 'Con Saldo Deudor' : 'Al Día'}
              </Badge>
            </div>

            {/* Input de Monto */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="monto-abono" className="text-xs font-semibold text-foreground">
                  Monto a Abonar (S/.) *
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handlePagarMitad}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    50% ({formatMoney(saldoActual / 2)})
                  </button>
                  <button
                    type="button"
                    onClick={handlePagarTotal}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Total ({formatMoney(saldoActual)})
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-sm">
                  S/.
                </span>
                <Input
                  id="monto-abono"
                  type="number"
                  step="0.10"
                  min="0.10"
                  max={saldoActual}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  required
                  className="pl-10 text-base font-mono font-bold rounded-xl h-11"
                />
              </div>

              {esExcesivo && (
                <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  El monto excede la deuda actual de {formatMoney(saldoActual)}.
                </p>
              )}
            </div>

            {/* Medio de Pago */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Medio de Cobro en Botica *
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodoPago(m)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium capitalize border transition-all ${
                      metodoPago === m
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* N° Operación / Referencia */}
            <div className="space-y-1.5">
              <label htmlFor="ref-abono" className="text-xs font-medium text-foreground">
                Comprobante / N° de Operación (Opcional)
              </label>
              <Input
                id="ref-abono"
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. BCP 891234, Recibo 004..."
                className="rounded-xl h-9 text-xs"
              />
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <label htmlFor="obs-abono" className="text-xs font-medium text-foreground">
                Observaciones del Cobro
              </label>
              <Input
                id="obs-abono"
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Pago parcial acordado a fin de mes..."
                className="rounded-xl h-9 text-xs"
              />
            </div>

            {/* Proyección del Nuevo Saldo */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saldo restante proyectado:</span>
              <span className="font-mono font-bold text-foreground">
                {formatMoney(saldoRestante)}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || montoNum <= 0 || esExcesivo}
                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm apple-press-feedback"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Confirmar Abono S/. {montoNum > 0 ? montoNum.toFixed(2) : '0.00'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
