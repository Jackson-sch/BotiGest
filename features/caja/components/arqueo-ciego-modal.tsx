'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import { cerrarTurnoAction, verificarArqueoAction } from '../actions';
import { ModalAutorizacionDescuadre } from './modal-autorizacion-descuadre';
import { toast } from 'sonner';

interface ArqueoCiegoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: string;
  onSuccess: (diferencia?: number) => void;
}

const DENOMINACIONES = [
  { valor: 200, label: 'Billetes S/ 200', tipo: 'billete' },
  { valor: 100, label: 'Billetes S/ 100', tipo: 'billete' },
  { valor: 50, label: 'Billetes S/ 50', tipo: 'billete' },
  { valor: 20, label: 'Billetes S/ 20', tipo: 'billete' },
  { valor: 10, label: 'Billetes S/ 10', tipo: 'billete' },
  { valor: 5, label: 'Monedas S/ 5.00', tipo: 'moneda' },
  { valor: 2, label: 'Monedas S/ 2.00', tipo: 'moneda' },
  { valor: 1, label: 'Monedas S/ 1.00', tipo: 'moneda' },
  { valor: 0.5, label: 'Monedas S/ 0.50', tipo: 'moneda' },
  { valor: 0.2, label: 'Monedas S/ 0.20', tipo: 'moneda' },
  { valor: 0.1, label: 'Monedas S/ 0.10', tipo: 'moneda' },
];

