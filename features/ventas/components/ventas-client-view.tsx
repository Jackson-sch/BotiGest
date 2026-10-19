'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Receipt,
  FileText,
  CheckCircle2,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import {
  VentasTable,
  VentaDetalleModal,
  ModalAnularVenta,
} from './index';
import { TicketTermicoModal } from '@/features/pos/components/ticket-termico-modal';
import type { VentaResumen, VentaCompleta } from '../types';

interface VentasClientViewProps {
  initialVentas: VentaCompleta[];
}

export function VentasClientView({ initialVentas }: VentasClientViewProps) {
  const [ventas, setVentas] = React.useState<VentaCompleta[]>(initialVentas);
  const [selectedVenta, setSelectedVenta] = React.useState<VentaCompleta | null>(null);
  const [ventaParaAnular, setVentaParaAnular] = React.useState<VentaResumen | null>(null);
  const [ventaParaTicket, setVentaParaTicket] = React.useState<VentaCompleta | null>(null);

  const handleAnularSuccess = (ventaId: string) => {
    setVentas((prev) =>
      prev.map((v) =>
        v.id === ventaId
          ? {
              ...v,
              estado: 'anulada',
              estado_sunat: 'anulado',
            }
          : v
      )
    );
  };

  const totalVendido = ventas
    .filter((v) => v.estado !== 'anulada')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalBoletas = ventas.filter((v) => v.tipo_comprobante === 'boleta').length;
  const totalFacturas = ventas.filter((v) => v.tipo_comprobante === 'factura').length;
  const aceptadasSunat = ventas.filter((v) => v.estado_sunat === 'aceptado').length;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
              Comprobantes & Ventas SUNAT
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
              Historial de boletas, facturas y notas de venta con trazabilidad y sincronización SUNAT.
            </p>
          </div>

          <Button asChild className="rounded-xl gap-2 font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback">
            <Link href="/pos">
              <Plus className="h-4 w-4" />
              <span>Nueva Venta en POS</span>
            </Link>
          </Button>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Facturado Hoy</span>
              <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
                {formatMoney(totalVendido)}
              </div>
              <span className="text-[11px] text-muted-foreground">{ventas.length} operaciones</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Boletas Emitidas</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {totalBoletas}
              </div>
              <span className="text-[11px] text-muted-foreground">Serie B001</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Facturas (RUC)</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {totalFacturas}
              </div>
              <span className="text-[11px] text-muted-foreground">Serie F001</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#af52de]/10 text-[#af52de] flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Aceptadas por SUNAT</span>
              <div className="text-xl font-bold font-mono text-[#34c759]">
                {aceptadasSunat} / {ventas.length}
              </div>
              <span className="text-[11px] text-muted-foreground">Outbox sincronizado</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Tabla Interactiva de Ventas */}
        <VentasTable
          ventas={ventas}
          onVerDetalle={(v) => {
            const completa = ventas.find((x) => x.id === v.id);
            setSelectedVenta(completa || null);
          }}
          onImprimirTicket={(v) => {
            const completa = ventas.find((x) => x.id === v.id);
            setVentaParaTicket(completa || null);
          }}
          onAnular={(v) => setVentaParaAnular(v)}
        />

        {/* Modal de Detalle */}
        <VentaDetalleModal
          venta={selectedVenta}
          isOpen={!!selectedVenta}
          onClose={() => setSelectedVenta(null)}
        />

        {/* Modal de Reimpresión Directa de Ticket */}
        {ventaParaTicket && (
          <TicketTermicoModal
            isOpen={!!ventaParaTicket}
            onClose={() => setVentaParaTicket(null)}
            data={{
              serie: ventaParaTicket.serie,
              numero: ventaParaTicket.numero,
              comprobante: ventaParaTicket.correlativo,
              tipoComprobante: ventaParaTicket.tipo_comprobante,
              hash: ventaParaTicket.comprobante_electronico?.hash || 'H9d2-381a-881c',
              fecha: ventaParaTicket.fecha_emision,
              total: ventaParaTicket.total,
              subtotalGravado: ventaParaTicket.total - ventaParaTicket.igv,
              igv: ventaParaTicket.igv,
              clienteDoc: ventaParaTicket.cliente_documento || undefined,
              clienteNombre: ventaParaTicket.cliente_nombre,
              cajeroNombre: 'CARLOS RODRÍGUEZ V.',
              metodo: ventaParaTicket.pagos[0]?.metodo || 'efectivo',
              items: ventaParaTicket.items.map((it) => ({
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

        {/* Modal de Anulación */}
        <ModalAnularVenta
          venta={ventaParaAnular}
          isOpen={!!ventaParaAnular}
          onClose={() => setVentaParaAnular(null)}
          onSuccess={handleAnularSuccess}
        />
      </main>
  );
}
