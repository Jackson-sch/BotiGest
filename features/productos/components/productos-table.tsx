'use client';

import * as React from 'react';
import {
  Pill,
  Plus,
  Edit2,
  Power,
  ThermometerSnowflake,
  Barcode,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toggleEstadoProductoAction } from '../actions';
import type { ProductoItem } from '../types';
import { exportProductosToExcel } from '@/lib/excel-export';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface ProductosTableProps {
  productos: ProductoItem[];
  onNuevoProducto: () => void;
  onEditarProducto: (producto: ProductoItem) => void;
  onImportarExcel?: () => void;
  onImprimirBarcode?: (producto: ProductoItem) => void;
}

const CONDICIONES_LABELS: Record<string, { label: string; badge: string }> = {
  sin_receta: { label: 'Venta Libre', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  con_receta: { label: 'Con Receta', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  receta_retenida: { label: 'Receta Retenida', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  psicotropico: { label: 'Psicotrópico (IV B)', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  estupefaciente: { label: 'Estupefaciente (II)', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

export function ProductosTable({
  productos,
  onNuevoProducto,
  onEditarProducto,
  onImportarExcel,
  onImprimirBarcode,
}: ProductosTableProps) {
  const [filterCondicion, setFilterCondicion] = React.useState('todas');
  const [isToggling, setIsToggling] = React.useState<string | null>(null);

  const handleToggleEstado = async (p: ProductoItem) => {
    setIsToggling(p.id);
    try {
      const res = await toggleEstadoProductoAction(p.id, !p.activo);
      if (!res.success) {
        toast.error(res.error || 'Error al cambiar estado');
        return;
      }
      toast.success(
        p.activo
          ? `Medicamento "${p.nombre_comercial}" desactivado.`
          : `Medicamento "${p.nombre_comercial}" reactivado en catálogo.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Error de red');
    } finally {
      setIsToggling(null);
    }
  };

  const columns = React.useMemo<ColumnDef<ProductoItem>[]>(
    () => [
      {
        accessorKey: 'nombre_comercial',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Medicamento / Principio Activo" />
        ),
        cell: ({ row }) => {
          const prod = row.original;
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">
                  {prod.nombre_comercial}
                </span>
                {!prod.activo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Inactivo
                  </span>
                )}
              </div>
              {prod.nombre_generico && (
                <p className="text-[11px] text-muted-foreground italic">
                  DCI: {prod.nombre_generico}{' '}
                  {prod.concentracion ? `· ${prod.concentracion}` : ''}
                </p>
              )}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span>Cod: {prod.codigo_interno}</span>
                <span>·</span>
                <span>Base: {prod.unidad_base}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'laboratorio_nombre',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Laboratorio & Forma" />
        ),
        cell: ({ row }) => {
          const prod = row.original;
          return (
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">
                {prod.laboratorio_nombre || 'Laboratorio N/A'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {prod.forma_farmaceutica_nombre || 'Forma general'}
              </p>
              {prod.categoria_nombre && (
                <span className="text-[10px] text-muted-foreground/70 block">
                  {prod.categoria_nombre}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'condicion_venta',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Regulación & Sanitario" />
        ),
        cell: ({ row }) => {
          const prod = row.original;
          const cond = CONDICIONES_LABELS[prod.condicion_venta] || {
            label: prod.condicion_venta,
            badge: 'bg-muted text-muted-foreground',
          };
          return (
            <div className="space-y-1.5">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${cond.badge}`}
              >
                {cond.label}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {prod.registro_sanitario && (
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                    RS: {prod.registro_sanitario}
                  </span>
                )}
                {prod.requiere_cadena_frio && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                    <ThermometerSnowflake className="h-2.5 w-2.5" />
                    2°-8°C
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'presentaciones',
        header: () => <span>Presentaciones & Precios</span>,
        cell: ({ row }) => {
          const prod = row.original;
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {prod.presentaciones.map((pr) => (
                <div
                  key={pr.id || pr.nombre}
                  className="px-2 py-1 rounded-xl bg-background/80 border border-border/50 text-[11px] flex items-center gap-1.5"
                >
                  <span className="font-medium text-foreground">{pr.nombre}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    S/ {pr.precio_venta.toFixed(2)}
                  </span>
                  {pr.codigo_barras && (
                    <Barcode className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'total_stock',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Stock Físico" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => {
          const prod = row.original;
          const stock = prod.total_stock || 0;
          return (
            <div className="text-center">
              <span
                className={`font-mono font-bold text-sm ${
                  stock <= 0
                    ? 'text-rose-400'
                    : stock < 20
                    ? 'text-amber-400'
                    : 'text-foreground'
                }`}
              >
                {stock}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {prod.unidad_base.toLowerCase()}s
              </span>
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const prod = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onImprimirBarcode?.(prod)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400"
                title="Imprimir código de barras / etiquetas"
              >
                <Barcode className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditarProducto(prod)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                title="Editar fármaco"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEstado(prod)}
                disabled={isToggling === prod.id}
                className={`h-8 w-8 p-0 rounded-xl ${
                  prod.activo
                    ? 'hover:bg-rose-500/10 hover:text-rose-400'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
                title={prod.activo ? 'Desactivar fármaco' : 'Activar fármaco'}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isToggling, onEditarProducto, onImprimirBarcode]
  );

  const productosFiltrados = React.useMemo(() => {
    return productos.filter((p) => {
      if (filterCondicion === 'todas') return true;
      if (filterCondicion === 'frio') return p.requiere_cadena_frio;
      if (filterCondicion === 'controlados') return p.es_controlado;
      return p.condicion_venta === filterCondicion;
    });
  }, [productos, filterCondicion]);

  return (
    <div className="space-y-4 w-full">
      <DataTable
        columns={columns}
        data={productosFiltrados}
        searchPlaceholder="Buscar por fármaco, DCI, código o barra..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron fármacos que coincidan con la búsqueda."
        toolbarContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtros rápidos por condición con altura exacta h-9 sin scrollbar */}
            <div className="flex items-center gap-1 p-0.5 h-9 bg-sidebar/80 border border-border/50 rounded-xl text-xs overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFilterCondicion('todas')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterCondicion === 'todas'
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({productos.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCondicion('sin_receta')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterCondicion === 'sin_receta'
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Venta Libre
              </button>
              <button
                type="button"
                onClick={() => setFilterCondicion('con_receta')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterCondicion === 'con_receta'
                    ? 'bg-blue-500/15 text-blue-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Con Receta
              </button>
              <button
                type="button"
                onClick={() => setFilterCondicion('controlados')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterCondicion === 'controlados'
                    ? 'bg-purple-500/15 text-purple-300 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Controlados
              </button>
              <button
                type="button"
                onClick={() => setFilterCondicion('frio')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all gap-1 ${
                  filterCondicion === 'frio'
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ThermometerSnowflake className="h-3 w-3" />
                Frío
              </button>
            </div>

            {/* Exportar Excel con altura exacta h-9 */}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  if (productosFiltrados.length === 0) {
                    toast.error('No hay fármacos para exportar en este filtro');
                    return;
                  }
                  await exportProductosToExcel(productosFiltrados);
                  toast.success(`Catálogo exportado exitosamente (${productosFiltrados.length} productos)`);
                } catch (err: any) {
                  toast.error('Error al exportar catálogo: ' + (err.message || ''));
                }
              }}
              className="h-9 px-3 text-xs font-medium rounded-xl border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </Button>

            {/* Importar Excel con altura exacta h-9 */}
            {onImportarExcel && (
              <Button
                variant="outline"
                onClick={onImportarExcel}
                className="h-9 px-3 text-xs font-medium rounded-xl border-border/60 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 gap-1.5 transition-colors"
              >
                <Upload className="h-4 w-4 text-blue-400" />
                <span>Importar Excel</span>
              </Button>
            )}

            {/* Nuevo Fármaco con altura exacta h-9 */}
            <Button
              onClick={onNuevoProducto}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Fármaco</span>
            </Button>
          </div>
        }
      />
    </div>
  );
}
