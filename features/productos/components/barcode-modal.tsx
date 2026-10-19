'use client';

import * as React from 'react';
import {
  Printer,
  Barcode as BarcodeIcon,
  X,
  Copy,
  Check,
  Smartphone,
  Eye,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ProductoItem } from '../types';
import JsBarcode from 'jsbarcode';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoItem | null;
}

function BarcodeSvg({ value }: { value: string }) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.6,
          height: 44,
          displayValue: true,
          font: 'monospace',
          fontSize: 12,
          textMargin: 2,
          margin: 6,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Error al generar código de barras:', e);
      }
    }
  }, [value]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto rounded" />;
}

export function BarcodeModal({ isOpen, onClose, producto }: BarcodeModalProps) {
  const [selectedPresId, setSelectedPresId] = React.useState<string>('todas');
  const [cantidadCopias, setCantidadCopias] = React.useState<number>(1);
  const [formatoImpresion, setFormatoImpresion] = React.useState<'termica' | 'a4'>('termica');
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  // Reiniciar estados cuando cambia el producto
  React.useEffect(() => {
    if (producto) {
      setSelectedPresId('todas');
      setCantidadCopias(1);
    }
  }, [producto]);

  if (!isOpen || !producto) return null;

  // Filtrar presentaciones con código de barras o generar con código interno si no tiene
  const presentaciones = producto.presentaciones.map((pr) => ({
    ...pr,
    codigoFinal: pr.codigo_barras || producto.codigo_interno,
  }));

  const presentacionesAImprimir =
    selectedPresId === 'todas'
      ? presentaciones
      : presentaciones.filter((pr) => (pr.id || pr.nombre) === selectedPresId);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Código ${code} copiado al portapapeles`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Estilos específicos para impresión de etiquetas */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-barcode-area,
          #printable-barcode-area * {
            visibility: visible !important;
          }
          #printable-barcode-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .barcode-label-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px dashed #ccc !important;
            margin: 4px !important;
            padding: 6px !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-slate-50 dark:bg-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BarcodeIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Imprimir Etiquetas de Código de Barras</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {producto.nombre_comercial} · Cod: {producto.codigo_interno}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Banner de ayuda para pruebas móviles */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3 text-xs text-blue-600 dark:text-blue-400">
            <Smartphone className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">¿Haciendo pruebas con el celular?</strong>
              <span>
                Puedes apuntar la cámara de tu móvil directamente a los códigos de barras que ves en esta pantalla
                usando la app <strong>Barcode to PC</strong>, o imprimir las etiquetas en papel para probar con cajas reales.
              </span>
            </div>
          </div>

          {/* Opciones de Configuración */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60">
            {/* Presentación */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Presentación
              </label>
              <select
                value={selectedPresId}
                onChange={(e) => setSelectedPresId(e.target.value)}
                className="w-full h-9 text-xs rounded-xl border border-border/80 bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="todas">Todas las presentaciones ({presentaciones.length})</option>
                {presentaciones.map((pr) => (
                  <option key={pr.id || pr.nombre} value={pr.id || pr.nombre}>
                    {pr.nombre} (S/ {pr.precio_venta.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad de Etiquetas por Presentación */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Copias por etiqueta
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCantidadCopias(num)}
                    className={`h-9 flex-1 text-xs rounded-xl border font-medium transition-all ${
                      cantidadCopias === num
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border/70'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Formato de Impresión */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Formato de Papel
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormatoImpresion('termica')}
                  className={`h-9 flex-1 text-xs rounded-xl border font-medium transition-all ${
                    formatoImpresion === 'termica'
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border/70'
                  }`}
                >
                  Térmica (Rollo)
                </button>
                <button
                  type="button"
                  onClick={() => setFormatoImpresion('a4')}
                  className={`h-9 flex-1 text-xs rounded-xl border font-medium transition-all ${
                    formatoImpresion === 'a4'
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border/70'
                  }`}
                >
                  Hoja A4
                </button>
              </div>
            </div>
          </div>

          {/* Vista Previa de las Etiquetas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Vista Previa de Etiquetas ({presentacionesAImprimir.length * cantidadCopias} en total)</span>
              </span>
              <span>Listo para escanear en pantalla o imprimir</span>
            </div>

            <div
              id="printable-barcode-area"
              className={`p-4 rounded-2xl bg-muted/30 border border-border/60 ${
                formatoImpresion === 'a4'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
                  : 'flex flex-wrap gap-3 justify-center'
              }`}
            >
              {presentacionesAImprimir.map((pr) => {
                const copies = Array.from({ length: cantidadCopias }, (_, i) => i);
                return copies.map((idx) => (
                  <div
                    key={`${pr.id || pr.nombre}-${idx}`}
                    className="barcode-label-card w-[220px] bg-white text-black p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-between text-center select-none"
                    style={{ minHeight: '135px' }}
                  >
                    {/* Encabezado de la etiqueta */}
                    <div className="w-full text-left border-b border-slate-200 pb-1 mb-1">
                      <p className="font-bold text-[11px] leading-tight text-slate-900 truncate">
                        {producto.nombre_comercial}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-600 mt-0.5">
                        <span className="truncate">{pr.nombre}</span>
                        <strong className="text-slate-900 font-mono">
                          S/ {pr.precio_venta.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Código de barras visual */}
                    <div className="py-0.5 w-full bg-white flex justify-center">
                      <BarcodeSvg value={pr.codigoFinal} />
                    </div>

                    {/* Botón rápido de copiar al portapapeles (oculto en impresión) */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(pr.codigoFinal)}
                      className="print:hidden mt-1 text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar código para pruebas"
                    >
                      {copiedCode === pr.codigoFinal ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar: {pr.codigoFinal}</span>
                        </>
                      )}
                    </button>
                  </div>
                ));
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-slate-50 dark:bg-[#1a1a1d] flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Total:{' '}
            <strong className="text-foreground">
              {presentacionesAImprimir.length * cantidadCopias} etiqueta(s)
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Etiquetas</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
