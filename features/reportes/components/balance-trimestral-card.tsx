'use client';

import * as React from 'react';
import {
  FileCheck,
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
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentTrimestre = Math.ceil(currentMonth / 3);

  const handleImprimir = () => {
    window.print();
  };

  const handleDescargarExcel = async () => {
    if (items.length === 0) {
      toast.error('No hay movimientos en el libro de controlados');
      return;
    }
    try {
      const qfName = user?.nombreCompleto ? `Q.F. ${user.nombreCompleto}` : 'Q.F. Director Técnico Responsable';
      await exportBalancePsicotropicosToExcel(items, currentTrimestre, currentYear, qfName);
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
    <div className="space-y-4">
      {/* Banner DIRIS / DIGEMID (Oculto al imprimir) */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
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

      {/* =========================================================================
          ENCABEZADO OFICIAL IMPRESO DIGEMID / MINSA (SÓLO IMPRESIÓN A4)
          ========================================================================= */}
      <div className="hidden print:block text-black bg-white space-y-3 pb-3 border-b-2 border-black">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h1 className="text-sm font-extrabold uppercase tracking-wide">
              MINISTERIO DE SALUD · DIGEMID / DIRIS LIMA SUR
            </h1>
            <p className="text-xs font-bold text-gray-800">
              DECLARACIÓN JURADA · BALANCE TRIMESTRAL DE ESTUPEFACIENTES Y PSICOTRÓPICOS
            </p>
            <p className="text-[10px] text-gray-600">
              Base Legal: Decreto Supremo Nº 023-2001-SA (Reglamento de Estupefacientes, Psicotrópicos y Sustancias Sujetas a Fiscalización)
            </p>
          </div>
          <div className="text-right border border-black p-2 rounded text-[10px]">
            <p className="font-bold">FORMATO OFICIAL BALANCE</p>
            <p>TRIMESTRE: {currentTrimestre} - AÑO {currentYear}</p>
            <p>EMISIÓN: {new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-black p-2.5 text-[10px] bg-gray-50">
          <div>
            <p><strong>Establecimiento:</strong> BOTICA SAN MARTÍN S.A.C.</p>
            <p><strong>R.U.C.:</strong> 20123456789</p>
            <p><strong>Autorización Sanitaria:</strong> DIRIS-LS-04521</p>
          </div>
          <div>
            <p><strong>Dirección:</strong> Av. Miguel Grau 450 - Lima</p>
            <p><strong>Director Técnico:</strong> {user?.nombreCompleto ? `Q.F. ${user.nombreCompleto}` : 'Químico Farmacéutico Regente'}</p>
            <p><strong>Período Auditado:</strong> Trimestre {currentTrimestre} ({currentYear})</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border/50 bg-sidebar/50 backdrop-blur-xl print:border-none print:shadow-none print:bg-white print:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs print:text-[10px] print:border print:border-black">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium print:bg-gray-100 print:text-black print:border-b print:border-black">
                <th className="py-3 px-4 print:py-1.5 print:px-2 print:border-r print:border-black">Fármaco Fiscalizado</th>
                <th className="py-3 px-4 print:py-1.5 print:px-2 print:border-r print:border-black">DCI & Concentración</th>
                <th className="py-3 px-4 text-center print:py-1.5 print:px-2 print:border-r print:border-black">Saldo Inicial</th>
                <th className="py-3 px-4 text-center text-emerald-400 print:text-black print:font-bold print:py-1.5 print:px-2 print:border-r print:border-black">(+) Ingresos</th>
                <th className="py-3 px-4 text-center text-blue-400 print:text-black print:font-bold print:py-1.5 print:px-2 print:border-r print:border-black">(-) Dispensación</th>
                <th className="py-3 px-4 text-center text-rose-400 print:text-black print:font-bold print:py-1.5 print:px-2 print:border-r print:border-black">(-) Mermas/Bajas</th>
                <th className="py-3 px-4 text-center font-bold text-foreground print:text-black print:font-extrabold print:py-1.5 print:px-2">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 print:divide-y print:divide-black">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground print:py-4 print:text-black">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30 print:hidden" />
                    No hay productos controlados registrados en este período.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.producto_id} className="hover:bg-muted/20 transition-colors print:hover:bg-transparent page-break-avoid">
                    <td className="py-3 px-4 font-semibold text-foreground print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      {item.nombre_comercial}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      {item.nombre_generico || 'N/A'}{' '}
                      {item.concentracion ? `· ${item.concentracion}` : ''}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      {item.saldo_inicial}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-emerald-400 print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      +{item.entradas_compras}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-blue-400 print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      -{item.salidas_recetas}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-rose-400 print:text-black print:py-1.5 print:px-2 print:border-r print:border-black">
                      -{item.bajas_mermas}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-foreground text-sm print:text-black print:py-1.5 print:px-2">
                      {item.saldo_final}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Firma Químico Farmacéutico para Impresión */}
        <div className="p-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground print:border-t-2 print:border-black print:p-4 print:text-black page-break-avoid">
          <div className="space-y-1">
            <p className="font-semibold text-foreground print:text-black uppercase">DECLARACIÓN JURADA SANITARIA</p>
            <p className="text-[11px] print:text-[10px] text-muted-foreground print:text-gray-700 max-w-lg">
              Declaro bajo juramento que los movimientos y saldos físicos consignados en el presente balance trimestral coinciden estrictamente con las recetas médicas archivadas y los comprobantes de ingreso por droguerías autorizadas.
            </p>
          </div>
          <div className="text-center min-w-[240px] border-t border-dashed border-border/80 print:border-t print:border-black pt-4 space-y-1">
            <div className="h-10 print:block" />
            <span className="block font-bold text-foreground print:text-black text-xs">
              {user?.nombreCompleto ? `Q.F. ${user.nombreCompleto}` : 'Químico Farmacéutico Director Técnico'}
            </span>
            <span className="text-[10px] print:text-[9px] text-muted-foreground print:text-gray-700 block">
              Director Técnico · C.Q.F.P. Nº ____________
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