export function ArqueoCiegoModal({
  isOpen,
  onClose,
  turnoId,
  onSuccess,
}: ArqueoCiegoModalProps) {
  const [cantidades, setCantidades] = React.useState<Record<number, number>>({});
  const [observacion, setObservacion] = React.useState<string>('');
  const [declararVacio, setDeclararVacio] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [resultado, setResultado] = React.useState<{ diferencia: number } | null>(null);

  const [isModalDescuadreOpen, setIsModalDescuadreOpen] = React.useState<boolean>(false);
  const [descuadreInfo, setDescuadreInfo] = React.useState<{
    diferencia: number;
    montoDeclarado: number;
    montoSistema: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleCantidadChange = (valor: number, strQty: string) => {
    const qty = parseInt(strQty, 10);
    setCantidades((prev) => ({
      ...prev,
      [valor]: isNaN(qty) || qty < 0 ? 0 : qty,
    }));
  };

  const totalContado = Number(
    DENOMINACIONES.reduce((acc, curr) => {
      const qty = cantidades[curr.valor] || 0;
      return acc + curr.valor * qty;
    }, 0).toFixed(2)
  );

  const totalPiezas = DENOMINACIONES.reduce((acc, curr) => acc + (cantidades[curr.valor] || 0), 0);

  const ejecutarCierreDirecto = async () => {
    setIsLoading(true);
    try {
      const res = await cerrarTurnoAction({
        turno_id: turnoId,
        monto_declarado: totalContado,
        total_piezas: totalPiezas,
        declarar_gaveta_vacia: declararVacio,
        observacion: observacion || undefined,
      });

      if (res.success) {
        setResultado({ diferencia: res.diferencia || 0 });
        toast.success('¡Caja Cuadrada Exacta! Turno cerrado exitosamente.');
        onSuccess(res.diferencia);
      } else if (res.requiereAutorizacion) {
        setDescuadreInfo({
          diferencia: res.diferencia ?? 0,
          montoDeclarado: res.montoDeclarado ?? totalContado,
          montoSistema: res.montoSistema ?? 0,
        });
        setIsModalDescuadreOpen(true);
      } else {
        toast.error(res.error || 'Error al cerrar turno');
      }
    } catch {
      toast.error('Error al procesar el arqueo ciego');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalPiezas === 0 && !declararVacio) {
      toast.error('Debe ingresar el conteo físico de monedas y billetes antes de cerrar la caja.');
      return;
    }

    setIsLoading(true);
    try {
      const check = await verificarArqueoAction(turnoId, totalContado);
      if (!check.success) {
        toast.error(check.error || 'Error al verificar arqueo');
        return;
      }

      if (check.cuadraExacto) {
        await ejecutarCierreDirecto();
      } else {
        setDescuadreInfo({
          diferencia: check.diferencia ?? 0,
          montoDeclarado: check.montoDeclarado ?? totalContado,
          montoSistema: check.montoSistema ?? 0,
        });
        setIsModalDescuadreOpen(true);
        toast.warning(
          `La caja presenta un descuadre (${check.diferencia! < 0 ? 'Faltante: -S/' : 'Sobrante: +S/'}${Math.abs(check.diferencia!).toFixed(2)}). Se requiere autorización de Supervisor.`
        );
      }
    } catch {
      toast.error('Error al verificar balance de arqueo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarAutorizacionDescuadre = async (data: {
    supervisor_dni: string;
    supervisor_pin: string;
    motivo_descuadre: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await cerrarTurnoAction({
        turno_id: turnoId,
        monto_declarado: totalContado,
        total_piezas: totalPiezas,
        declarar_gaveta_vacia: declararVacio,
        observacion: observacion || undefined,
        autorizacion: data,
      });

      if (res.success) {
        setIsModalDescuadreOpen(false);
        setResultado({ diferencia: res.diferencia || 0 });
        toast.success('Descuadre autorizado y turno cerrado con registro de auditoría.');
        onSuccess(res.diferencia);
      } else {
        toast.error(res.error || 'No se pudo autorizar el descuadre');
      }
    } catch {
      toast.error('Error al procesar la autorización');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl p-6 overflow-hidden my-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#af52de]/10 text-[#af52de] flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-apple-title text-foreground">
                    Arqueo Ciego & Cierre de Turno
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Conteo físico a ciegas (auditoría sin sesgo de ventas)
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

            {resultado ? (
              <div className="py-6 space-y-5 text-center">
                <div
                  className={`mx-auto h-14 w-14 rounded-2xl flex items-center justify-center ${
                    Math.abs(resultado.diferencia) < 0.05
                      ? 'bg-[#34c759]/10 text-[#34c759]'
                      : resultado.diferencia > 0
                      ? 'bg-[#0071e3]/10 text-[#0071e3]'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {Math.abs(resultado.diferencia) < 0.05 ? (
                    <CheckCircle2 className="h-8 w-8" />
                  ) : (
                    <AlertTriangle className="h-8 w-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold tracking-apple-title text-foreground">
                    {Math.abs(resultado.diferencia) < 0.05
                      ? '¡Caja Cuadrada Exacta!'
                      : resultado.diferencia > 0
                      ? `Sobrante de Caja: +${formatMoney(resultado.diferencia)}`
                      : `Faltante de Caja: -${formatMoney(Math.abs(resultado.diferencia))}`}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total efectivo declarado:{' '}
                    <span className="font-mono font-semibold text-foreground">
                      {formatMoney(totalContado)}
                    </span>
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={onClose}
                    className="rounded-xl px-6 font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white"
                  >
                    Finalizar & Salir
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="text-xs text-muted-foreground bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                  Ingrese la cantidad de unidades por cada denominación que tenga físicamente en la gaveta.
                </div>

                {/* Grid de denominaciones */}
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {DENOMINACIONES.map((d) => {
                    const qty = cantidades[d.valor] || '';
                    const subtotal = (cantidades[d.valor] || 0) * d.valor;
                    return (
                      <div
                        key={d.valor}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground block">
                            {d.label}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground block">
                            = {formatMoney(subtotal)}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={qty}
                          onChange={(e) => handleCantidadChange(d.valor, e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-right font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#af52de]"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Resumen Total Declarado */}
                <div className="p-3.5 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#0071e3]" />
                    <span className="text-xs font-semibold text-[#0071e3]">
                      Total Efectivo Contado ({totalPiezas} piezas):
                    </span>
                  </div>
                  <span className="text-lg font-bold font-mono text-[#0071e3]">
                    {formatMoney(totalContado)}
                  </span>
                </div>

                {/* Protección contra Estado Vacío */}
                {totalPiezas === 0 && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Sin conteo físico de gaveta</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Debe registrar el desglose de monedas y billetes. Si la gaveta está vacía, confirme la casilla:
                    </p>
                    <label className="flex items-start gap-2 cursor-pointer pt-1 text-[11px] text-foreground font-medium select-none">
                      <input
                        type="checkbox"
                        checked={declararVacio}
                        onChange={(e) => setDeclararVacio(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>Declaro bajo responsabilidad que la gaveta física está vacía (S/ 0.00).</span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Observaciones de Cierre (Opcional)
                  </label>
                  <input
                    type="text"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Ej. Billetes entregados a supervisor de turno tarde"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#af52de]"
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
                    disabled={isLoading || (totalPiezas === 0 && !declararVacio)}
                    className="rounded-xl text-xs font-semibold bg-[#af52de] hover:bg-[#9333ea] text-white apple-press-feedback disabled:opacity-50"
                  >
                    {isLoading
                      ? 'Conciliando...'
                      : totalPiezas === 0 && !declararVacio
                      ? 'Ingrese conteo para cerrar'
                      : 'Confirmar Cierre de Turno'}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Modal de Autorización por Descuadre */}
      {descuadreInfo && (
        <ModalAutorizacionDescuadre
          isOpen={isModalDescuadreOpen}
          onClose={() => setIsModalDescuadreOpen(false)}
          diferencia={descuadreInfo.diferencia}
          montoDeclarado={descuadreInfo.montoDeclarado}
          montoSistema={descuadreInfo.montoSistema}
          onConfirmar={handleConfirmarAutorizacionDescuadre}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
