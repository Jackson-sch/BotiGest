'use client';

import * as React from 'react';
import {
  Eye,
  Printer,
  RotateCcw,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  CalendarDays,
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  FileCode,
  FileCheck2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';
import { SunatBadge } from './sunat-badge';
import type { VentaResumen } from '../types';
import { useAuth } from '@/components/providers/auth-provider';
import { exportVentasToExcel } from '@/lib/excel-export';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface VentasTableProps {
  ventas: VentaResumen[];
  filtroPeriodo: string;
  setFiltroPeriodo: (p: string) => void;
  filtroTipo: string;
  setFiltroTipo: (t: string) => void;
  fechaDesde: string;
  setFechaDesde: (d: string) => void;
  fechaHasta: string;
  setFechaHasta: (h: string) => void;
  onVerDetalle: (venta: VentaResumen) => void;
  onImprimirTicket?: (venta: VentaResumen) => void;
  onAnular: (venta: VentaResumen) => void;
}

export function VentasTable({
  ventas,
  filtroPeriodo,
  setFiltroPeriodo,
  filtroTipo,
  setFiltroTipo,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  onVerDetalle,
  onImprimirTicket,
  onAnular,
}: VentasTableProps) {
  const { user } = useAuth();
  const canAnular = Boolean(user && ['administrador', 'propietario', 'director_tecnico'].includes(user.rol));
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // Mapear strings YYYY-MM-DD a DateRange de react-day-picker
  const selectedDateRange = React.useMemo<DateRange | undefined>(() => {
    if (!fechaDesde) return undefined;
    const from = parse(fechaDesde, 'yyyy-MM-dd', new Date());
    const to = fechaHasta ? parse(fechaHasta, 'yyyy-MM-dd', new Date()) : undefined;
    if (isValid(from)) {
      return {
        from,
        to: to && isValid(to) ? to : undefined,
      };
    }
    return undefined;
  }, [fechaDesde, fechaHasta]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setFechaDesde('');
      setFechaHasta('');
      setFiltroPeriodo('todas');
      return;
    }
    if (range.from) {
      setFechaDesde(format(range.from, 'yyyy-MM-dd'));
    } else {
      setFechaDesde('');
    }
    if (range.to) {
      setFechaHasta(format(range.to, 'yyyy-MM-dd'));
      setFiltroPeriodo('personalizado');
      setPopoverOpen(false);
    } else {
      setFechaHasta('');
      setFiltroPeriodo('personalizado');
    }
  };

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

  const renderBadgeMetodoPago = (metodo?: string) => {
    switch (metodo?.toLowerCase()) {
      case 'yape':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#742284]/15 text-[#af52de] border border-[#af52de]/30">
            <Smartphone className="h-3 w-3 text-[#af52de]" />
            <span>Yape</span>
          </span>
        );
      case 'plin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00b4d8]/15 text-[#00b4d8] border border-[#00b4d8]/30">
            <Smartphone className="h-3 w-3 text-[#00b4d8]" />
            <span>Plin</span>
          </span>
        );
      case 'tarjeta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071e3]/15 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/30">
            <CreditCard className="h-3 w-3" />
            <span>Tarjeta</span>
          </span>
        );
      case 'transferencia':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Building2 className="h-3 w-3" />
            <span>Transf.</span>
          </span>
        );
      case 'efectivo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Banknote className="h-3 w-3" />
            <span>Efectivo</span>
          </span>
        );
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
        accessorKey: 'metodo_pago',
        header: ({ column }) => (
          <div className="text-center">
            <DataTableColumnHeader column={column} title="Método Pago" className="justify-center" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {renderBadgeMetodoPago(row.original.metodo_pago)}
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
              {v.tipo_comprobante !== 'nota_venta' && (
                <>
                  <a
                    href={`/api/ventas/${v.id}/xml?format=xml`}
                    download
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-[#0071e3] transition-colors"
                    title="Descargar XML UBL 2.1"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`/api/ventas/${v.id}/xml?format=cdr`}
                    download
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-emerald-500 transition-colors"
                    title="Descargar Constancia CDR SUNAT"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
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

  return (
    <div className="space-y-4">
      {/* TanStack Table con controles integrados */}
      <DataTable
        columns={columns}
        data={ventas}
        searchPlaceholder="Buscar por serie, número, cliente o DNI/RUC..."
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="No se encontraron comprobantes de venta con los filtros seleccionados."
        toolbarContent={
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector por Período de Fecha */}
              <div className="flex items-center gap-1 p-0.5 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] overflow-x-auto [scrollbar-width:none]">
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'hoy', label: 'Hoy' },
                  { id: 'ayer', label: 'Ayer' },
                  { id: '7dias', label: '7 Días' },
                  { id: 'mes', label: 'Este Mes' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFiltroPeriodo(p.id);
                      if (p.id !== 'personalizado') {
                        setFechaDesde('');
                        setFechaHasta('');
                      }
                    }}
                    className={`h-7 px-2.5 sm:px-3 flex items-center justify-center text-xs font-medium rounded-lg transition-all apple-press-feedback whitespace-nowrap cursor-pointer ${
                      filtroPeriodo === p.id
                        ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                {/* Selector de Rango con Calendar (mode="range") */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      title="Seleccionar rango de fechas en el calendario"
                      className={`h-7 px-2.5 flex items-center gap-1.5 justify-center text-xs font-medium rounded-lg transition-all apple-press-feedback cursor-pointer ${
                        filtroPeriodo === 'personalizado'
                          ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {selectedDateRange?.from ? (
                          selectedDateRange.to ? (
                            `${format(selectedDateRange.from, 'dd/MM')} - ${format(selectedDateRange.to, 'dd/MM')}`
                          ) : (
                            `Desde ${format(selectedDateRange.from, 'dd/MM')}`
                          )
                        ) : (
                          'Rango'
                        )}
                      </span>
                      {filtroPeriodo === 'personalizado' && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFechaDesde('');
                            setFechaHasta('');
                            setFiltroPeriodo('todas');
                          }}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                          title="Quitar filtro de rango"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-2xl border border-border/80 shadow-2xl bg-popover z-50 overflow-hidden"
                    align="end"
                  >
                    <div className="p-3 border-b border-border/60 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#0071e3]" />
                        <span>Rango de Fechas (Range Calendar)</span>
                      </span>
                      {(fechaDesde || fechaHasta) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFechaDesde('');
                            setFechaHasta('');
                            setFiltroPeriodo('todas');
                            setPopoverOpen(false);
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpiar
                        </Button>
                      )}
                    </div>

                    <div className="p-2">
                      <CalendarComponent
                        mode="range"
                        defaultMonth={selectedDateRange?.from || new Date()}
                        selected={selectedDateRange}
                        onSelect={handleRangeSelect}
                        numberOfMonths={2}
                        locale={es}
                      />
                    </div>

                    <div className="p-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-black/[0.01] dark:bg-white/[0.01]">
                      <span className="font-mono text-[11px]">
                        {selectedDateRange?.from && selectedDateRange.to
                          ? `${format(selectedDateRange.from, 'dd/MM/yyyy')} al ${format(selectedDateRange.to, 'dd/MM/yyyy')}`
                          : selectedDateRange?.from
                          ? `Seleccione fecha fin (desde ${format(selectedDateRange.from, 'dd/MM/yyyy')})`
                          : 'Haga clic en la fecha inicial y luego en la fecha final'}
                      </span>
                      {selectedDateRange?.from && selectedDateRange.to && (
                        <Button
                          size="sm"
                          onClick={() => setPopoverOpen(false)}
                          className="h-7 px-3 text-xs rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium cursor-pointer"
                        >
                          Aplicar Rango
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Segmented Control por Tipo de Comprobante */}
              <div className="flex items-center gap-1 p-0.5 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] overflow-x-auto [scrollbar-width:none]">
                {['todos', 'boleta', 'factura', 'nota_venta'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFiltroTipo(t)}
                    className={`h-7 px-3 flex items-center justify-center text-xs font-medium rounded-lg capitalize transition-all apple-press-feedback whitespace-nowrap cursor-pointer ${
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
                    if (ventas.length === 0) {
                      toast.error('No hay comprobantes para exportar con el filtro actual');
                      return;
                    }
                    await exportVentasToExcel(ventas);
                    toast.success(`Registro de ventas exportado (${ventas.length} comprobantes)`);
                  } catch (err: any) {
                    toast.error('Error al exportar ventas: ' + (err.message || ''));
                  }
                }}
                className="h-9 px-3 text-xs font-medium rounded-xl border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Exportar Excel</span>
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
