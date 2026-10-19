'use client';

import * as React from 'react';
import {
  FileDown,
  Building,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { OppfItem } from '../types';
import { formatMoney } from '@/lib/utils';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface OppfExportCardProps {
  items: OppfItem[];
}

export function OppfExportCard({ items }: OppfExportCardProps) {
  const handleDescargarTxt = () => {
    if (items.length === 0) {
      toast.error('No hay registros de precios para exportar');
      return;
    }

    const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lines = items.map((it) => {
      return [
        it.ruc,
        it.codigo_establecimiento,
        it.codigo_producto,
        it.nombre_comercial.replace(/\|/g, ''),
        it.precio_unitario.toFixed(2),
        it.condicion_venta,
        it.registro_sanitario || 'S/R',
        it.stock_actual,
        fechaHoy,
      ].join('|');
    });

    const fileContent = lines.join('\r\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OPPF_DIGEMID_${items[0]?.ruc || '20608899112'}_${fechaHoy}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Archivo plano OPPF generado y descargado para la plataforma DIGEMID.');
  };

  const columns = React.useMemo<ColumnDef<OppfItem>[]>(
    () => [
      {
        accessorKey: 'codigo_producto',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Código / RS" />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono font-bold text-foreground block">
              {row.original.codigo_producto}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              RS: {row.original.registro_sanitario || 'N/A'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'nombre_comercial',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Medicamento / Presentación" />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground block">
              {row.original.nombre_comercial}
            </span>
            {row.original.nombre_generico && (
              <span className="text-[11px] text-muted-foreground italic block">
                DCI: {row.original.nombre_generico} · {row.original.presentacion}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'condicion_venta',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Condición Venta" />
        ),
        cell: ({ row }) => (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 bg-muted/40 font-medium text-foreground">
            {row.original.condicion_venta}
          </span>
        ),
      },
      {
        accessorKey: 'precio_unitario',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Precio (S/.)" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-foreground">
            {formatMoney(row.original.precio_unitario)}
          </div>
        ),
      },
      {
        accessorKey: 'stock_actual',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Stock Físico" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                row.original.stock_actual > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {row.original.stock_actual} unid.
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Banner Informativo DIGEMID */}
      <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Observatorio Peruano de Productos Farmacéuticos (OPPF)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                R.M. 040-2010/MINSA
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Reporte mensual obligatorio de precios de venta al público vigentes bajo apercibimiento de sanción DIGEMID.
            </p>
          </div>
        </div>

        <Button
          onClick={handleDescargarTxt}
          className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm shrink-0"
        >
          <FileDown className="h-4 w-4 mr-1.5" />
          Descargar Archivo Plano (.txt)
        </Button>
      </div>

      {/* TanStack DataTable con paginación, sorting y selector de columnas */}
      <DataTable
        columns={columns}
        data={items}
        searchKey="nombre_comercial"
        searchPlaceholder="Buscar por medicamento..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron medicamentos para el reporte de precios OPFF."
      />
    </div>
  );
}
