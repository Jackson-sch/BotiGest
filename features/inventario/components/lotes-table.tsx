'use client';

import * as React from 'react';
import {
  Clock,
  AlertTriangle,
  Snowflake,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';
import type { LoteConStock, EstadoLoteStock } from '../types';
import { useAuth } from '@/components/providers/auth-provider';
import { useQueryState, parseAsString } from 'nuqs';
import { exportInventarioLotesToExcel } from '@/lib/excel-export';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface LotesTableProps {
  lotes: LoteConStock[];
  onSelectAjuste: (lote: LoteConStock) => void;
}

export function LotesTable({ lotes, onSelectAjuste }: LotesTableProps) {
  const { user } = useAuth();
  const canAjustar = Boolean(user && ['director_tecnico', 'administrador', 'propietario'].includes(user.rol));
  const [filterEstado, setFilterEstado] = useQueryState('estado', parseAsString.withDefault('todos'));

  const renderBadgeVencimiento = (dias: number) => {
    if (dias <= 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          <span>Vencido</span>
        </Badge>
      );
    }
    if (dias <= 30) {
      return (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          <span>Vence en {dias}d (Crítico)</span>
        </Badge>
      );
    }
    if (dias <= 90) {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          <span>Vence en {dias}d (FEFO)</span>
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-[#34c759]" />
        <span>{dias} días</span>
      </Badge>
    );
  };

  const renderBadgeEstado = (estado: EstadoLoteStock) => {
    switch (estado) {
      case 'disponible':
        return <Badge variant="success">Disponible</Badge>;
      case 'cuarentena':
        return <Badge variant="warning">Cuarentena</Badge>;
      case 'bloqueado':
        return <Badge variant="purple">Bloqueado</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
    }
  };

  const columns = React.useMemo<ColumnDef<LoteConStock>[]>(
    () => [
      {
        accessorKey: 'nombre_comercial',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Producto & Laboratorio" />
        ),
        cell: ({ row }) => {
          const lote = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-xs">
                {lote.nombre_comercial}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {lote.codigo_interno} · {lote.laboratorio}
                {lote.requiere_cadena_frio && (
                  <span className="inline-flex items-center text-[#0071e3]">
                    <Snowflake className="h-3 w-3 mr-0.5" /> 2°C - 8°C
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'numero_lote',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="N° Lote" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-medium text-foreground">
            {row.original.numero_lote}
          </span>
        ),
      },
      {
        accessorKey: 'fecha_vencimiento',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha Vto. / Prioridad FEFO" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 items-start">
            <span className="font-mono text-foreground">{row.original.fecha_vencimiento}</span>
            {renderBadgeVencimiento(row.original.dias_para_vencer)}
          </div>
        ),
      },
      {
        accessorKey: 'cantidad_base',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Stock Base" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-foreground text-sm">
              {row.original.cantidad_base}
            </span>
            <span className="text-[10px] text-muted-foreground lowercase">
              {row.original.unidad_base}s
            </span>
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
        cell: ({ row }) => (
          <div className="flex justify-center">
            {renderBadgeEstado(row.original.estado)}
          </div>
        ),
      },
      {
        accessorKey: 'costo_promedio',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Costo Promedio" className="justify-end" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-muted-foreground">
            {formatMoney(row.original.costo_promedio)}
          </div>
        ),
      },
      {
        id: 'acciones',
        header: () => <div className="text-center">Acciones</div>,
        cell: ({ row }) => {
          const lote = row.original;
          return (
            <div className="flex justify-center">
              {canAjustar ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectAjuste(lote)}
                  className="rounded-lg h-7 px-2 text-xs text-[#0071e3] hover:text-[#0071e3] hover:bg-[#0071e3]/10"
                >
                  Ajustar / Merma
                </Button>
              ) : (
                <span className="text-[11px] text-muted-foreground/50 italic select-none">
                  Solo Q.F. / Admin
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [canAjustar, onSelectAjuste]
  );

  const filteredLotes = React.useMemo(() => {
    if (filterEstado === 'todos') return lotes;
    return lotes.filter((l) => l.estado === filterEstado);
  }, [lotes, filterEstado]);

  return (
    <div className="space-y-4">
      {/* TanStack DataTable con paginación, sorting y selector de columnas */}
      <DataTable
        columns={columns}
        data={filteredLotes}
        searchPlaceholder="Buscar por producto, lote o código..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron lotes que coincidan con la búsqueda."
        toolbarContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Control de Estados */}
            <div className="flex items-center gap-1 p-0.5 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] w-full sm:w-auto overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['todos', 'disponible', 'cuarentena', 'vencido'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterEstado(st)}
                  className={`h-7 px-3 flex items-center justify-center text-xs font-medium rounded-lg capitalize transition-all apple-press-feedback whitespace-nowrap ${
                    filterEstado === st
                      ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Exportar Excel */}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  if (filteredLotes.length === 0) {
                    toast.error('No hay lotes para exportar con el filtro actual');
                    return;
                  }
                  await exportInventarioLotesToExcel(filteredLotes);
                  toast.success(`Inventario exportado (${filteredLotes.length} lotes)`);
                } catch (err: any) {
                  toast.error('Error al exportar inventario: ' + (err.message || ''));
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
