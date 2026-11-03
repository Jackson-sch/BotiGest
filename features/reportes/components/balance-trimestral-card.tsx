'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  FileSpreadsheet,
  Award,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { exportBalancePsicotropicosToExcel } from '@/lib/excel-export';
import type { BalanceTrimestralItem } from '../types';

interface BalanceTrimestralCardProps {
  items: BalanceTrimestralItem[];
}

export function BalanceTrimestralCard({ items }: BalanceTrimestralCardProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentTrimestre = Math.ceil(currentMonth / 3);

  const qfNombre = user?.nombreCompleto
    ? `Q.F. ${user.nombreCompleto}`
    : 'Q.F. Administrador General';

  React.useEffect(() => {
    setMounted(true);

    const handleBeforePrint = () => {
      document.body.classList.add('printing-balance-trimestral');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-balance-trimestral');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleImprimir = () => {
    document.body.classList.add('printing-balance-trimestral');
    const cleanup = () => {
      document.body.classList.remove('printing-balance-trimestral');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2500);
  };

  const handleDescargarExcel = async () => {
    if (items.length === 0) {
      toast.error('No hay movimientos en el libro de controlados');
      return;
    }
    try {
      await exportBalancePsicotropicosToExcel(items, currentTrimestre, currentYear, qfNombre);
      toast.success('Balance trimestral exportado en Excel (.xlsx) con formato DIGEMID.');
    } catch (err: any) {
      toast.error('Error al generar Excel: ' + (err.message || ''));
    }
  };

  const handleDescargarCsv = () => {
    if (items.length === 0) {
      toast.error('No hay movimientos en el libro de controlados');
      return;
    }

    const headers = [
      'Producto',
      'DCI',
      'Concentración',
      'Unidad Base',
      'Saldo Inicial',
      'Entradas Compras',
      'Salidas Recetas',
      'Bajas Mermas',
      'Saldo Final',
    ];

    const rows = items.map((it) => [
      `"${it.nombre_comercial}"`,
      `"${it.nombre_generico || ''}"`,
      `"${it.concentracion || ''}"`,
      it.unidad_base,
      it.saldo_inicial,
      it.entradas_compras,
      it.salidas_recetas,
      it.bajas_mermas,
      it.saldo_final,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BALANCE_TRIMESTRAL_CONTROLADOS_T${currentTrimestre}_${currentYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Balance trimestral exportado en formato CSV.');
  };

  return (
    <>
      {/* =========================================================================
          1. VISTA EN PANTALLA (DASHBOARD INTERACTIVO - OCULTO EN IMPRESIÓN)
          ========================================================================= */}
      <div className="space-y-4 print:hidden">
        {/* Banner DIRIS / DIGEMID */}
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Balance Trimestral Oficial de Sustancias Controladas
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  D.S. 023-2001-SA · Trimestre {currentTrimestre} - {currentYear}
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Declaración jurada trimestral para la Dirección de Redes Integradas de Salud (DIRIS / DIRESA).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleImprimir}
              className="h-9 px-3 text-xs rounded-xl gap-1.5 apple-press-feedback"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={handleDescargarCsv}
              className="h-9 px-3 text-xs rounded-xl border-border/60 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              CSV
            </Button>
            <Button
              onClick={handleDescargarExcel}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* Tabla en pantalla */}
        <Card className="overflow-hidden border-border/50 bg-sidebar/50 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Fármaco Fiscalizado</th>
                  <th className="py-3 px-4">DCI & Concentración</th>
                  <th className="py-3 px-4 text-center">Saldo Inicial</th>
                  <th className="py-3 px-4 text-center text-emerald-400">(+) Ingresos</th>
                  <th className="py-3 px-4 text-center text-blue-400">(-) Dispensación</th>
                  <th className="py-3 px-4 text-center text-rose-400">(-) Mermas/Bajas</th>
                  <th className="py-3 px-4 text-center font-bold text-foreground">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No hay productos controlados registrados en este período.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.producto_id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {item.nombre_comercial}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.nombre_generico || 'N/A'}{' '}
                        {item.concentracion ? `· ${item.concentracion}` : ''}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {item.saldo_inicial}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-emerald-400">
                        +{item.entradas_compras}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-blue-400">
                        -{item.salidas_recetas}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-rose-400">
                        -{item.bajas_mermas}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground text-sm">
                        {item.saldo_final}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border/30 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs text-muted-foreground">
            <div className="space-y-1 max-w-lg">
              <p className="font-semibold text-foreground uppercase">DECLARACIÓN JURADA SANITARIA</p>
              <p className="text-[11px] text-muted-foreground">
                Declaro bajo juramento que los movimientos y saldos físicos consignados en el presente balance trimestral coinciden estrictamente con las recetas médicas archivadas y los comprobantes de ingreso por droguerías autorizadas.
              </p>
            </div>
            <div className="flex flex-col items-center justify-end shrink-0 sm:self-end">
              {/* Espacio para sello y rúbrica física */}
              <div className="h-10" />
              <div className="w-56 border-t border-border/80 dark:border-white/30 pt-1.5 text-center">
                <span className="block font-bold text-foreground text-xs leading-tight">
                  {qfNombre}
                </span>
                <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">
                  Director Técnico · C.Q.F.P. Nº ____________
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          2. DOCUMENTO OFICIAL PARA IMPRESIÓN A4 DIGEMID / DIRIS
             (AISLADO MEDIANTE PORTAL - INMUNE A FONDOS OSCUROS)
          ========================================================================= */}
      {mounted &&
        createPortal(
          <div
            id="print-balance-trimestral-root"
            className="text-black bg-white font-sans text-[10px] leading-tight p-6 max-w-4xl mx-auto"
          >
            {/* Encabezado Oficial DIGEMID / MINSA */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <h1 className="text-sm font-extrabold uppercase tracking-wide text-black">
                    MINISTERIO DE SALUD · DIGEMID / DIRIS LIMA SUR
                  </h1>
                  <p className="text-xs font-bold text-gray-900">
                    DECLARACIÓN JURADA · BALANCE TRIMESTRAL DE ESTUPEFACIENTES Y PSICOTRÓPICOS
                  </p>
                  <p className="text-[9.5px] text-gray-700">
                    Base Legal: Decreto Supremo Nº 023-2001-SA (Reglamento de Estupefacientes, Psicotrópicos y Sustancias Sujetas a Fiscalización)
                  </p>
                </div>
                <div className="text-right border border-black p-2 rounded text-[10px] bg-white shrink-0">
                  <p className="font-bold text-black">FORMATO OFICIAL BALANCE</p>
                  <p className="text-gray-900">TRIMESTRE: {currentTrimestre} - AÑO {currentYear}</p>
                  <p className="text-gray-900">EMISIÓN: {new Date().toLocaleDateString('es-PE')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-black p-2.5 text-[10px] bg-gray-50 mt-3 text-black">
                <div>
                  <p><strong className="text-black">Establecimiento:</strong> BOTICA SAN MARTÍN S.A.C.</p>
                  <p><strong className="text-black">R.U.C.:</strong> 20123456789</p>
                  <p><strong className="text-black">Autorización Sanitaria:</strong> DIRIS-LS-04521</p>
                </div>
                <div>
                  <p><strong className="text-black">Dirección:</strong> Av. Miguel Grau 450 - Lima</p>
                  <p><strong className="text-black">Director Técnico:</strong> {qfNombre}</p>
                  <p><strong className="text-black">Período Auditado:</strong> Trimestre {currentTrimestre} ({currentYear})</p>
                </div>
              </div>
            </div>

            {/* Tabla Oficial de Balance */}
            <table className="w-full text-left border-collapse border border-black text-[9.5px] mb-4">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black font-bold">
                  <th className="p-2 border border-black">Fármaco Fiscalizado</th>
                  <th className="p-2 border border-black">DCI & Concentración</th>
                  <th className="p-2 text-center border border-black">Saldo Inicial</th>
                  <th className="p-2 text-center border border-black">(+) Ingresos</th>
                  <th className="p-2 text-center border border-black">(-) Dispensación</th>
                  <th className="p-2 text-center border border-black">(-) Mermas/Bajas</th>
                  <th className="p-2 text-center border border-black font-extrabold">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-700 italic border border-black">
                      No hay productos controlados registrados en este período.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.producto_id}
                      className={`border-b border-black ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <td className="p-2 font-bold text-black border border-black">
                        {item.nombre_comercial}
                      </td>
                      <td className="p-2 text-gray-800 border border-black">
                        {item.nombre_generico || 'N/A'}
                        {item.concentracion ? ` · ${item.concentracion}` : ''}
                      </td>
                      <td className="p-2 text-center font-mono text-black border border-black">
                        {item.saldo_inicial}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-black border border-black">
                        +{item.entradas_compras}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-black border border-black">
                        -{item.salidas_recetas}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-black border border-black">
                        -{item.bajas_mermas}
                      </td>
                      <td className="p-2 text-center font-mono font-extrabold text-black border border-black">
                        {item.saldo_final}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Declaración Jurada Sanitaria y Firma Q.F. */}
            <div
              className="border border-black p-4 bg-gray-50 flex justify-between items-end gap-6 text-[10px] text-black"
              style={{ pageBreakInside: 'avoid' }}
            >
              <div className="space-y-1 max-w-md">
                <p className="font-extrabold text-black uppercase">DECLARACIÓN JURADA SANITARIA</p>
                <p className="text-[9.5px] text-gray-800 leading-normal">
                  Declaro bajo juramento que los movimientos y saldos físicos consignados en el presente balance trimestral coinciden estrictamente con las recetas médicas archivadas y los comprobantes de ingreso por droguerías autorizadas.
                </p>
                <p className="text-[8.5px] text-gray-600 mt-2">
                  Generado automáticamente por BotiGest · Conforme a D.S. N° 023-2001-SA (MINSA/DIGEMID).
                </p>
              </div>

              <div className="flex flex-col items-center justify-end shrink-0">
                {/* Espacio físico para rúbrica y sello del Químico Farmacéutico */}
                <div className="h-12" />
                <div className="w-56 border-t border-black pt-1.5 text-center">
                  <span className="block font-bold text-black text-[10.5px] leading-tight">
                    {qfNombre}
                  </span>
                  <span className="text-[9px] text-gray-800 block leading-tight mt-0.5">
                    Director Técnico · C.Q.F.P. Nº ____________
                  </span>
                  <span className="text-[8px] text-gray-500 block italic leading-tight mt-0.5">
                    Firma y Sello Oficial
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
