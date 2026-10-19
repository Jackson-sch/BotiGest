'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, X, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { appleSprings, formatMoney } from '@/lib/utils';
import type { CompraItemInput } from '../types';
import { registrarCompraAction } from '../actions';
import { toast } from 'sonner';

interface NuevaCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NuevaCompraModal({ isOpen, onClose, onSuccess }: NuevaCompraModalProps) {
  const [proveedorRuc, setProveedorRuc] = React.useState('20100070970');
  const [proveedorNombre, setProveedorNombre] = React.useState('Droguería Suiza S.A.C.');
  const [tipoDoc, setTipoDoc] = React.useState<'factura' | 'boleta' | 'guia_remision'>('factura');
  const [serieNumero, setSerieNumero] = React.useState('F001-002490');
  const [fechaEmision, setFechaEmision] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFechaEmision(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Ítems de la factura
  const [items, setItems] = React.useState<CompraItemInput[]>([
    {
      producto_id: 'p1111111-1111-1111-1111-111111111111',
      producto_nombre: 'Panadol Forte 500 mg',
      presentacion_id: 'pres-1c',
      presentacion_nombre: 'Caja x100',
      factor_base: 100,
      numero_lote: 'L-2026-X1',
      fecha_vencimiento: '2028-06-30',
      cantidad: 5,
      costo_unitario_presentacion: 55.0,
    },
    {
      producto_id: 'p2222222-2222-2222-2222-222222222222',
      producto_nombre: 'Paracetamol 500 mg DCI',
      presentacion_id: 'pres-2c',
      presentacion_nombre: 'Caja x100',
      factor_base: 100,
      numero_lote: 'L-POR-2026',
      fecha_vencimiento: '2028-11-20',
      cantidad: 10,
      costo_unitario_presentacion: 10.5,
    },
  ]);

  const subtotal = items.reduce(
    (acc, it) => acc + it.cantidad * it.costo_unitario_presentacion,
    0
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleUpdateItem = (index: number, field: keyof CompraItemInput, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        producto_id: 'p3333333-3333-3333-3333-333333333333',
        producto_nombre: 'Amoxicilina + Clavulánico 500/125 mg',
        presentacion_id: 'pres-3b',
        presentacion_nombre: 'Caja x14',
        factor_base: 14,
        numero_lote: '',
        fecha_vencimiento: '',
        cantidad: 1,
        costo_unitario_presentacion: 28.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Agregue al menos un producto a la compra.');
      return;
    }

    // Validar lotes y vencimientos
    for (const it of items) {
      if (!it.numero_lote.trim() || !it.fecha_vencimiento) {
        toast.error(`Complete el lote y vencimiento para: ${it.producto_nombre}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await registrarCompraAction({
        sucursal_id: '00000000-0000-0000-0000-000000000001',
        proveedor_id: '00000000-0000-0000-0000-000000000099',
        tipo_documento: tipoDoc,
        serie_numero: serieNumero,
        fecha_emision: fechaEmision,
        items,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al registrar la compra');
      } else {
        toast.success('Factura de compra registrada exitosamente en estado borrador.');
        onSuccess();
        onClose();
      }
    } catch {
      toast.error('Error inesperado al registrar la compra.');
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
            className="relative w-full max-w-3xl bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center font-bold">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                    Registrar Compra de Proveedor / Droguería
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Captura obligatoria de lote y fecha de vencimiento para ingreso a almacén
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Cabecera del Documento */}
              <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Proveedor / Droguería</label>
                  <Input
                    value={proveedorNombre}
                    onChange={(e) => setProveedorNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">N° Comprobante Proveedor</label>
                  <Input
                    placeholder="Ej. F001-002490"
                    value={serieNumero}
                    onChange={(e) => setSerieNumero(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Fecha de Emisión</label>
                  <DatePicker
                    value={fechaEmision}
                    onChange={setFechaEmision}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              {/* Lista Dinámica de Ítems */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-xs">
                    Productos & Lotes Ingresados
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleAddItem}
                    className="h-7 text-xs rounded-lg text-[#0071e3]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar Producto
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-border grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] text-muted-foreground">Producto & Presentación</label>
                        <p className="font-semibold text-foreground truncate">{it.producto_nombre}</p>
                        <span className="text-[11px] text-muted-foreground">{it.presentacion_nombre}</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">N° Lote *</label>
                        <Input
                          placeholder="Ej. L-2024-X"
                          value={it.numero_lote}
                          onChange={(e) => handleUpdateItem(idx, 'numero_lote', e.target.value)}
                          className="font-mono text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Fecha Vto. *</label>
                        <DatePicker
                          value={it.fecha_vencimiento}
                          onChange={(val) => handleUpdateItem(idx, 'fecha_vencimiento', val)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Cant. x Costo</label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={it.cantidad}
                            onChange={(e) => handleUpdateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                            className="w-16 font-mono text-xs"
                          />
                          <span className="text-muted-foreground">x</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.costo_unitario_presentacion}
                            onChange={(e) => handleUpdateItem(idx, 'costo_unitario_presentacion', parseFloat(e.target.value) || 0)}
                            className="w-20 font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pb-1">
                        <span className="font-mono font-bold text-foreground">
                          {formatMoney(it.cantidad * it.costo_unitario_presentacion)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-muted-foreground hover:text-[#ff3b30] p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border flex justify-between items-center text-xs">
                <div className="text-muted-foreground space-x-4">
                  <span>Subtotal: <strong className="font-mono text-foreground">{formatMoney(subtotal)}</strong></span>
                  <span>IGV (18%): <strong className="font-mono text-foreground">{formatMoney(igv)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground mr-2">TOTAL COMPRA:</span>
                  <span className="font-mono text-lg font-bold text-[#34c759] dark:text-[#30d158]">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl px-6 font-medium bg-[#34c759] hover:bg-[#28a745] text-white">
                  {loading ? 'Guardando...' : 'Registrar Compra (Borrador)'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
