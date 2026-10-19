'use client';

import * as React from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { RegistroLibroControlado } from '../types';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { exportLibroControladosToExcel, exportLibroControladosToCSV } from '@/lib/excel-export';
import { toast } from 'sonner';

interface LibroTableProps {
  asientos: RegistroLibroControlado[];
  onFirmarAsiento: (asiento: RegistroLibroControlado) => void;
  directorTecnico?: string;
  cqfp?: string;
}

export function LibroTable({
  asientos,
  onFirmarAsiento,
  directorTecnico,
  cqfp,
}: LibroTableProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportExcel = async () => {
    if (!asientos || asientos.length === 0) {
      toast.error('No hay asientos registrados para exportar.');
      return;
    }
    setIsExporting(true);
    try {
      await exportLibroControladosToExcel(
        asientos,
        directorTecnico || 'Q.F. Alejandro Morales Reyes',
        cqfp || 'CQFP 18452',
        'Botica San Martín - RUC 20601234567'
      );
      toast.success('Libro Oficial de Controlados exportado a Excel exitosamente.');
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      toast.error('Ocurrió un error al generar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!asientos || asientos.length === 0) {
      toast.error('No hay asientos registrados para exportar.');
      return;
    }
    try {
      exportLibroControladosToCSV(asientos);
      toast.success('Asientos exportados a CSV exitosamente.');
    } catch (err) {
      console.error('Error al exportar a CSV:', err);
      toast.error('Ocurrió un error al generar el archivo CSV.');
    }
  };

  const handlePrint = () => {
    if (!asientos || asientos.length === 0) {
      toast.error('No hay asientos registrados para exportar o imprimir.');
      return;
    }

    // 1. Inyectar regla @page para forzar formato A4 Horizontal (Landscape)
    let printStyle = document.getElementById('controlados-print-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'controlados-print-style';
      printStyle.innerHTML = `
        @page {
          size: A4 landscape !important;
          margin: 6mm 8mm !important;
        }
      `;
      document.head.appendChild(printStyle);
    }

    // 2. Marcar body para aislar exclusivamente el documento oficial
    document.body.classList.add('printing-controlados');

    const cleanup = () => {
      document.body.classList.remove('printing-controlados');
      const el = document.getElementById('controlados-print-style');
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // 3. Abrir diálogo de impresión / Guardar como PDF
    window.print();

    // 4. Fallback de seguridad
    setTimeout(cleanup, 2000);
  };
  const columns = React.useMemo<ColumnDef<RegistroLibroControlado>[]>(
    () => [
      {
        accessorKey: 'fecha',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.fecha}
          </span>
        ),
      },
      {
        accessorKey: 'producto_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Medicamento & Lote" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.producto_nombre}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Lote: {row.original.numero_lote} · Vto: {row.original.fecha_vencimiento}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'tipo_movimiento',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Operación" />
        ),
        cell: ({ row }) => (
          <span className="capitalize font-medium text-foreground text-xs">
            {row.original.tipo_movimiento}
          </span>
        ),
      },
      {
        id: 'receta',
        header: () => <span>Receta / Paciente</span>,
        cell: ({ row }) => {
          const item = row.original;
          return item.receta ? (
            <div className="flex flex-col text-[11px]">
              <span className="font-semibold text-foreground">
                {item.receta.paciente_nombre}
              </span>
              <span className="text-muted-foreground">
                CMP: {item.receta.medico_cmp} · Receta: {item.receta.numero_receta}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">Sin receta (Ingreso)</span>
          );
        },
      },
      {
        accessorKey: 'cantidad_base',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Movimiento" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => {
          const esEntrada = row.original.cantidad_base > 0;
          return (
            <div className="text-right font-mono font-bold">
              <span
                className={
                  esEntrada
                    ? 'text-[#248a3d] dark:text-[#30d158]'
                    : 'text-foreground'
                }
              >
                {esEntrada ? '+' : ''}
                {row.original.cantidad_base}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'saldo_posterior',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Saldo" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-foreground">
            {row.original.saldo_posterior}
          </div>
        ),
      },
      {
        id: 'acciones',
        header: () => <div className="text-center">Firma QF</div>,
        cell: ({ row }) => {
          const item = row.original;
          const estaValidado = !!item.validado_por;
          return (
            <div className="flex justify-center">
              {estaValidado ? (
                <Badge variant="success" className="gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{item.cqfp_validador || 'QF Firmado'}</span>
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFirmarAsiento(item)}
                  className="rounded-lg h-7 px-2 text-xs border-[#af52de]/40 text-[#af52de] hover:bg-[#af52de]/10"
                >
                  Firmar (QF)
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onFirmarAsiento]
  );

  return (
    <div className="space-y-4">
      {/* TanStack DataTable Oficial Inmutable */}
      <DataTable
        columns={columns}
        data={asientos}
        searchPlaceholder="Buscar por sustancia, paciente o N° receta..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron asientos en el libro de controlados."
        toolbarContent={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="glass"
                size="sm"
                disabled={isExporting}
                className="h-9 px-3 text-xs rounded-xl gap-2 font-medium border border-border/80 shadow-sm hover:border-[#af52de]/50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#af52de]" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#af52de]" />
                )}
                <span>Exportar Libro</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl apple-glass p-1.5 shadow-xl border-border">
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Exportar para DIGEMID / DIRIS
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="gap-2.5 py-2 px-2.5 rounded-xl cursor-pointer text-xs font-medium focus:bg-accent focus:text-accent-foreground"
              >
                <div className="h-8 w-8 rounded-lg bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Formato Oficial Excel (.xlsx)</span>
                  <span className="text-[10px] text-muted-foreground">Conforme D.S. 023-2001-SA y firma QF</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleExportCSV}
                className="gap-2.5 py-2 px-2.5 rounded-xl cursor-pointer text-xs font-medium focus:bg-accent focus:text-accent-foreground"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Archivo CSV Plano (.csv)</span>
                  <span className="text-[10px] text-muted-foreground">Datos tabulares delimitados</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={handlePrint}
                className="gap-2.5 py-2 px-2.5 rounded-xl cursor-pointer text-xs font-medium focus:bg-accent focus:text-accent-foreground"
              >
                <div className="h-8 w-8 rounded-lg bg-[#af52de]/10 text-[#af52de] flex items-center justify-center shrink-0">
                  <Printer className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Imprimir / PDF Oficial</span>
                  <span className="text-[10px] text-muted-foreground">Vista de inspección sanitaria</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  );
}
