'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, X, Calendar, FileText, CheckCircle2, Boxes, Ban, XCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appleSprings, formatMoney } from '@/lib/utils';
import type { CompraCompleta } from '../types';

interface CompraDetalleModalProps {
  compra: CompraCompleta | null;
  isOpen: boolean;
  onClose: () => void;
  onRecibir?: (compraId: string) => void;
  onAnular?: (compra: CompraCompleta) => void;
}

export function CompraDetalleModal({
  compra,
  isOpen,
  onClose,
  onRecibir,
  onAnular,
}: CompraDetalleModalProps) {
  if (!compra) return null;

  const esRecibida = compra.estado === 'recibida';

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
            className="relative w-full max-w-2xl bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center font-bold">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                      {compra.tipo_documento.toUpperCase()} {compra.serie_numero}
                    </h3>
                    {compra.estado === 'anulada' ? (
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
                        <XCircle className="w-3 h-3" />
                        Anulada
                      </Badge>
                    ) : esRecibida ? (
                      <Badge variant="success" className="text-[10px]">Recibida en Almacén</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">Borrador</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Proveedor: <strong className="text-foreground">{compra.proveedor_nombre}</strong> (RUC {compra.proveedor_ruc})
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

            {/* Metadatos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border">
                <span className="text-muted-foreground">Emisión Proveedor</span>
                <p className="font-semibold text-foreground font-mono mt-0.5">{compra.fecha_emision}</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border">
                <span className="text-muted-foreground">Fecha de Recepción</span>
                <p className="font-semibold text-foreground font-mono mt-0.5">{compra.fecha_recepcion || 'Pendiente'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border col-span-2 sm:col-span-1">
                <span className="text-muted-foreground">Sucursal Destino</span>
                <p className="font-semibold text-foreground mt-0.5 truncate">{compra.sucursal_nombre}</p>
              </div>
            </div>

            {/* Tabla de Productos y Lotes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Ítems & Lotes Recibidos</span>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Producto & Presentación</th>
                      <th className="px-4 py-2.5">Lote / Vencimiento</th>
                      <th className="px-4 py-2.5 text-center">Cant. Recibida</th>
                      <th className="px-4 py-2.5 text-right">Costo Base</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {compra.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{it.producto_nombre}</p>
                          <span className="text-[11px] text-muted-foreground">{it.presentacion_nombre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-foreground font-medium">{it.numero_lote}</p>
                          <span className="text-[11px] text-muted-foreground font-mono">Vence: {it.fecha_vencimiento}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-foreground">{it.cantidad}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">({it.cantidad_base} un.)</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {formatMoney(it.costo_unitario_base)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {formatMoney(it.total_item)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border flex justify-between items-center text-xs">
              <div className="text-muted-foreground space-x-3">
                <span>Subtotal: <strong className="font-mono text-foreground">{formatMoney(compra.subtotal)}</strong></span>
                <span>IGV: <strong className="font-mono text-foreground">{formatMoney(compra.igv)}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground mr-2">TOTAL COMPRA:</span>
                <span className="font-mono text-lg font-bold text-[#34c759] dark:text-[#30d158]">
                  {formatMoney(compra.total)}
                </span>
              </div>
            </div>

            {/* Observación / Motivo de anulación si existe */}
            {compra.observacion && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
                <strong className="text-foreground font-medium">Observación: </strong>
                <span>{compra.observacion}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2.5">
              {compra.estado !== 'anulada' && onAnular ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onAnular(compra);
                  }}
                  className="rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 text-xs h-9"
                >
                  <Ban className="h-4 w-4 mr-1.5" />
                  Anular Factura
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs h-9">
                  Cerrar
                </Button>
                {!esRecibida && compra.estado === 'borrador' && (
                  <Link href={`/compras/${compra.id}/editar`} onClick={onClose}>
                    <Button
                      variant="outline"
                      className="rounded-xl border-[#0071e3]/30 text-[#0071e3] hover:bg-blue-500/10 text-xs h-9 font-medium"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar Borrador
                    </Button>
                  </Link>
                )}
                {!esRecibida && compra.estado !== 'anulada' && onRecibir && (
                  <Button
                    onClick={() => onRecibir(compra.id)}
                    className="rounded-xl px-4 text-xs font-semibold bg-[#34c759] hover:bg-[#28a745] text-white h-9"
                  >
                    <Boxes className="h-4 w-4 mr-1.5" />
                    Confirmar Recepción de Lotes
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
