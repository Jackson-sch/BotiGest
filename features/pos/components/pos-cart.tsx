'use client';

import * as React from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  FileText,
  AlertCircle,
  Receipt,
  User,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

import { formatMoney } from '@/lib/utils';
import { usePosStore, type CartItem } from '@/stores/use-pos-store';
import { PosHeldCartsModal } from './pos-held-carts-modal';
import { toast } from 'sonner';

interface PosCartProps {
  hasActiveTurn?: boolean;
}

export function PosCart({ hasActiveTurn = true }: PosCartProps) {
  const {
    items,
    updateQuantity,
    updatePresentacion,
    removeItem,
    clearCart,
    tipo_comprobante,
    setTipoComprobante,
    cliente,
    setCliente,
    receta,
    setRecetaModalOpen,
    setCheckoutModalOpen,
    getTotales,
    heldCarts,
    initHeldCarts,
    parkCurrentCart,
    setHeldCartsModalOpen,
    substituteGenericItem,
  } = usePosStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    initHeldCarts();
  }, [initHeldCarts]);

  const totales = getTotales();

  const handleParkCart = () => {
    const held = parkCurrentCart();
    if (held) {
      toast.success(`Venta pausada: Ticket ${held.id} puesto en espera.`);
    }
  };

  const handleIniciarCobro = () => {
    if (items.length === 0 || !hasActiveTurn) return;

    // Validación de controlados y fármacos con receta
    if (totales.requiereReceta && !receta) {
      if (totales.tieneControlados) {
        toast.error('Medicamento Fiscalizado (DIGEMID): Debe registrar la receta médica retenida antes de cobrar.', {
          action: {
            label: 'Registrar Receta',
            onClick: () => setRecetaModalOpen(true),
          },
          duration: 6000,
        });
        setRecetaModalOpen(true);
        return;
      }

      toast.warning('Este pedido contiene medicamentos que requieren receta médica.', {
        description: 'Por favor registre los datos de la prescripción para cumplir la regulación.',
        action: {
          label: 'Registrar Receta',
          onClick: () => setRecetaModalOpen(true),
        },
        duration: 5000,
      });
      setRecetaModalOpen(true);
      return;
    }

    setCheckoutModalOpen(true);
  };

  // Atajos de teclado: F4 o Ctrl+Enter para cobrar, F6 para poner en espera / ver tickets, Alt+C para vaciar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 o Ctrl+Enter: Cobro
      if ((e.key === 'F4' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter'))) {
        e.preventDefault();
        if (items.length > 0 && hasActiveTurn) {
          handleIniciarCobro();
        } else if (items.length === 0) {
          toast.info('Agrega productos al carrito antes de cobrar.');
        } else if (!hasActiveTurn) {
          toast.warning('Abre un turno en caja para poder cobrar.');
        }
        return;
      }

      // F6: Multiticket (Pausar venta actual o ver tickets en espera)
      if (e.key === 'F6') {
        e.preventDefault();
        if (items.length > 0) {
          handleParkCart();
        } else if (heldCarts.length > 0) {
          setHeldCartsModalOpen(true);
        } else {
          toast.info('No hay ventas activas para pausar ni tickets en espera.');
        }
        return;
      }

      // Alt + C: Cancelar / Limpiar carrito
      if (e.altKey && (e.key.toLowerCase() === 'c' || e.code === 'KeyC')) {
        if (items.length > 0) {
          e.preventDefault();
          clearCart();
          toast.info('Carrito de venta vaciado.');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, hasActiveTurn, heldCarts.length, clearCart]);

  return (
    <div className="w-full lg:w-96 flex flex-col h-full apple-glass-sheet rounded-3xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      {/* Header del Carrito */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm tracking-apple-title text-foreground">
              Venta Actual
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {totales.totalItemsCount} {totales.totalItemsCount === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {mounted && heldCarts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHeldCartsModalOpen(true)}
              className="h-7 px-2 text-[11px] font-semibold rounded-lg border-[#ff9f0a]/30 text-[#b25e00] dark:text-[#ffd60a] bg-[#ff9f0a]/10 hover:bg-[#ff9f0a]/20 gap-1 apple-press-feedback"
              title="Ver ventas en espera [F6]"
            >
              <Clock className="h-3 w-3" />
              <span>{heldCarts.length} en espera</span>
            </Button>
          )}

          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleParkCart}
              className="h-7 px-2 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-foreground gap-1 apple-press-feedback"
              title="Pausar venta [F6]"
            >
              <Clock className="h-3 w-3 text-[#ff9f0a]" />
              <span className="hidden sm:inline">Pausar</span>
              <span className="text-[9px] font-mono opacity-70">F6</span>
            </Button>
          )}

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-[#ff3b30] h-7 px-2 text-xs rounded-lg"
              title="Vaciar carrito"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tipo de Comprobante SUNAT */}
      <div className="pt-3 pb-2">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
          {(['boleta', 'factura', 'nota_venta'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoComprobante(tipo)}
              className={`py-1.5 text-xs font-medium rounded-lg capitalize transition-all duration-150 apple-press-feedback ${
                tipo_comprobante === tipo
                  ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tipo === 'nota_venta' ? 'Nota Venta' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de Receta Médica Requerida */}
      {totales.requiereReceta && (
        <div className="my-2 p-2.5 rounded-2xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/25 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#ff9f0a] shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Requiere Receta Médica</span>
              <span className="text-[11px] text-muted-foreground">
                {receta ? `Médico: CMP ${receta.medico_cmp}` : 'Pendiente de registrar'}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRecetaModalOpen(true)}
            className="h-7 text-xs rounded-lg px-2.5 font-medium border-[#ff9f0a]/40 text-foreground"
          >
            {receta ? 'Editar' : 'Registrar'}
          </Button>
        </div>
      )}

      {/* Lista de Ítems en el Carrito con Scroll Suave */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">El carrito está vacío</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Escanea un código de barras o selecciona productos del catálogo.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-foreground leading-tight">
                    {item.nombre_comercial}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.concentracion}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-[#ff3b30] p-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Selector de Presentación y Controles de Cantidad */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Selector de Presentación */}
                <Select
                  value={item.presentacion_id}
                  onValueChange={(val) => updatePresentacion(item.id, val)}
                >
                  <SelectTrigger className="h-7 text-xs py-0.5 px-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border/40 font-medium text-foreground max-w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {item.presentaciones.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.nombre} ({formatMoney(p.precio_venta)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>


                {/* Stepper de Cantidad estilo Apple */}
                <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10 apple-press-feedback"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center font-mono text-xs font-semibold text-foreground">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10 apple-press-feedback"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Subtotal del item */}
                <span className="font-mono text-xs font-bold text-foreground">
                  {formatMoney(item.total)}
                </span>
              </div>

              {/* Sugerencia de Genérico DCI (DIGEMID) */}
              {item.alternativa_generica && (
                <div className="p-2 rounded-xl bg-[#34c759]/10 border border-[#34c759]/25 flex items-center justify-between text-[11px] text-[#248a3d] dark:text-[#30d158]">
                  <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      DCI: {item.alternativa_generica.nombre_comercial} (S/ {item.alternativa_generica.precio_venta.toFixed(2)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      substituteGenericItem(item.id);
                      toast.success(
                        `Sustituido por genérico DCI (Ahorro del ${item.alternativa_generica?.ahorro_porcentaje}%)`
                      );
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#34c759]/20 hover:bg-[#34c759]/30 transition-colors shrink-0 ml-1 cursor-pointer"
                  >
                    Cambiar (-{item.alternativa_generica.ahorro_porcentaje}%)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resumen de Totales y Cobro */}
      <div className="pt-3 border-t border-border space-y-3">
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal Gravado</span>
            <span className="font-mono text-foreground">{formatMoney(totales.subtotalGravado)}</span>
          </div>
          {totales.subtotalExonerado > 0 && (
            <div className="flex justify-between">
              <span>Subtotal Exonerado</span>
              <span className="font-mono text-foreground">{formatMoney(totales.subtotalExonerado)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>IGV (18%)</span>
            <span className="font-mono text-foreground">{formatMoney(totales.igv)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border font-semibold text-sm text-foreground">
            <span>Total a Pagar</span>
            <span className="font-mono text-lg font-bold text-[#0071e3] dark:text-[#2997ff]">
              {formatMoney(totales.total)}
            </span>
          </div>
        </div>

        {/* Botón de Cobro Primario con atajo F4 o Bloqueo por Caja Cerrada */}
        {!hasActiveTurn ? (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#ff9500]/10 border border-[#ff9500]/20 text-[11px] text-[#b25e00] dark:text-[#ff9f0a] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Turno de caja cerrado. Abre tu turno para cobrar.</span>
            </div>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-2xl font-semibold border-[#ff9500]/40 text-[#b25e00] dark:text-[#ff9f0a] hover:bg-[#ff9500]/10 h-12"
            >
              <Link href="/caja">
                Abrir Turno en Caja
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            disabled={items.length === 0}
            onClick={handleIniciarCobro}
            className="w-full rounded-2xl gap-2 font-semibold text-base shadow-sm justify-between px-5 h-12"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Cobrar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base">{formatMoney(totales.total)}</span>
              <span className="text-[10px] font-mono uppercase bg-white/20 px-1.5 py-0.5 rounded">
                F4
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* Modal de Ventas en Espera (Multiticket F6) */}
      <PosHeldCartsModal />
    </div>
  );
}
