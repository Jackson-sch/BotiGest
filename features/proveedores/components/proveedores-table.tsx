'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Power,
  Trash2,
  FileSpreadsheet,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatMoney } from '@/lib/utils';
import { exportProveedoresToExcel } from '@/lib/excel-export';
import { toggleEstadoProveedorAction, eliminarProveedorAction } from '../actions';
import { toast } from 'sonner';
import type { ProveedorItem } from '../types';

interface ProveedoresTableProps {
  proveedores: ProveedorItem[];
  onEditar: (proveedor: ProveedorItem) => void;
  onNuevo?: () => void;
}

export function ProveedoresTable({
  proveedores,
  onEditar,
  onNuevo: _onNuevo,
}: ProveedoresTableProps) {
  const [filterEstado, setFilterEstado] = React.useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [isToggling, setIsToggling] = React.useState<string | null>(null);

  const handleToggleEstado = async (prov: ProveedorItem) => {
    setIsToggling(prov.id);
    try {
      const res = await toggleEstadoProveedorAction(prov.id);
      if (res.success) {
        toast.success(`Proveedor "${prov.razon_social}" ${prov.activo ? 'desactivado' : 'activado'}`);
      } else {
        toast.error(res.error || 'Error al cambiar estado');
      }
    } catch {
      toast.error('Error al actualizar estado del proveedor');
    } finally {
      setIsToggling(null);
    }
  };

  const handleEliminar = async (prov: ProveedorItem) => {
    if (!confirm(`¿Está seguro de eliminar definitivamente a la droguería "${prov.razon_social}"?`)) {
      return;
    }

    try {
      const res = await eliminarProveedorAction(prov.id);
      if (res.success) {
        toast.success('Proveedor eliminado correctamente');
      } else {
        toast.error(res.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error al procesar la eliminación');
    }
  };

  const handleExportarExcel = async () => {
    if (proveedores.length === 0) {
      toast.error('No hay proveedores para exportar.');
      return;
    }

    try {
      await exportProveedoresToExcel(proveedoresFiltrados);
      toast.success(`Directorio de proveedores exportado exitosamente (${proveedoresFiltrados.length} droguerías)`);
    } catch (err: any) {
      toast.error('Error al exportar a Excel: ' + (err.message || ''));
    }
  };

  const columns = React.useMemo<ColumnDef<ProveedorItem>[]>(
    () => [
      {
        accessorKey: 'ruc',
        header: ({ column }) => <DataTableColumnHeader column={column} title="RUC" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground px-2 py-1 rounded-md bg-muted/40 border border-border/40">
            {row.original.ruc}
          </span>
        ),
      },
      {
        accessorKey: 'razon_social',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Droguería / Razón Social" />,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-xs text-foreground block">
              {row.original.razon_social}
            </span>
            {row.original.direccion && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-xs">{row.original.direccion}</span>
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'contacto',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contacto & Asesor" />,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-foreground block">
              {row.original.contacto || 'Sin Asesor asignado'}
            </span>
            {row.original.email && (
              <a
                href={`mailto:${row.original.email}`}
                className="text-[11px] text-[#0071e3] hover:underline flex items-center gap-1"
              >
                <Mail className="h-2.5 w-2.5 shrink-0" />
                <span>{row.original.email}</span>
              </a>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'telefono',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
        cell: ({ row }) => {
          const tel = row.original.telefono;
          if (!tel) return <span className="text-xs text-muted-foreground">--</span>;
          return (
            <a
              href={`tel:${tel}`}
              className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3 w-3 text-emerald-400" />
              <span>{tel}</span>
            </a>
          );
        },
      },
      {
        accessorKey: 'total_compras',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Compras Realizadas" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => {
          const count = row.original.total_compras;
          const monto = row.original.total_monto_compras;
          return (
            <div className="text-center space-y-0.5">
              <span className="font-mono text-xs font-bold text-foreground">
                {count} {count === 1 ? 'factura' : 'facturas'}
              </span>
              {monto > 0 && (
                <span className="text-[10px] font-mono text-emerald-400 block font-semibold">
                  {formatMoney(monto)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'activo',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Estado" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => {
          const activo = row.original.activo;
          return (
            <div className="flex justify-center">
              <Badge
                variant={activo ? 'success' : 'secondary'}
                className="text-[10px] font-medium uppercase tracking-wider"
              >
                {activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditar(p)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                title="Editar proveedor"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEstado(p)}
                disabled={isToggling === p.id}
                className={`h-8 w-8 p-0 rounded-xl ${
                  p.activo
                    ? 'hover:bg-rose-500/10 hover:text-rose-400'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
                title={p.activo ? 'Desactivar proveedor' : 'Activar proveedor'}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>

              {p.total_compras === 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEliminar(p)}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-rose-500/10 hover:text-rose-400"
                  title="Eliminar proveedor sin compras"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [isToggling, onEditar]
  );

  const proveedoresFiltrados = React.useMemo(() => {
    if (filterEstado === 'activos') return proveedores.filter((p) => p.activo);
    if (filterEstado === 'inactivos') return proveedores.filter((p) => !p.activo);
    return proveedores;
  }, [proveedores, filterEstado]);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={proveedoresFiltrados}
        searchPlaceholder="Buscar por RUC, droguería o contacto..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron proveedores o droguerías registradas."
        toolbarContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Control por Estado */}
            <div className="flex items-center gap-1 p-0.5 h-9 bg-sidebar/80 border border-border/50 rounded-xl text-xs overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFilterEstado('todos')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'todos'
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({proveedores.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('activos')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'activos'
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Activos ({proveedores.filter((p) => p.activo).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('inactivos')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'inactivos'
                    ? 'bg-rose-500/15 text-rose-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inactivos ({proveedores.filter((p) => !p.activo).length})
              </button>
            </div>

            {/* Exportar Excel */}
            <Button
              variant="outline"
              onClick={handleExportarExcel}
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
