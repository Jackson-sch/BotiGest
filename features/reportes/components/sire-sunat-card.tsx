'use client';

import * as React from 'react';
import {
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportSireSunatToExcel } from '@/lib/excel-export';
import type { SireVentaItem } from '../types';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface SireSunatCardProps {
  ventas: SireVentaItem[];
}

export function SireSunatCard({ ventas }: SireSunatCardProps) {
  const handleDescargarSireExcel = async () => {
    if (ventas.length === 0) {
      toast.error('No hay ventas registradas en el período');
      return;
    }
    try {
      await exportSireSunatToExcel(ventas);
      toast.success('Registro SIRE RVIE exportado a Excel (.xlsx) exitosamente.');
    } catch (err: any) {
      toast.error('Error al exportar SIRE a Excel: ' + (err.message || ''));
    }
  };

  const handleDescargarSireCsv = () => {
    if (ventas.length === 0) {
      toast.error('No hay ventas registradas en el período');
      return;
    }

    const headers = [
      'Fecha Emision',
      'Tipo Comprobante',
      'Serie',
      'Numero',
      'Documento Cliente',
      'Razon Social / Nombre',
      'Subtotal Gravado',
      'IGV',
      'Total',
      'Estado SUNAT',
    ];

    const rows = ventas.map((v) => [
      v.fecha_emision,
      v.tipo_comprobante.toUpperCase(),
      v.serie,
      v.numero,
      v.cliente_documento || 'S/D',
      `"${v.cliente_nombre || 'CLIENTES VARIOS'}"`,
      v.subtotal.toFixed(2),
      v.igv.toFixed(2),
      v.total.toFixed(2),
      v.estado_sunat.toUpperCase(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SUNAT_SIRE_RVIE_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Registro de Ventas e Ingresos (RVIE) descargado con éxito.');
  };

  const columns = React.useMemo<ColumnDef<SireVentaItem>[]>(
    () => [
      {
        accessorKey: 'fecha_emision',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.fecha_emision}
          </span>
        ),
      },
      {
        accessorKey: 'serie',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Comprobante" />
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-foreground">
              {row.original.serie}-{String(row.original.numero).padStart(6, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase block font-medium">
              {row.original.tipo_comprobante}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'cliente_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente / Documento" />
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-foreground block">
              {row.original.cliente_nombre || 'CLIENTES VARIOS'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {row.original.cliente_documento || 'Sin Documento'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'subtotal',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Subtotal (S/.)" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-foreground">
            S/ {row.original.subtotal.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'igv',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="IGV 18% (S/.)" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-muted-foreground">
            S/ {row.original.igv.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Total (S/.)" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-foreground text-sm">
            S/ {row.original.total.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'estado_sunat',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Estado SUNAT" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
              {row.original.estado_sunat}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Banner SUNAT SIRE */}
      <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              SUNAT · Sistema Integrado de Registros Electrónicos (SIRE)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                R.S. 112-2021 / RVIE
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Registro de Ventas e Ingresos Electrónicos para declaración mensual de IGV - Renta (Formulario 621).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            onClick={handleDescargarSireCsv}
            className="h-9 px-3 text-xs rounded-xl border-border/60 text-muted-foreground hover:text-foreground"
          >
            Descargar CSV
          </Button>
          <Button
            onClick={handleDescargarSireExcel}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar SIRE (.xlsx)
          </Button>
        </div>
      </div>

      {/* TanStack DataTable con paginación y búsqueda */}
      <DataTable
        columns={columns}
        data={ventas}
        searchPlaceholder="Buscar por comprobante o cliente..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron comprobantes para el período en el registro SIRE RVIE."
      />
    </div>
  );
}
