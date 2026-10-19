'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appleSprings, formatMoney } from '@/lib/utils';
import QRCode from 'qrcode';
import type { TipoComprobante } from '@/types/database';

export interface TicketTermicoData {
  serie: string;
  numero: number;
  comprobante: string;
  tipoComprobante?: TipoComprobante | string;
  hash?: string;
  fecha: string;
  total: number;
  subtotalGravado?: number;
  subtotalExonerado?: number;
  igv?: number;
  vuelto?: number;
  metodo?: string;
  montoPagado?: number;
  clienteDoc?: string;
  clienteNombre?: string;
  cajeroNombre?: string;
  items?: Array<{
    cantidad: number;
    descripcion: string;
    presentacion?: string;
    precioUnitario: number;
    total: number;
    lote?: string;
    vencimiento?: string;
  }>;
}

interface TicketTermicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TicketTermicoData | null;
  onNuevaVenta?: () => void;
}

export function TicketTermicoModal({
  isOpen,
  onClose,
  data,
  onNuevaVenta,
}: TicketTermicoModalProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!data) return;

    // Generar contenido oficial del QR SUNAT:
    // RUC|TIPO_DOC|SERIE|NUMERO|M_IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|HASH|
    const tipoDocSunat = data.tipoComprobante === 'factura' ? '01' : '03';
    const rucEmisor = '20123456789';
    const igvStr = (data.igv || 0).toFixed(2);
    const totalStr = data.total.toFixed(2);
    const docCliTipo = (data.clienteDoc || '').length === 11 ? '6' : '1';
    const docCliNum = data.clienteDoc || '00000000';
    const hash = data.hash || 'M4h3kLp99s1Q';

    const qrText = `${rucEmisor}|${tipoDocSunat}|${data.serie}|${data.numero}|${igvStr}|${totalStr}|${data.fecha}|${docCliTipo}|${docCliNum}|${hash}|`;

    QRCode.toDataURL(qrText, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error al generar QR SUNAT:', err));
  }, [data]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        if (onNuevaVenta) onNuevaVenta();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNuevaVenta]);

  if (!isOpen || !data || !mounted || typeof document === 'undefined') return null;

  const handlePrint = () => {
    // 1. Inyectar temporalmente estilo específico para papel térmico continuo (80mm)
    let thermalStyle = document.getElementById('thermal-page-size-style');
    if (!thermalStyle) {
      thermalStyle = document.createElement('style');
      thermalStyle.id = 'thermal-page-size-style';
      thermalStyle.innerHTML = '@page { size: 80mm 297mm !important; margin: 0 !important; }';
      document.head.appendChild(thermalStyle);
    }

    // 2. Marcar body para aislar exclusivamente el ticket térmico
    document.body.classList.add('printing-thermal');

    // 3. Limpieza automática al concluir o cancelar la impresión
    const cleanup = () => {
      document.body.classList.remove('printing-thermal');
      const el = document.getElementById('thermal-page-size-style');
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // 4. Disparar impresión nativa del sistema
    window.print();

    // Fallback de seguridad en caso de que afterprint no se dispare
    setTimeout(cleanup, 2000);
  };

  const isBoleta = data.tipoComprobante === 'boleta' || data.serie.startsWith('B');
  const isFactura = data.tipoComprobante === 'factura' || data.serie.startsWith('F');
  const tipoTitulo = isFactura
    ? 'FACTURA ELECTRÓNICA'
    : isBoleta
    ? 'BOLETA DE VENTA ELECTRÓNICA'
    : 'NOTA DE VENTA';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ticket-termico-modal-root">
        {/* Backdrop no imprimible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md print:hidden"
          onClick={onClose}
        />

        {/* Modal Wrapper */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl overflow-hidden z-10 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:bg-white print:overflow-visible"
        >
          {/* Header de la ventana (oculto al imprimir) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-sidebar/50 print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
              <span className="text-sm font-semibold tracking-apple-title text-foreground">
                Comprobante Emitido
              </span>
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

          {/* Área de Visualización y Contenedor Imprimible */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/20 print:p-0 print:bg-white print:overflow-visible">
            {/* Formato Térmico 80mm */}
            <div
              id="ticket-termico-print"
              className="ticket-termico-container mx-auto w-[80mm] max-w-full bg-white text-black p-4 text-[11px] font-mono leading-tight shadow-md rounded-2xl print:shadow-none print:rounded-none print:p-2 print:w-[80mm]"
            >
              {/* Encabezado Botica */}
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-400">
                <h1 className="text-sm font-extrabold tracking-wide uppercase">
                  BOTICA SAN MARTÍN S.A.C.
                </h1>
                <p className="text-[10px]">R.U.C. 20123456789</p>
                <p className="text-[10px]">AUTORIZACIÓN SANITARIA: DIRIS-LS-04521</p>
                <p className="text-[10px]">DIR: AV. MIGUEL GRAU 450 - LIMA</p>
                <p className="text-[10px]">TELF: (01) 456-7890 · FARMACIA PERÚ</p>
              </div>

              {/* Título de Comprobante y Numeración */}
              <div className="text-center py-2 border-b border-dashed border-gray-400 space-y-0.5">
                <p className="text-xs font-bold tracking-wider">{tipoTitulo}</p>
                <p className="text-sm font-extrabold tracking-wider">
                  {data.serie}-{String(data.numero).padStart(8, '0')}
                </p>
              </div>

              {/* Metadatos de la Operación */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{data.fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAJERO:</span>
                  <span>{data.cajeroNombre || 'CARLOS RODRÍGUEZ V.'}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-bold truncate max-w-[170px] text-right">
                    {data.clienteNombre || 'CLIENTES VARIOS'}
                  </span>
                </div>
                {data.clienteDoc && (
                  <div className="flex justify-between">
                    <span>DOC. IDENT:</span>
                    <span>{data.clienteDoc}</span>
                  </div>
                )}
              </div>

              {/* Tabla de Productos Despachados */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="grid grid-cols-12 text-[10px] font-bold pb-1 border-b border-gray-300">
                  <span className="col-span-2 text-left">CANT</span>
                  <span className="col-span-6 text-left">DESCRIPCIÓN</span>
                  <span className="col-span-2 text-right">P.U</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>

                {data.items && data.items.length > 0 ? (
                  data.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5 text-[10px]">
                      <div className="grid grid-cols-12">
                        <span className="col-span-2 text-left font-bold">{it.cantidad}</span>
                        <span className="col-span-6 text-left truncate">
                          {it.descripcion} {it.presentacion ? `(${it.presentacion})` : ''}
                        </span>
                        <span className="col-span-2 text-right font-mono">
                          {it.precioUnitario.toFixed(2)}
                        </span>
                        <span className="col-span-2 text-right font-mono font-bold">
                          {it.total.toFixed(2)}
                        </span>
                      </div>
                      {/* Trazabilidad Lote & Vencimiento DIGEMID */}
                      <div className="text-[9px] text-gray-500 pl-2">
                        Lote: {it.lote || 'L-2026-A'} | Vcto: {it.vencimiento || '12/2027'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] italic py-1">Venta al mostrador</div>
                )}
              </div>

              {/* Resumen de Importes Tributarios */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>OP. GRAVADA:</span>
                  <span>S/ {(data.subtotalGravado || data.total / 1.18).toFixed(2)}</span>
                </div>
                {data.subtotalExonerado && data.subtotalExonerado > 0 ? (
                  <div className="flex justify-between">
                    <span>OP. EXONERADA:</span>
                    <span>S/ {data.subtotalExonerado.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>I.G.V. (18%):</span>
                  <span>S/ {(data.igv || data.total - data.total / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-extrabold pt-1 border-t border-gray-300">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {data.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Forma de Pago y Vuelto */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>FORMA DE PAGO:</span>
                  <span className="uppercase font-bold">{data.metodo || 'EFECTIVO'}</span>
                </div>
                {data.montoPagado && data.montoPagado > 0 ? (
                  <div className="flex justify-between">
                    <span>IMPORTE RECIBIDO:</span>
                    <span>S/ {data.montoPagado.toFixed(2)}</span>
                  </div>
                ) : null}
                {data.vuelto && data.vuelto > 0 ? (
                  <div className="flex justify-between font-bold">
                    <span>VUELTO:</span>
                    <span>S/ {data.vuelto.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>

              {/* QR SUNAT y Firma Hash */}
              <div className="pt-3 pb-1 text-center space-y-1.5 flex flex-col items-center justify-center">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR SUNAT"
                    className="h-28 w-28 mx-auto border border-gray-200 p-0.5"
                  />
                )}
                <p className="text-[9px] text-gray-600 font-mono">
                  HASH: {data.hash || 'H7D8-921A-KF99-3180'}
                </p>
                <p className="text-[8px] leading-tight text-gray-600 uppercase">
                  Representación impresa del Comprobante de Pago Electrónico.
                  <br />
                  Consulte la validez en <strong>www.sunat.gob.pe</strong>
                </p>
                <p className="text-[9px] font-bold pt-1">
                  ¡GRACIAS POR SU COMPRA!
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción (ocultos al imprimir) */}
          <div className="p-4 border-t border-border bg-sidebar/50 flex items-center justify-between gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="rounded-xl gap-2 font-medium"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir [Ctrl+P]</span>
            </Button>

            <Button
              onClick={() => {
                onClose();
                if (onNuevaVenta) onNuevaVenta();
              }}
              className="rounded-xl gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold apple-press-feedback"
            >
              <span>Nueva Venta</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
