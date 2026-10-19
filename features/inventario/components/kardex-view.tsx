'use client';

import * as React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';
import {
  exportKardexValorizadoToExcel,
  exportPleKardex131ToTXT,
} from '@/lib/excel-export';
import type { MovimientoKardex } from '../types';

interface KardexViewProps {
  movimientos: MovimientoKardex[];
}

export function KardexView({ movimientos }: KardexViewProps) {
  const [filtro, setFiltro] = React.useState('');
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [isExportingTxt, setIsExportingTxt] = React.useState(false);

  const filtrados = React.useMemo(() => {
    return movimientos.filter(
      (m) =>
        m.producto_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        m.numero_lote.toLowerCase().includes(filtro.toLowerCase()) ||
        m.tipo.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [movimientos, filtro]);

  const handleExportarExcel = async () => {
    if (filtrados.length === 0) {
      toast.error('No hay movimientos en el Kardex para exportar.');
      return;
    }
    setIsExportingExcel(true);
    try {
      await exportKardexValorizadoToExcel(filtrados);
      toast.success(`Kardex Valorizado exportado exitosamente (${filtrados.length} asientos).`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al exportar Kardex a Excel: ' + (err.message || ''));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportarPleTxt = () => {
    if (filtrados.length === 0) {
      toast.error('No hay movimientos en el Kardex para exportar.');
      return;
    }
    setIsExportingTxt(true);
    try {
      exportPleKardex131ToTXT(filtrados);
      toast.success(
        `Libro PLE 13.1 generado para validador SUNAT (${filtrados.length} registros).`
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Error al generar PLE 13.1 TXT: ' + (err.message || ''));
    } finally {
      setIsExportingTxt(false);
    }
  };

  const renderBadgeTipo = (tipo: string) => {
    switch (tipo) {
      case 'compra':
        return <Badge variant="success">Compra (+)</Badge>;
      case 'venta':
        return <Badge variant="secondary">Venta (-)</Badge>;
      case 'ajuste_positivo':
        return <Badge variant="default">Ajuste (+)</Badge>;
      case 'ajuste_negativo':
        return <Badge variant="warning">Ajuste (-)</Badge>;
      case 'merma':
      case 'vencimiento':
        return <Badge variant="destructive">Baja / Merma</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Exportación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar movimientos por producto o lote..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExportingExcel || isExportingTxt}
              className="rounded-xl gap-2 font-medium border-border/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
            >
              {isExportingExcel || isExportingTxt ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-[#34c759]" />
              )}
              <span>Exportar PLE / Kardex</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-1.5 shadow-2xl z-50"
          >
            <DropdownMenuItem
              onClick={handleExportarExcel}
              className="rounded-xl cursor-pointer py-2.5 px-3 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-[#1f1f23] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-foreground">Kardex Valorizado (.xlsx)</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Formato SUNAT con Entradas, Salidas y Saldos valorizados
                </p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleExportarPleTxt}
              className="rounded-xl cursor-pointer py-2.5 px-3 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-[#1f1f23] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-foreground">Libro SUNAT PLE 13.1 (.txt)</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Estructura oficial de 26 campos para el validador PLE SUNAT
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabla Kardex Inmutable */}
      <Card className="overflow-hidden p-0 border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Fecha & Hora</th>
                <th className="px-5 py-3.5">Operación</th>
                <th className="px-5 py-3.5">Producto & Lote</th>
                <th className="px-5 py-3.5 text-right">Movimiento</th>
                <th className="px-5 py-3.5 text-right">Costo Unit. (Base)</th>
                <th className="px-5 py-3.5 text-right">Saldo Posterior</th>
                <th className="px-5 py-3.5">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    No hay registros de kardex que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                filtrados.map((m) => {
                  const esEntrada = m.cantidad_base > 0;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        {m.fecha}
                      </td>

                      <td className="px-5 py-3.5">
                        {renderBadgeTipo(m.tipo)}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {m.producto_nombre}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Lote: {m.numero_lote}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            esEntrada
                              ? 'text-[#248a3d] dark:text-[#30d158]'
                              : 'text-foreground'
                          }`}
                        >
                          {esEntrada ? '+' : ''}
                          {m.cantidad_base}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                        {formatMoney(m.costo_unitario)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                        {m.saldo_lote_posterior}
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground text-[11px]">
                        {m.usuario_nombre}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
