'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Coins,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  User,
  Phone,
  MapPin,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { appleSprings } from '@/lib/utils';
import type { Cliente, ClienteDetalleCompleto } from '../types';
import { obtenerEstadoCuentaClienteAction } from '../actions';
import { exportEstadoCuentaToExcel } from '@/lib/excel-export';
import { EstadoCuentaPrint } from './estado-cuenta-print';

interface EstadoCuentaModalProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrarAbono: (cliente: Cliente) => void;
}

export function EstadoCuentaModal({
  cliente,
  open,
  onOpenChange,
  onRegistrarAbono,
}: EstadoCuentaModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [detalle, setDetalle] = React.useState<ClienteDetalleCompleto | null>(null);
  const [activeTab, setActiveTab] = React.useState<'movimientos' | 'ventas'>('movimientos');

  // Cargar movimientos y ventas recientes cuando se abre el modal
  React.useEffect(() => {
    if (open && cliente?.id) {
      setLoading(true);
      obtenerEstadoCuentaClienteAction(cliente.id)
        .then((res) => {
          if (res.success && res.data) {
            setDetalle(res.data);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetalle(null);
    }
    setActiveTab('movimientos');
  }, [open, cliente?.id]);

  if (!open || !cliente) return null;

  const currentCliente = detalle || cliente;
  const disponible = currentCliente.tiene_credito
    ? Math.max(0, currentCliente.limite_credito - currentCliente.saldo_deudor)
    : 0;

  const handleExportExcel = async () => {
    if (!currentCliente) return;
    await exportEstadoCuentaToExcel(
      {
        tipo_documento: currentCliente.tipo_documento,
        numero_documento: currentCliente.numero_documento,
        nombres: currentCliente.nombres,
        telefono: currentCliente.telefono,
        email: currentCliente.email,
        direccion: currentCliente.direccion,
        tiene_credito: currentCliente.tiene_credito,
        limite_credito: currentCliente.limite_credito,
        dias_credito: currentCliente.dias_credito,
        saldo_deudor: currentCliente.saldo_deudor,
        puntos: currentCliente.puntos,
        alergias: currentCliente.alergias,
        condicion_medica: currentCliente.condicion_medica,
        activo: currentCliente.activo,
      },
      detalle?.movimientos || []
    );
  };

  const handlePrint = () => {
    document.body.classList.add('printing-estado-cuenta');
    window.print();
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('printing-estado-cuenta');
      },
      { once: true }
    );
  };

  return (
    <>
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

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={appleSprings.sheet}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {currentCliente.nombres}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {currentCliente.tipo_documento.toUpperCase()}: {currentCliente.numero_documento}
                    </Badge>
                    {currentCliente.tiene_credito ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Línea de Crédito Activa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Sin Línea de Crédito</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-4 flex-wrap">
                    {currentCliente.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {currentCliente.telefono}
                      </span>
                    )}
                    {currentCliente.direccion && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {currentCliente.direccion}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> Puntos acumulados: <strong>{currentCliente.puntos}</strong>
                    </span>
                  </div>
                </div>

                {/* Botones de acción principales */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="gap-1.5 text-xs rounded-xl"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 text-xs rounded-xl"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  {currentCliente.saldo_deudor > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        onRegistrarAbono(currentCliente);
                      }}
                      className="gap-1.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Coins className="h-4 w-4" />
                      Registrar Abono
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8 rounded-full ml-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Banner de alerta médica / alergias si corresponde */}
              {(currentCliente.alergias || currentCliente.condicion_medica) && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-semibold">Perfil Farmacéutico / Alergias:</span>{' '}
                    {currentCliente.alergias && `Alergias a ${currentCliente.alergias}. `}
                    {currentCliente.condicion_medica && `Condición: ${currentCliente.condicion_medica}.`}
                  </div>
                </div>
              )}
            </div>

            {/* Tarjetas KPI de Estado de Cuenta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-xs">
                <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Línea de Crédito
                </span>
                <p className="text-lg font-bold font-mono mt-1 text-foreground">
                  S/ {currentCliente.limite_credito.toFixed(2)}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-3 shadow-xs ${
                  currentCliente.saldo_deudor > 0
                    ? 'border-destructive/40 bg-destructive/5 text-destructive'
                    : 'border-border/60 bg-muted/20'
                }`}
              >
                <span className="text-[11px] font-medium uppercase flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Saldo Deudor
                </span>
                <p className="text-lg font-bold font-mono mt-1">
                  S/ {currentCliente.saldo_deudor.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-xs">
                <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3 text-emerald-500" /> Crédito Disponible
                </span>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  S/ {disponible.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-xs">
                <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Plazo Máximo
                </span>
                <p className="text-lg font-bold mt-1 text-foreground">{currentCliente.dias_credito} días</p>
              </div>
            </div>

            {/* Tabs: Movimientos y Ventas */}
            <div className="flex-1 overflow-hidden p-6 pt-2 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('movimientos')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'movimientos'
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Movimientos Cta. Corriente ({detalle?.movimientos?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ventas')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'ventas'
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Ventas Recientes ({detalle?.ventas_recientes?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Movimientos */}
              {activeTab === 'movimientos' && (
                <div className="flex-1 overflow-auto border border-border/60 rounded-2xl">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando historial de cuenta corriente...
                    </div>
                  ) : !detalle?.movimientos?.length ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No hay movimientos registrados en la cuenta de este cliente.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b sticky top-0 z-10 text-muted-foreground">
                        <tr>
                          <th className="p-2.5 text-left font-semibold">Fecha / Hora</th>
                          <th className="p-2.5 text-center font-semibold">Tipo</th>
                          <th className="p-2.5 text-left font-semibold">Referencia / Comprobante</th>
                          <th className="p-2.5 text-center font-semibold">Medio de Pago</th>
                          <th className="p-2.5 text-right font-semibold">Monto</th>
                          <th className="p-2.5 text-right font-semibold">Saldo Posterior</th>
                          <th className="p-2.5 text-left font-semibold">Cajero / Registro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {detalle.movimientos.map((m) => {
                          const esCargo = m.tipo_movimiento === 'cargo';
                          return (
                            <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                                {new Date(m.created_at).toLocaleString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                {esCargo ? (
                                  <Badge
                                    variant="outline"
                                    className="border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 text-[10px]"
                                  >
                                    CARGO
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]"
                                  >
                                    ABONO
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span className="font-semibold text-foreground">
                                  {m.comprobante_referencia || '-'}
                                </span>
                                {m.observaciones && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-xs">
                                    {m.observaciones}
                                  </p>
                                )}
                              </td>
                              <td className="p-2.5 text-center uppercase font-mono text-[10px]">
                                {m.metodo_pago ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {m.metodo_pago}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td
                                className={`p-2.5 text-right font-mono font-semibold ${
                                  esCargo ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {esCargo ? '+' : '-'}S/ {Number(m.monto).toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-foreground">
                                S/ {Number(m.saldo_posterior).toFixed(2)}
                              </td>
                              <td className="p-2.5 text-muted-foreground text-[11px]">
                                {m.registrado_por_nombre || 'Sistema'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 2: Ventas */}
              {activeTab === 'ventas' && (
                <div className="flex-1 overflow-auto border border-border/60 rounded-2xl">
                  {!detalle?.ventas_recientes?.length ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No hay ventas registradas a nombre de este cliente.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b sticky top-0 z-10 text-muted-foreground">
                        <tr>
                          <th className="p-2.5 text-left font-semibold">Comprobante</th>
                          <th className="p-2.5 text-left font-semibold">Tipo</th>
                          <th className="p-2.5 text-left font-semibold">Fecha Emisión</th>
                          <th className="p-2.5 text-center font-semibold">Estado</th>
                          <th className="p-2.5 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {detalle.ventas_recientes.map((v) => (
                          <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-primary">
                              {v.correlativo}
                            </td>
                            <td className="p-2.5 capitalize">{v.tipo_comprobante}</td>
                            <td className="p-2.5 text-muted-foreground">
                              {new Date(v.fecha_emision).toLocaleString('es-PE')}
                            </td>
                            <td className="p-2.5 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  v.estado === 'emitida'
                                    ? 'border-emerald-500/30 text-emerald-600'
                                    : 'border-destructive/30 text-destructive'
                                }
                              >
                                {v.estado.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              S/ {v.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Printable Sheet rendered in Portal */}
      <EstadoCuentaPrint
        cliente={currentCliente}
        movimientos={detalle?.movimientos || []}
      />
    </>
  );
}
