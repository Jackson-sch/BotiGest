'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appleSprings, formatMoney } from '@/lib/utils';
import { SunatBadge } from './sunat-badge';
import type { VentaCompleta } from '../types';
import { TicketTermicoModal, type TicketTermicoData } from '@/features/pos/components/ticket-termico-modal';

interface VentaDetalleModalProps {
  venta: VentaCompleta | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VentaDetalleModal({ venta, isOpen, onClose }: VentaDetalleModalProps) {
  const [showTicketTermico, setShowTicketTermico] = React.useState(false);

  if (!venta) return null;

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
            className="relative w-full max-w-2xl bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header del Comprobante */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                      {venta.tipo_comprobante.toUpperCase()} {venta.correlativo}
                    </h3>
                    <SunatBadge estado={venta.estado_sunat} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Emitido el {venta.fecha_emision} · {venta.caja_nombre}
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

            {/* Datos del Cliente y Métodos de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border space-y-1">
                <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                  <User className="h-3 w-3" /> Datos del Cliente
                </span>
                <p className="font-semibold text-foreground">{venta.cliente_nombre}</p>
                <p className="font-mono text-muted-foreground">{venta.cliente_documento || 'Sin Documento'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border space-y-1">
                <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                  <CreditCard className="h-3 w-3" /> Pago & Vendedor
                </span>
                <div className="flex justify-between">
                  <span className="capitalize">{venta.pagos[0]?.metodo || 'Efectivo'}</span>
                  <span className="font-mono font-bold text-foreground">{formatMoney(venta.total)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Atendido por: {venta.vendedor_nombre}</p>
              </div>
            </div>

            {/* Receta Médica Asociada si corresponde */}
            {venta.receta && (
              <div className="p-3.5 rounded-2xl bg-[#af52de]/10 border border-[#af52de]/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#af52de] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Receta Médica DIGEMID
                  </span>
                  <Badge variant="purple" className="text-[10px]">
                    {venta.receta.retenida ? 'Retenida en Botica' : 'Receta Simple'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                  <div>Médico: <strong className="text-foreground">{venta.receta.medico_nombre}</strong> (CMP {venta.receta.medico_cmp})</div>
                  <div>Paciente: <strong className="text-foreground">{venta.receta.paciente_nombre}</strong></div>
                </div>
              </div>
            )}

            {/* Detalle de Ítems y Trazabilidad por Lote */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Ítems & Despacho por Lote</span>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Descripción & Lote Salida</th>
                      <th className="px-4 py-2.5 text-center">Cant.</th>
                      <th className="px-4 py-2.5 text-right">P. Unit</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {venta.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{item.producto_nombre}</span>
                            <span className="text-[11px] text-muted-foreground">{item.presentacion}</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.lotes_despachados.map((l) => (
                                <span
                                  key={l.lote_id}
                                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground"
                                >
                                  Lote: {l.numero_lote} ({l.cantidad_base} un.)
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {formatMoney(item.precio_unitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {formatMoney(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales y SUNAT */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-border">
              {venta.comprobante_electronico?.hash ? (
                <div className="text-[11px] text-muted-foreground font-mono">
                  Hash CDR: <span className="text-foreground">{venta.comprobante_electronico.hash.slice(0, 18)}...</span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  Comprobante sincronizado con la API SUNAT.
                </div>
              )}

              <div className="text-right space-y-1">
                <span className="text-xs text-muted-foreground mr-3">TOTAL:</span>
                <span className="font-mono text-xl font-bold text-[#0071e3] dark:text-[#2997ff]">
                  {formatMoney(venta.total)}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={onClose} className="rounded-xl">
                Cerrar
              </Button>
              <Button
                variant="glass"
                onClick={() => setShowTicketTermico(true)}
                className="rounded-xl gap-2 font-medium"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Ticket Térmico</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Visor Térmico Oficial SUNAT 80mm */}
      {showTicketTermico && (
        <TicketTermicoModal
          isOpen={showTicketTermico}
          onClose={() => setShowTicketTermico(false)}
          data={{
            serie: venta.serie,
            numero: venta.numero,
            comprobante: venta.correlativo,
            tipoComprobante: venta.tipo_comprobante,
            hash: venta.comprobante_electronico?.hash || 'H9d2-381a-881c',
            fecha: venta.fecha_emision,
            total: venta.total,
            subtotalGravado: venta.total - venta.igv,
            igv: venta.igv,
            clienteDoc: venta.cliente_documento || undefined,
            clienteNombre: venta.cliente_nombre,
            cajeroNombre: 'CARLOS RODRÍGUEZ V.',
            metodo: venta.pagos[0]?.metodo || 'efectivo',
            items: venta.items.map((it) => ({
              cantidad: it.cantidad,
              descripcion: it.producto_nombre,
              presentacion: it.presentacion,
              precioUnitario: it.precio_unitario,
              total: it.total,
              lote: it.lotes_despachados[0]?.numero_lote || 'L-2026-A',
              vencimiento: '12/2027',
            })),
          }}
        />
      )}
    </AnimatePresence>
  );
}
