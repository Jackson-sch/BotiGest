'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Power,
  FileSpreadsheet,
  Plus,
  Coins,
  FileText,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatMoney } from '@/lib/utils';
import { exportClientesToExcel } from '@/lib/excel-export';
import { toggleActivoClienteAction } from '../actions';
import { toast } from 'sonner';
import type { Cliente } from '../types';

interface ClientesTableProps {
  clientes: Cliente[];
  onEditar: (cliente: Cliente) => void;
  onNuevo?: () => void;
  onVerEstadoCuenta: (cliente: Cliente) => void;
  onAbonar: (cliente: Cliente) => void;
}

export function ClientesTable({
  clientes,
  onEditar,
  onNuevo: _onNuevo,
  onVerEstadoCuenta,
  onAbonar,
}: ClientesTableProps) {
  const [filterEstado, setFilterEstado] = React.useState<'todos' | 'con_credito' | 'con_deuda' | 'inactivos'>('todos');
  const [isToggling, setIsToggling] = React.useState<string | null>(null);

  const handleToggleEstado = async (c: Cliente) => {
    setIsToggling(c.id);
    try {
      const nuevoEstado = !c.activo;
      const res = await toggleActivoClienteAction(c.id, nuevoEstado);
      if (res.success) {
        toast.success(`Cliente "${c.nombres}" ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      } else {
        toast.error(res.message || 'Error al cambiar estado.');
      }
    } catch {
      toast.error('Error al actualizar estado del cliente.');
    } finally {
      setIsToggling(null);
    }
  };

  const handleExportarExcel = async () => {
    if (clientes.length === 0) {
      toast.error('No hay clientes para exportar.');
      return;
    }

    try {
      await exportClientesToExcel(
        clientes.map((c) => ({
          tipo_documento: c.tipo_documento,
          numero_documento: c.numero_documento,
          nombres: c.nombres,
          telefono: c.telefono,
          email: c.email,
          direccion: c.direccion,
          tiene_credito: c.tiene_credito,
          limite_credito: c.limite_credito,
          dias_credito: c.dias_credito,
          saldo_deudor: c.saldo_deudor,
          puntos: c.puntos,
          alergias: c.alergias,
          condicion_medica: c.condicion_medica,
          activo: c.activo,
        }))
      );
      toast.success('Directorio de clientes exportado con éxito.');
    } catch {
      toast.error('Error al generar archivo Excel.');
    }
  };

  const columns = React.useMemo<ColumnDef<Cliente>[]>(
    () => [
      {
        id: 'cliente_info',
        accessorKey: 'nombres',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente / Razón Social" />,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-col gap-1 py-1 max-w-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors cursor-pointer" onClick={() => onVerEstadoCuenta(c)}>
                  {c.nombres}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {c.tipo_documento.toUpperCase()}: {c.numero_documento}
                </Badge>
                {c.telefono && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Phone className="h-3 w-3" />
                    {c.telefono}
                  </span>
                )}
              </div>
              {c.direccion && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{c.direccion}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'credito_info',
        accessorKey: 'tiene_credito',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Línea de Crédito" />,
        cell: ({ row }) => {
          const c = row.original;
          if (!c.tiene_credito) {
            return (
              <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                Sin Crédito
              </Badge>
            );
          }

          const disponible = Math.max(0, c.limite_credito - c.saldo_deudor);
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-1 font-mono font-semibold text-foreground">
                <CreditCard className="h-3 w-3 text-primary shrink-0" />
                <span>{formatMoney(c.limite_credito)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Plazo: <strong>{c.dias_credito} días</strong>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                Disp: {formatMoney(disponible)}
              </div>
            </div>
          );
        },
      },
      {
        id: 'saldo_deudor',
        accessorKey: 'saldo_deudor',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo Deudor" />,
        cell: ({ row }) => {
          const c = row.original;
          const saldo = Number(c.saldo_deudor) || 0;

          if (saldo <= 0) {
            return (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-mono font-medium">S/ 0.00</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="destructive"
                className="font-mono font-bold text-xs px-2 py-0.5 w-fit bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              >
                {formatMoney(saldo)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">Deuda acumulada</span>
            </div>
          );
        },
      },
      {
        id: 'clinica',
        header: 'Perfil Clínico',
        cell: ({ row }) => {
          const c = row.original;
          if (!c.alergias && !c.condicion_medica) {
            return <span className="text-muted-foreground/60 text-xs">-</span>;
          }

          return (
            <div className="max-w-[200px] flex flex-col gap-1">
              {c.alergias && (
                <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={`Alergia: ${c.alergias}`}>
                    {c.alergias}
                  </span>
                </div>
              )}
              {c.condicion_medica && (
                <span className="text-[10px] text-muted-foreground truncate" title={c.condicion_medica}>
                  {c.condicion_medica}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'puntos',
        accessorKey: 'puntos',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Puntos" />,
        cell: ({ row }) => {
          const puntos = row.original.puntos || 0;
          return (
            <div className="font-mono text-xs">
              <span className="font-bold text-foreground">{puntos}</span>{' '}
              <span className="text-[10px] text-muted-foreground">pts</span>
            </div>
          );
        },
      },
      {
        id: 'estado',
        accessorKey: 'activo',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const activo = row.original.activo;
          return (
            <Badge
              variant={activo ? 'default' : 'secondary'}
              className={`text-[10px] uppercase font-semibold ${
                activo
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {activo ? 'Activo' : 'Inactivo'}
            </Badge>
          );
        },
      },
      {
        id: 'acciones',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {/* Ver Estado de Cuenta */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onVerEstadoCuenta(c)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                title="Ver estado de cuenta corriente"
              >
                <FileText className="h-4 w-4" />
              </Button>

              {/* Abonar a la deuda si tiene saldo deudor */}
              {c.saldo_deudor > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAbonar(c)}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"
                  title="Registrar abono / pago de deuda"
                >
                  <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </Button>
              )}

              {/* Editar Cliente */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditar(c)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                title="Editar cliente y límites"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>

              {/* Activar / Desactivar */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEstado(c)}
                disabled={isToggling === c.id}
                className={`h-8 w-8 p-0 rounded-xl ${
                  c.activo
                    ? 'hover:bg-rose-500/10 hover:text-rose-400'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
                title={c.activo ? 'Desactivar cliente' : 'Activar cliente'}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isToggling, onEditar, onVerEstadoCuenta, onAbonar]
  );

  const clientesFiltrados = React.useMemo(() => {
    if (filterEstado === 'con_credito') return clientes.filter((c) => c.tiene_credito && c.activo);
    if (filterEstado === 'con_deuda') return clientes.filter((c) => c.saldo_deudor > 0);
    if (filterEstado === 'inactivos') return clientes.filter((c) => !c.activo);
    return clientes;
  }, [clientes, filterEstado]);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={clientesFiltrados}
        searchPlaceholder="Buscar por DNI, RUC, nombres o teléfono..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron clientes registrados con el criterio de búsqueda."
        toolbarContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Control por tipo de cuenta */}
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
                Todos ({clientes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('con_credito')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'con_credito'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Con Línea Crédito ({clientes.filter((c) => c.tiene_credito).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('con_deuda')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'con_deuda'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Con Deuda Activa ({clientes.filter((c) => c.saldo_deudor > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('inactivos')}
                className={`h-7 px-3 flex items-center justify-center rounded-lg transition-all ${
                  filterEstado === 'inactivos'
                    ? 'bg-muted text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inactivos ({clientes.filter((c) => !c.activo).length})
              </button>
            </div>

            {/* Exportar Excel */}
            <Button
              variant="outline"
              onClick={handleExportarExcel}
              className="h-9 px-3 text-xs font-medium rounded-xl border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Exportar Excel</span>
            </Button>
          </div>
        }
      />
    </div>
  );
}
