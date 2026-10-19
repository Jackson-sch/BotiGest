'use client';

import * as React from 'react';
import {
  Eye,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import type { CompraResumen } from '../types';
import { useQueryState, parseAsString } from 'nuqs';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface ComprasTableProps {
  compras: CompraResumen[];
  onVerDetalle: (compra: CompraResumen) => void;
  onRecibir: (compra: CompraResumen) => void;
}

export function ComprasTable({ compras, onVerDetalle, onRecibir }: ComprasTableProps) {
  const [filtroEstado, setFiltroEstado] = useQueryState('estado', parseAsString.withDefault('todos'));

  const columns = React.useMemo<ColumnDef<CompraResumen>[]>(
    () => [
      {
        accessorKey: 'serie_numero',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Documento Proveedor" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase font-mono text-[10px]">
              {row.original.tipo_documento}
            </Badge>
            <span className="font-mono font-bold text-foreground">
              {row.original.serie_numero}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'proveedor_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Proveedor" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.proveedor_nombre}</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              RUC: {row.original.proveedor_ruc}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'fecha_emision',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Emisión / Recepción" />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-muted-foreground text-xs">
            <div>{row.original.fecha_emision}</div>
            {row.original.fecha_recepcion && (
              <div className="text-[11px] text-[#248a3d] dark:text-[#30d158]">
                Recibido: {row.original.fecha_recepcion}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'items_count',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Ítems" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center font-mono font-medium text-xs">
            {row.original.items_count} productos
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Total (Inc. IGV)" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-sm text-foreground">
            {formatMoney(row.original.total)}
          </div>
        ),
      },
      {
        accessorKey: 'estado',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Estado" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => {
          const esRecibida = row.original.estado === 'recibida';
          return (
            <div className="flex justify-center">
              {esRecibida ? (
                <Badge variant="success" className="gap-1 text-[11px]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>En Almacén</span>
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1 text-[11px]">
                  <Clock className="h-3 w-3" />
                  <span>Borrador (Por Recibir)</span>
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: () => <div className="text-center">Acciones</div>,
        cell: ({ row }) => {
          const c = row.original;
          const esRecibida = c.estado === 'recibida';
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onVerDetalle(c)}
                className="rounded-lg h-7 px-2 text-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ver
              </Button>
              {!esRecibida && (
                <Button
                  size="sm"
                  onClick={() => onRecibir(c)}
                  className="rounded-lg h-7 px-2.5 text-xs bg-[#34c759] hover:bg-[#28a745] text-white"
                >
                  <Truck className="h-3.5 w-3.5 mr-1" />
                  Recibir Lotes
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onRecibir, onVerDetalle]
  );

  const comprasFiltradas = React.useMemo(() => {
    if (filtroEstado === 'todos') return compras;
    return compras.filter((c) => c.estado === filtroEstado);
  }, [compras, filtroEstado]);

  return (
    <div className="space-y-4">
      {/* TanStack DataTable con paginación, sorting y selector de columnas */}
      <DataTable
        columns={columns}
        data={comprasFiltradas}
        searchPlaceholder="Buscar por factura, proveedor o RUC..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron compras que coincidan con la búsqueda."
        toolbarContent={
          <div className="flex items-center gap-1 p-0.5 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] w-full sm:w-auto overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {['todos', 'borrador', 'recibida'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroEstado(st)}
                className={`h-7 px-3 flex items-center justify-center text-xs font-medium rounded-lg capitalize transition-all apple-press-feedback whitespace-nowrap ${
                  filtroEstado === st
                    ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'borrador' ? 'Pendientes de Recepción' : st}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}
