'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  X,
  FileText,
  User,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appleSprings, formatMoney } from '@/lib/utils';
import { usePosStore, type MetodoPago } from '@/stores/use-pos-store';
import { registrarVentaAction, consultarDocumentoSunatAction } from '../actions';
import { toast } from 'sonner';
import { TicketTermicoModal } from './ticket-termico-modal';

export function PosCheckoutModal() {
  const {
    items,
    isCheckoutModalOpen,
    setCheckoutModalOpen,
    tipo_comprobante,
    cliente,
    setCliente,
    receta,
    setRecetaModalOpen,
    clearCart,
    getTotales,
  } = usePosStore();

  const totales = getTotales();

  const montoInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const refOperacionInputRef = React.useRef<HTMLInputElement>(null);

  const [metodo, setMetodo] = React.useState<MetodoPago>('efectivo');
  const [montoEfectivo, setMontoEfectivo] = React.useState<string>('');
  const [numOperacion, setNumOperacion] = React.useState<string>('');
  const [docCliente, setDocCliente] = React.useState<string>('');
  const [nomCliente, setNomCliente] = React.useState<string>('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSearchingDoc, setIsSearchingDoc] = React.useState(false);
  const [ticketData, setTicketData] = React.useState<any>(null);

  const handleBuscarDoc = React.useCallback(async (docToSearch?: string) => {
    const doc = (docToSearch || docCliente).trim();
    const isRuc = tipo_comprobante === 'factura';
    if (isRuc && doc.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos.');
      return;
    }
    if (!isRuc && doc.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos.');
      return;
    }

    setIsSearchingDoc(true);
    try {
      const res = await consultarDocumentoSunatAction(isRuc ? 'ruc' : 'dni', doc);
      if (res.success) {
        const anyRes = res as any;
        const nombreEncontrado = anyRes.razonSocial || anyRes.nombreCompleto;
        if (nombreEncontrado) {
          setNomCliente(nombreEncontrado);
          toast.success(`Datos obtenidos: ${nombreEncontrado}`);
          if (metodo === 'efectivo') {
            setTimeout(() => {
              montoInputRef.current?.focus();
              montoInputRef.current?.select();
            }, 100);
          }
        }
      } else {
        toast.info(res.error || 'No se obtuvieron datos automáticos. Ingrese el nombre manualmente.');
      }
    } catch {
      toast.error('Error al consultar padrón oficial.');
    } finally {
      setIsSearchingDoc(false);
    }
  }, [docCliente, tipo_comprobante, metodo]);

  // Inicializar monto y auto-enfocar SOLO al abrir el modal de cobro (evita robar el foco al escribir RUC)
  React.useEffect(() => {
    if (isCheckoutModalOpen) {
      setMontoEfectivo(totales.total.toFixed(2));
      setIsSuccess(false);
      setIsSubmitting(false);

      if (cliente?.numero_documento && !docCliente) {
        setDocCliente(cliente.numero_documento);
        setNomCliente(cliente.nombres || '');
      }

      const timer = setTimeout(() => {
        const needsDoc = tipo_comprobante === 'factura' || totales.total >= 700;
        const hasDoc = Boolean(cliente?.numero_documento || docCliente);

        if (needsDoc && !hasDoc) {
          docInputRef.current?.focus();
        } else if (metodo === 'efectivo') {
          montoInputRef.current?.focus();
          montoInputRef.current?.select();
        } else {
          refOperacionInputRef.current?.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutModalOpen]);

  const vuelto = React.useMemo(() => {
    const pagado = parseFloat(montoEfectivo) || 0;
    return Math.max(0, pagado - totales.total);
  }, [montoEfectivo, totales.total]);

  const esPagoSuficiente = React.useMemo(() => {
    if (metodo === 'efectivo') {
      const pagado = parseFloat(montoEfectivo) || 0;
      return pagado >= totales.total;
    }
    return true;
  }, [metodo, montoEfectivo, totales.total]);

  // Selección directa de billete peruano recibido (monto fijo)
  const setQuickCash = (amount: number) => {
    setMontoEfectivo(amount.toFixed(2));
    setTimeout(() => {
      montoInputRef.current?.focus();
    }, 50);
  };

  const handleProcesarVenta = React.useCallback(async () => {
    // Validaciones SUNAT
    if (tipo_comprobante === 'factura' && (!docCliente || docCliente.length !== 11)) {
      toast.error('La factura requiere un número de RUC válido de 11 dígitos.');
      docInputRef.current?.focus();
      return;
    }
    if (tipo_comprobante === 'boleta' && totales.total >= 700 && (!docCliente || !nomCliente)) {
      toast.error('Las boletas a partir de S/ 700.00 requieren identificar al cliente (DNI y nombre).');
      docInputRef.current?.focus();
      return;
    }

    // Validación Sanitaria DIGEMID: Controlados y Recetas Médicas
    if (totales.requiereReceta && !receta) {
      if (totales.tieneControlados) {
        toast.error('Operación denegada (DIGEMID): El pedido contiene fármacos fiscalizados (psicotrópicos/estupefacientes) y no se puede emitir sin la receta médica retenida.');
      } else {
        toast.warning('Este pedido incluye medicamentos que requieren receta médica. Por favor regístrela antes de emitir.');
      }
      setCheckoutModalOpen(false);
      setRecetaModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = items.map((it) => ({
        presentacion_id: it.presentacion_id,
        cantidad: it.cantidad,
        descuento: it.descuento || 0,
      }));

      const pagosPayload = [
        {
          metodo,
          monto: metodo === 'efectivo' ? parseFloat(montoEfectivo) || totales.total : totales.total,
          referencia: numOperacion || null,
        },
      ];

      const res = await registrarVentaAction({
        tipo_comprobante:
          tipo_comprobante === 'factura' || tipo_comprobante === 'nota_venta'
            ? tipo_comprobante
            : 'boleta',
        items: itemsPayload,
        pagos: pagosPayload,
        cliente_documento: docCliente || null,
        cliente_nombre: nomCliente || null,
        receta: receta
          ? {
              medico_nombre: receta.medico_nombre,
              medico_cmp: receta.medico_cmp,
              paciente_nombre: receta.paciente_nombre,
              paciente_documento: receta.paciente_documento || null,
              numero_receta: receta.numero_receta || null,
              fecha_emision: receta.fecha_emision,
              retenida: receta.retenida,
              diagnostico_cie10: receta.diagnostico_cie10 || null,
            }
          : null,
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo procesar la venta.');
        return;
      }

      toast.success(`Venta ${res.comprobante} registrada exitosamente.`);
      setTicketData({
        serie: res.serie,
        numero: res.numero,
        comprobante: res.comprobante,
        tipoComprobante:
          tipo_comprobante === 'factura' || tipo_comprobante === 'nota_venta'
            ? tipo_comprobante
            : 'boleta',
        hash: res.hash,
        fecha: new Date().toLocaleString('es-PE'),
        total: res.total,
        subtotalGravado: totales.subtotalGravado,
        subtotalExonerado: totales.subtotalExonerado,
        igv: totales.igv,
        vuelto,
        metodo,
        montoPagado:
          metodo === 'efectivo'
            ? parseFloat(montoEfectivo) || totales.total
            : totales.total,
        clienteDoc: docCliente || undefined,
        clienteNombre: nomCliente || (docCliente ? docCliente : 'Clientes Varios'),
        items: items.map((it) => ({
          cantidad: it.cantidad,
          descripcion: it.nombre_comercial,
          presentacion: it.presentacion_nombre,
          precioUnitario: it.precio_unitario,
          total: it.total,
          lote: 'L-2026-A',
          vencimiento: '12/2027',
        })),
      });
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al emitir venta.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tipo_comprobante,
    docCliente,
    nomCliente,
    totales,
    receta,
    items,
    metodo,
    montoEfectivo,
    numOperacion,
    vuelto,
    setCheckoutModalOpen,
    setRecetaModalOpen,
  ]);

  // Atajo de teclado: Enter para cobro instantáneo, Esc para volver, Alt+1..3 / Alt+E/Y/T método de pago
  React.useEffect(() => {
    if (!isCheckoutModalOpen || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: Volver / Cerrar modal
      if (e.key === 'Escape') {
        e.preventDefault();
        setCheckoutModalOpen(false);
        return;
      }

      const isAltOrMeta = e.altKey || e.metaKey;

      // Alt+1 o Alt+E -> Efectivo
      if (isAltOrMeta && (e.key === '1' || e.key.toLowerCase() === 'e')) {
        e.preventDefault();
        setMetodo('efectivo');
        setTimeout(() => {
          montoInputRef.current?.focus();
          montoInputRef.current?.select();
        }, 50);
        return;
      }
      // Alt+2 o Alt+Y -> Yape / Plin
      if (isAltOrMeta && (e.key === '2' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        setMetodo('yape');
        setTimeout(() => refOperacionInputRef.current?.focus(), 50);
        return;
      }
      // Alt+3 o Alt+T -> Tarjeta
      if (isAltOrMeta && (e.key === '3' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        setMetodo('tarjeta');
        setTimeout(() => refOperacionInputRef.current?.focus(), 50);
        return;
      }

      // Enter: Cobro ágil inmediato
      if (e.key === 'Enter') {
        const active = document.activeElement;

        // Si está en el input de documento (RUC / DNI)
        if (active === docInputRef.current) {
          e.preventDefault();
          const isRuc = tipo_comprobante === 'factura';
          const requiredLen = isRuc ? 11 : 8;
          if (docCliente.length === requiredLen) {
            handleBuscarDoc(docCliente);
            if (metodo === 'efectivo') {
              montoInputRef.current?.focus();
              montoInputRef.current?.select();
            }
          } else {
            toast.warning(`El ${isRuc ? 'RUC' : 'DNI'} debe tener ${requiredLen} dígitos.`);
          }
          return;
        }

        e.preventDefault();
        if (isSubmitting) return;

        if (!esPagoSuficiente) {
          const faltante = totales.total - (parseFloat(montoEfectivo) || 0);
          toast.warning(`Monto insuficiente: Falta ${formatMoney(Math.max(0, faltante))}`);
          montoInputRef.current?.focus();
          montoInputRef.current?.select();
          return;
        }

        handleProcesarVenta();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCheckoutModalOpen,
    isSuccess,
    isSubmitting,
    esPagoSuficiente,
    tipo_comprobante,
    docCliente,
    montoEfectivo,
    totales.total,
    metodo,
    handleProcesarVenta,
    handleBuscarDoc,
    setCheckoutModalOpen,
  ]);

  const handleFinalizar = () => {
    clearCart();
    setCheckoutModalOpen(false);
    setIsSuccess(false);
    setTicketData(null);
  };

  if (isSuccess && ticketData) {
    return (
      <TicketTermicoModal
        isOpen={isSuccess}
        data={ticketData}
        onClose={handleFinalizar}
        onNuevaVenta={handleFinalizar}
      />
    );
  }

  return (
    <AnimatePresence>
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            onClick={() => !isSuccess && setCheckoutModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={appleSprings.sheet}
            className="relative w-full max-w-xl bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 overflow-hidden"
          >
            <div className="space-y-5">
                {/* Header del Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                        Finalizar Venta & Cobro
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        Comprobante: <strong>{tipo_comprobante}</strong> · Caja 01
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Resumen de Monto a Pagar */}
                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Total de la Operación</span>
                    <div className="text-3xl font-extrabold font-mono tracking-tight text-[#0071e3] dark:text-[#2997ff]">
                      {formatMoney(totales.total)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>IGV (18%): {formatMoney(totales.igv)}</p>
                    <p>{totales.totalItemsCount} unidades</p>
                  </div>
                </div>

                {/* Datos del Cliente si corresponde */}
                {(tipo_comprobante === 'factura' || totales.total >= 700) && (
                  <div className="p-3.5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20 space-y-3">
                    <span className="text-xs font-semibold text-[#0071e3] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {tipo_comprobante === 'factura'
                        ? 'Datos de Facturación (RUC Obligatorio)'
                        : 'Identificación de Cliente (Venta ≥ S/ 700)'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative flex items-center">
                        <Input
                          ref={docInputRef}
                          placeholder={tipo_comprobante === 'factura' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}
                          value={docCliente}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDocCliente(val);
                            if (tipo_comprobante === 'factura' && val.length === 11) {
                              handleBuscarDoc(val);
                            } else if (tipo_comprobante !== 'factura' && val.length === 8) {
                              handleBuscarDoc(val);
                            }
                          }}
                          maxLength={tipo_comprobante === 'factura' ? 11 : 8}
                          className="pr-10 font-mono tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => handleBuscarDoc()}
                          disabled={isSearchingDoc || !docCliente}
                          className="absolute right-2.5 p-1 rounded-lg text-muted-foreground hover:text-[#0071e3] disabled:opacity-40 transition"
                          title="Consultar en SUNAT / RENIEC"
                        >
                          {isSearchingDoc ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#0071e3]" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Input
                        placeholder="Razón Social o Nombre Completo"
                        value={nomCliente}
                        onChange={(e) => setNomCliente(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Programa de Puntos y Fidelización */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span>★ Puntos Botica</span>
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Esta venta acumula <strong className="text-foreground">{Math.floor(totales.total)} puntos</strong> para el cliente.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      1 sol = 1 pt
                    </span>
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'efectivo', label: 'Efectivo', icon: Banknote, shortcut: 'Alt+1' },
                      { id: 'yape', label: 'Yape / Plin', icon: Smartphone, shortcut: 'Alt+2' },
                      { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, shortcut: 'Alt+3' },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = metodo === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMetodo(m.id as MetodoPago);
                            if (m.id === 'efectivo') {
                              setTimeout(() => {
                                montoInputRef.current?.focus();
                                montoInputRef.current?.select();
                              }, 50);
                            } else {
                              setTimeout(() => refOperacionInputRef.current?.focus(), 50);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all duration-150 apple-press-feedback relative cursor-pointer ${
                            active
                              ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] font-bold shadow-xs'
                              : 'border-border bg-black/[0.02] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{m.label}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded transition-colors ${
                              active ? 'bg-[#0071e3]/20 text-[#0071e3] font-semibold' : 'opacity-50'
                            }`}
                          >
                            [{m.shortcut}]
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Controles para Efectivo y Vuelto */}
                {metodo === 'efectivo' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <label className="text-xs font-medium text-foreground">Monto Recibido</label>
                        <Input
                          ref={montoInputRef}
                          type="number"
                          step="0.10"
                          value={montoEfectivo}
                          onChange={(e) => setMontoEfectivo(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!esPagoSuficiente) {
                                const faltante = totales.total - (parseFloat(montoEfectivo) || 0);
                                toast.warning(`Monto insuficiente: Falta ${formatMoney(Math.max(0, faltante))}`);
                                montoInputRef.current?.select();
                                return;
                              }
                              handleProcesarVenta();
                            }
                          }}
                          className="font-mono text-base font-semibold"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1 flex-1 text-right">
                        <label className="text-xs font-medium text-muted-foreground">Vuelto a Entregar</label>
                        <div className="font-mono text-xl font-bold text-[#34c759] dark:text-[#30d158]">
                          {formatMoney(vuelto)}
                        </div>
                      </div>
                    </div>

                    {/* Billetes rápidos peruanos */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground mr-1">Billetes:</span>
                      {[10, 20, 50, 100, 200].map((billete) => {
                        const isSelected = parseFloat(montoEfectivo) === billete;
                        return (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => setQuickCash(billete)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all apple-press-feedback shadow-xs cursor-pointer ${
                              isSelected
                                ? 'bg-[#0071e3] text-white border-[#0071e3] font-bold'
                                : 'bg-white dark:bg-white/10 border-border hover:border-[#0071e3] text-foreground'
                            }`}
                          >
                            S/ {billete}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setMontoEfectivo(totales.total.toFixed(2));
                          setTimeout(() => montoInputRef.current?.focus(), 50);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all apple-press-feedback ml-auto cursor-pointer ${
                          parseFloat(montoEfectivo) === totales.total
                            ? 'bg-[#0071e3] text-white border-[#0071e3] font-bold'
                            : 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 hover:bg-[#0071e3]/20'
                        }`}
                      >
                        Exacto
                      </button>
                    </div>
                  </div>
                )}

                {/* Controles para Yape / Plin / Tarjeta */}
                {metodo !== 'efectivo' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">
                      Número de Operación / Referencia
                    </label>
                    <Input
                      ref={refOperacionInputRef}
                      placeholder="Ej. 987654 (Opcional)"
                      value={numOperacion}
                      onChange={(e) => setNumOperacion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleProcesarVenta();
                        }
                      }}
                    />
                  </div>
                )}

                  {/* Botón de Confirmación y atajos rápidos */}
                  <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-foreground font-mono font-semibold text-[10px] border border-border">
                          Enter
                        </kbd>
                        <span>Cobrar</span>
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-foreground font-mono font-semibold text-[10px] border border-border">
                          Esc
                        </kbd>
                        <span>Volver</span>
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-foreground font-mono font-semibold text-[10px] border border-border">
                          Alt + 1..3
                        </kbd>
                        <span>Métodos</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 ml-auto">
                      <Button
                        variant="ghost"
                        onClick={() => setCheckoutModalOpen(false)}
                        className="rounded-xl text-xs"
                      >
                        Volver
                      </Button>
                      <Button
                        size="lg"
                        disabled={!esPagoSuficiente || isSubmitting}
                        onClick={handleProcesarVenta}
                        className={`rounded-2xl px-6 gap-2 font-semibold shadow-sm transition-all cursor-pointer ${
                          esPagoSuficiente
                            ? 'bg-[#0071e3] hover:bg-[#0071e3]/90 text-white shadow-[#0071e3]/20 shadow-md'
                            : 'opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Emitiendo...</span>
                          </>
                        ) : (
                          <>
                            <span>Emitir {tipo_comprobante}</span>
                            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/20">
                              ↵ Enter
                            </kbd>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
