'use client';

import * as React from 'react';
import {
  Eye,
  Printer,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';
import { SunatBadge } from './sunat-badge';
import type { VentaResumen } from '../types';
import { useAuth } from '@/components/providers/auth-provider';
import { useQueryState, parseAsString } from 'nuqs';
import { exportVentasToExcel } from '@/lib/excel-export';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface VentasTableProps {
  ventas: VentaResumen[];
  onVerDetalle: (venta: VentaResumen) => void;
  onImprimirTicket?: (venta: VentaResumen) => void;
  onAnular: (venta: VentaResumen) => void;
}

export function VentasTable({ ventas, onVerDetalle, onImprimirTicket, onAnular }: VentasTableProps) {
  const { user } = useAuth();
  const canAnular = Boolean(user && ['administrador', 'propietario', 'director_tecnico'].includes(user.rol));
  const [filtroTipo, setFiltroTipo] = useQueryState('tipo', parseAsString.withDefault('todos'));

  const renderBadgeComprobante = (tipo: string) => {
    switch (tipo) {
      case 'factura':
        return <Badge variant="default" className="uppercase font-mono text-[10px]">Factura</Badge>;
      case 'boleta':
        return <Badge variant="secondary" className="uppercase font-mono text-[10px]">Boleta</Badge>;
      case 'nota_venta':
        return <Badge variant="outline" className="uppercase font-mono text-[10px]">Nota Venta</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const columns = React.useMemo<ColumnDef<VentaResumen>[]>(
    () => [
      {
        accessorKey: 'correlativo',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Comprobante" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {renderBadgeComprobante(row.original.tipo_comprobante)}
            <span className="font-mono font-bold text-foreground">
              {row.original.correlativo}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'fecha_emision',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha & Hora" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.fecha_emision}
          </span>
        ),
      },
      {
        accessorKey: 'cliente_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.original.cliente_nombre}
            </span>
            {row.original.cliente_documento && (
              <span className="text-[11px] font-mono text-muted-foreground">
                {row.original.cliente_documento}
              </span>
            )}
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
        cell: ({ row }) => {
          const estaAnulada = row.original.estado === 'anulada';
          return (
            <div className="text-right font-mono font-bold text-sm text-foreground">
              <span className={estaAnulada ? 'line-through text-muted-foreground' : ''}>
                {formatMoney(row.original.total)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'estado_sunat',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Estado SUNAT" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => {
          const estaAnulada = row.original.estado === 'anulada';
          return (
            <div className="flex justify-center">
              {estaAnulada ? (
                <Badge variant="destructive">Anulada</Badge>
              ) : (
                <SunatBadge estado={row.original.estado_sunat} />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'caja_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Caja / Cajero" />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground text-[11px]">
            <div className="font-medium text-foreground">{row.original.caja_nombre}</div>
            <div className="text-[10px]">{row.original.vendedor_nombre}</div>
          </div>
        ),
      },
      {
        id: 'acciones',
        header: () => <div className="text-center">Acciones</div>,
        cell: ({ row }) => {
          const v = row.original;
          const estaAnulada = v.estado === 'anulada';

          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onVerDetalle(v)}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                title="Ver Detalle"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onImprimirTicket ? onImprimirTicket(v) : onVerDetalle(v)}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                title="Reimprimir Ticket Térmico"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
              {!estaAnulada && canAnular && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAnular(v)}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-[#ff3b30]"
                  title="Anular Venta"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canAnular, onAnular, onVerDetalle, onImprimirTicket]
  );

  const ventasFiltradas = React.useMemo(() => {
    if (filtroTipo === 'todos') return ventas;
    return ventas.filter((v) => v.tipo_comprobante === filtroTipo);
  }, [ventas, filtroTipo]);

  return (
    <div className="space-y-4">
      {/* TanStack Table con controles integrados */}
      <DataTable
        columns={columns}
        data={ventasFiltradas}
        searchPlaceholder="Buscar por serie, número, cliente o DNI/RUC..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron comprobantes de venta registrados."
        toolbarContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Control por Tipo de Comprobante */}
            <div className="flex items-center gap-1 p-0.5 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] w-full sm:w-auto overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['todos', 'boleta', 'factura', 'nota_venta'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFiltroTipo(t)}
                  className={`h-7 px-3 flex items-center justify-center text-xs font-medium rounded-lg capitalize transition-all apple-press-feedback whitespace-nowrap ${
                    filtroTipo === t
                      ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'nota_venta' ? 'Nota Venta' : t}
                </button>
              ))}
            </div>

            {/* Exportar a Excel */}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  if (ventasFiltradas.length === 0) {
                    toast.error('No hay comprobantes para exportar con el filtro actual');
                    return;
                  }
                  await exportVentasToExcel(ventasFiltradas);
                  toast.success(`Registro de ventas exportado (${ventasFiltradas.length} comprobantes)`);
                } catch (err: any) {
                  toast.error('Error al exportar ventas: ' + (err.message || ''));
                }
              }}
              className="h-9 px-3 text-xs font-medium rounded-xl border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </Button>
          </div>
        }
      />
    </div>
  );
}
