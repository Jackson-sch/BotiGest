'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Percent,
  Search,
  PackageCheck,
  Save,
  Clock,
  Layers,
  Info,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import type { Proveedor, CompraItemInput } from '../types';
import type { ProductoItem, PresentacionItem } from '@/features/productos/types';
import { registrarCompraAction, recibirCompraAction } from '../actions';
import { toast } from 'sonner';

interface NuevaCompraPageViewProps {
  proveedores: Proveedor[];
  productos: ProductoItem[];
}

export function NuevaCompraPageView({
  proveedores,
  productos,
}: NuevaCompraPageViewProps) {
  const router = useRouter();

  // Datos del comprobante
  const [selectedProveedorId, setSelectedProveedorId] = React.useState<string>(
    proveedores[0]?.id || ''
  );
  const [tipoDocumento, setTipoDocumento] = React.useState<
    'factura' | 'boleta' | 'guia_remision' | 'otro'
  >('factura');
  const [serieNumero, setSerieNumero] = React.useState('');
  const [fechaEmision, setFechaEmision] = React.useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [observacion, setObservacion] = React.useState('');

  // Percepción SUNAT
  const [aplicaPercepcion, setAplicaPercepcion] = React.useState(false);
  const [tasaPercepcion, setTasaPercepcion] = React.useState<number>(1); // 1% o 2%

  // Items en la factura
  const [items, setItems] = React.useState<CompraItemInput[]>([]);

  // Estado del selector de medicamento para nueva línea
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProducto, setSelectedProducto] = React.useState<ProductoItem | null>(null);
  const [selectedPresentacion, setSelectedPresentacion] = React.useState<PresentacionItem | null>(null);
  const [lineLote, setLineLote] = React.useState('');
  const [lineVencimiento, setLineVencimiento] = React.useState('');
  const [lineCantidad, setLineCantidad] = React.useState<number>(1);
  const [lineCosto, setLineCosto] = React.useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Estados de carga
  const [isSubmitting, setIsSubmitting] = React.useState<'borrador' | 'almacen' | null>(null);

  // Referencias para autofoco ágil y click outside
  const loteInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Proveedor seleccionado actualmente
  const proveedorActual = React.useMemo(() => {
    return proveedores.find((p) => p.id === selectedProveedorId);
  }, [proveedores, selectedProveedorId]);

  // Filtrado de medicamentos
  const productosFiltrados = React.useMemo(() => {
    if (!searchQuery.trim()) return productos.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return productos
      .filter(
        (p) =>
          p.nombre_comercial.toLowerCase().includes(q) ||
          (p.nombre_generico && p.nombre_generico.toLowerCase().includes(q)) ||
          p.codigo_interno.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [productos, searchQuery]);

  // Seleccionar producto desde el buscador
  const handleSelectProducto = (p: ProductoItem) => {
    setSelectedProducto(p);
    setIsSearchOpen(false);
    setSearchQuery(p.nombre_comercial);

    // Seleccionar presentación por defecto
    const defaultPres =
      p.presentaciones.find((pres) => pres.es_default) ||
      p.presentaciones[0] ||
      null;

    setSelectedPresentacion(defaultPres);
    setLineCosto(
      defaultPres
        ? Number((defaultPres.precio_venta * 0.7).toFixed(2))
        : Number((p.costo_promedio || 0).toFixed(2))
    );
    setLineCantidad(1);
    setLineLote('');
    setLineVencimiento('');

    // Foco en Lote
    setTimeout(() => {
      loteInputRef.current?.focus();
    }, 100);
  };

  // Limpiar búsqueda y resetear selección
  const handleLimpiarBusqueda = () => {
    setSearchQuery('');
    setSelectedProducto(null);
    setIsSearchOpen(false);
    searchInputRef.current?.focus();
  };

  // Calcular alerta FEFO de fecha de vencimiento
  const calcularEstadoVencimiento = (fechaStr: string) => {
    if (!fechaStr) return null;
    const vto = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    const diffMeses =
      (vto.getFullYear() - hoy.getFullYear()) * 12 +
      (vto.getMonth() - hoy.getMonth());

    if (diffMeses <= 0) {
      return {
        tipo: 'vencido',
        texto: 'Vencido (Rechazar Lote)',
        color: 'bg-red-500/10 text-red-500 border-red-500/20',
      };
    }
    if (diffMeses < 6) {
      return {
        tipo: 'critico',
        texto: `Vence en ${diffMeses} m (Crítico DIGEMID)`,
        color: 'bg-red-500/10 text-red-400 border-red-500/30',
      };
    }
    if (diffMeses <= 18) {
      return {
        tipo: 'alerta',
        texto: `Vence en ${diffMeses} m (FEFO Vigilado)`,
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      };
    }
    return {
      tipo: 'optimo',
      texto: `Vence en ${diffMeses} m (Vigencia Óptima)`,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    };
  };

  // Agregar ítem actual a la tabla
  const handleAgregarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedProducto) {
      toast.error('Seleccione un medicamento del catálogo.');
      return;
    }
    if (!selectedPresentacion) {
      toast.error('El producto seleccionado no tiene presentaciones válidas.');
      return;
    }
    if (!lineLote.trim()) {
      toast.error('El número de lote es obligatorio según norma DIGEMID.');
      loteInputRef.current?.focus();
      return;
    }
    if (!lineVencimiento) {
      toast.error('Indique la fecha de vencimiento del lote.');
      return;
    }

    const estadoVto = calcularEstadoVencimiento(lineVencimiento);
    if (estadoVto?.tipo === 'vencido') {
      toast.error('No se permite ingresar a almacén productos con fecha ya expirada.');
      return;
    }

    if (lineCantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0.');
      return;
    }
    if (lineCosto < 0) {
      toast.error('El costo unitario no puede ser negativo.');
      return;
    }

    const nuevoItem: CompraItemInput = {
      producto_id: selectedProducto.id,
      producto_nombre: selectedProducto.nombre_comercial,
      presentacion_id: selectedPresentacion.id || 'pres-default',
      presentacion_nombre: selectedPresentacion.nombre,
      factor_base: selectedPresentacion.factor_base || 1,
      numero_lote: lineLote.trim().toUpperCase(),
      fecha_vencimiento: lineVencimiento,
      cantidad: Number(lineCantidad),
      costo_unitario_presentacion: Number(lineCosto),
    };

    setItems((prev) => [...prev, nuevoItem]);

    // Limpiar formulario de línea
    setSelectedProducto(null);
    setSelectedPresentacion(null);
    setSearchQuery('');
    setLineLote('');
    setLineVencimiento('');
    setLineCantidad(1);
    setLineCosto(0);

    toast.success(`${nuevoItem.producto_nombre} agregado a la factura.`);

    // Foco de vuelta al buscador
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleEliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActualizarItem = (
    index: number,
    field: keyof CompraItemInput,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Cálculos contables
  const subtotalNeto = items.reduce(
    (acc, it) => acc + it.cantidad * it.costo_unitario_presentacion,
    0
  );
  const igv = subtotalNeto * 0.18;
  const montoPercepcion = aplicaPercepcion
    ? (subtotalNeto + igv) * (tasaPercepcion / 100)
    : 0;
  const totalGeneral = subtotalNeto + igv + montoPercepcion;

  // Enviar formulario
  const handleGuardar = async (modo: 'borrador' | 'almacen') => {
    if (!selectedProveedorId) {
      toast.error('Seleccione un proveedor o droguería.');
      return;
    }
    if (!serieNumero.trim()) {
      toast.error('Ingrese el número de comprobante de la droguería (ej. F001-002490).');
      return;
    }
    if (items.length === 0) {
      toast.error('Debe agregar al menos un medicamento a la compra.');
      return;
    }

    setIsSubmitting(modo);

    try {
      // 1. Registrar compra en borrador
      const res = await registrarCompraAction({
        proveedor_id: selectedProveedorId,
        tipo_documento: tipoDocumento,
        serie_numero: serieNumero.trim().toUpperCase(),
        fecha_emision: fechaEmision,
        observacion:
          observacion.trim() +
          (aplicaPercepcion
            ? ` | Percepción SUNAT (${tasaPercepcion}%): S/ ${montoPercepcion.toFixed(2)}`
            : ''),
        items,
      });

      if (!res.success || !res.compraId) {
        toast.error(res.error || 'Error al guardar la compra');
        setIsSubmitting(null);
        return;
      }

      // 2. Si se solicitó ingresar directamente a almacén, ejecutar recepción física
      if (modo === 'almacen') {
        const resRecibir = await recibirCompraAction({
          compra_id: res.compraId,
        });

        if (!resRecibir.success) {
          toast.warning(
            'La compra se guardó como borrador, pero ocurrió un error al ingresar a almacén: ' +
              resRecibir.error
          );
          router.push('/compras');
          return;
        }

        toast.success(
          '¡Compra ingresada a almacén exitosamente! Stock, lotes y Kardex actualizados.'
        );
      } else {
        toast.success('Compra guardada en estado borrador para revisión posterior.');
      }

      router.push('/compras');
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error inesperado al procesar la compra.');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Barra superior de navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <Link
            href="/compras"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Volver a Compras & Recepción</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-apple-display text-foreground">
                Nueva Compra a Droguería / Proveedor
              </h1>
              <p className="text-xs text-muted-foreground tracking-apple-body">
                Comprobante de compra, control FEFO de lotes y registro en Kardex (DIGEMID / BPA)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-full text-xs font-medium border-emerald-500/30 text-emerald-500 bg-emerald-500/5 flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Control BPA Activo</span>
          </Badge>
        </div>
      </div>

      {/* Grid Principal: Formulario Master/Detail y Sidebar de Totales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (8 cols): Cabecera + Adición de Lotes + Tabla */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tarjeta 1: Cabecera del Comprobante */}
          <Card className="p-5 apple-glass rounded-2xl space-y-4 border border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-[#0071e3]" />
              <span>Datos del Comprobante Fiscal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Proveedor */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Droguería / Proveedor *</span>
                  {proveedorActual && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      RUC: {proveedorActual.ruc}
                    </span>
                  )}
                </label>
                <Select
                  value={selectedProveedorId}
                  onValueChange={setSelectedProveedorId}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border text-xs">
                    <SelectValue placeholder="Seleccione droguería..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {proveedores.map((prov) => (
                      <SelectItem
                        key={prov.id}
                        value={prov.id}
                        className="text-xs py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{prov.razon_social}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            RUC: {prov.ruc}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Documento */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Tipo Comprobante *
                </label>
                <Select
                  value={tipoDocumento}
                  onValueChange={(val: any) => setTipoDocumento(val)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="factura">Factura Electrónica</SelectItem>
                    <SelectItem value="boleta">Boleta de Venta</SelectItem>
                    <SelectItem value="guia_remision">Guía de Remisión</SelectItem>
                    <SelectItem value="otro">Nota de Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Serie y Número */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  N° Serie - Correlativo *
                </label>
                <Input
                  placeholder="Ej. F001-002490"
                  value={serieNumero}
                  onChange={(e) => setSerieNumero(e.target.value)}
                  className="h-10 rounded-xl font-mono text-xs uppercase"
                  required
                />
              </div>

              {/* Fecha de Emisión */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Fecha de Emisión *
                </label>
                <DatePicker
                  value={fechaEmision}
                  onChange={setFechaEmision}
                  className="h-10 rounded-xl text-xs bg-background"
                />
              </div>

              {/* Observación / Almacén */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Observaciones de Recepción / Precinto de Seguridad
                </label>
                <Input
                  placeholder="Ej. Bulto sellado con precinto de seguridad intacto, sin cajas abolladas."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Tarjeta 2: Formulario de Captura de Medicamentos y Lotes */}
          <Card className="p-5 apple-glass rounded-2xl space-y-4 border border-border relative z-20">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers className="h-4 w-4 text-emerald-500" />
                <span>Agregar Medicamento & Lote a la Factura</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Norma DIGEMID: Todo ítem requiere N° de Lote y Fecha de Vto.
              </span>
            </div>

            {/* Selector interactivo con Buscador */}
            <div className="space-y-3">
              <div ref={searchContainerRef} className="relative z-30">
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Buscar Medicamento en Catálogo (Nombre, DCI o Código) *
                </label>
                <div className="relative flex items-center">
                  <Input
                    ref={searchInputRef}
                    placeholder="Escriba el nombre del medicamento, ej. Paracetamol, Amoxicilina, Panadol..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) {
                        setIsSearchOpen(true);
                      }
                    }}
                    className="pl-9 pr-9 h-10 rounded-xl text-xs bg-background"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimpiarBusqueda}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10"
                      title="Limpiar búsqueda (Esc)"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown de resultados de medicamentos */}
                {isSearchOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-2xl max-h-72 overflow-y-auto apple-scrollbar overscroll-contain divide-y divide-border/40">
                    {productosFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No se encontraron medicamentos activos con ese criterio.
                      </div>
                    ) : (
                      productosFiltrados.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProducto(p)}
                          className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800/90 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              <span>{p.nombre_comercial}</span>
                              {p.es_controlado && (
                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                  Controlado
                                </Badge>
                              )}
                              {p.requiere_cadena_frio && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-blue-500/10 text-blue-400">
                                  Cadena Frío
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>DCI: {p.nombre_generico || 'N/A'}</span>
                              <span>•</span>
                              <span>{p.laboratorio_nombre || 'Laboratorio'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {p.codigo_interno}
                            </span>
                            <div className="text-[11px] text-emerald-500">
                              {p.presentaciones.length} presentación(es)
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Fila de Campos del Medicamento Seleccionado */}
              {selectedProducto && (
                <div className="p-4 rounded-xl bg-accent/20 border border-border/60 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/30">
                    <div>
                      <span className="text-[11px] text-muted-foreground font-mono uppercase">
                        Medicamento seleccionado:
                      </span>
                      <h4 className="font-semibold text-sm text-foreground">
                        {selectedProducto.nombre_comercial}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedProducto.nombre_generico} • {selectedProducto.concentracion || 'Sin concentración'} • {selectedProducto.laboratorio_nombre || ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProducto(null)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
                    >
                      Cambiar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    {/* Presentación */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Presentación *
                      </label>
                      <Select
                        value={selectedPresentacion?.id || ''}
                        onValueChange={(val) => {
                          const pres = selectedProducto.presentaciones.find(
                            (pr) => pr.id === val
                          );
                          if (pres) {
                            setSelectedPresentacion(pres);
                            setLineCosto(pres.precio_venta * 0.7);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl bg-background border-border text-xs">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {selectedProducto.presentaciones.map((pres) => (
                            <SelectItem
                              key={pres.id}
                              value={pres.id || 'default'}
                              className="text-xs"
                            >
                              {pres.nombre} (x{pres.factor_base})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lote */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        N° Lote (BPA) *
                      </label>
                      <Input
                        ref={loteInputRef}
                        placeholder="Ej. L-2026-X1"
                        value={lineLote}
                        onChange={(e) => setLineLote(e.target.value.toUpperCase())}
                        className="h-9 rounded-xl font-mono text-xs uppercase bg-background"
                      />
                    </div>

                    {/* Vencimiento */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-foreground">
                          Fecha Vto. *
                        </label>
                      </div>
                      <DatePicker
                        value={lineVencimiento}
                        onChange={setLineVencimiento}
                        placeholder="Vto. lote"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>

                    {/* Cantidad y Costo */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Cantidad *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={lineCantidad}
                        onChange={(e) => setLineCantidad(parseInt(e.target.value) || 1)}
                        className="h-9 rounded-xl font-mono text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Costo Unit. (S/) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={lineCosto}
                        onChange={(e) => setLineCosto(parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-xl font-mono text-xs bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarItem();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Alerta FEFO y Subtotal del Ítem */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      {lineVencimiento && (
                        (() => {
                          const alerta = calcularEstadoVencimiento(lineVencimiento);
                          if (!alerta) return null;
                          return (
                            <Badge
                              variant="outline"
                              className={`text-[11px] py-1 px-2.5 rounded-lg border ${alerta.color}`}
                            >
                              <Clock className="h-3 w-3 mr-1 inline" />
                              {alerta.texto}
                            </Badge>
                          );
                        })()
                      )}
                      {selectedPresentacion && selectedPresentacion.factor_base > 1 && (
                        <span className="text-[11px] text-muted-foreground">
                          Costo base unitario equiv.:{' '}
                          <strong className="font-mono text-foreground">
                            {formatMoney(lineCosto / selectedPresentacion.factor_base)}
                          </strong>{' '}
                          por unidad
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs text-muted-foreground">
                        Subtotal Renglón:{' '}
                        <strong className="font-mono text-sm text-foreground">
                          {formatMoney(lineCantidad * lineCosto)}
                        </strong>
                      </span>
                      <Button
                        type="button"
                        onClick={() => handleAgregarItem()}
                        className="h-9 px-4 rounded-xl text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Agregar a la Factura
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tarjeta 3: Tabla Detalle de Ítems de la Factura */}
          <Card className="p-0 apple-glass rounded-2xl overflow-hidden border border-border">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="font-semibold text-sm text-foreground">
                  Líneas de la Compra ({items.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total Unidades Base:{' '}
                {items.reduce((acc, it) => acc + it.cantidad * it.factor_base, 0)}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-muted/30 text-muted-foreground mx-auto flex items-center justify-center">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <h4 className="font-medium text-sm text-foreground">
                  No hay ítems agregados a esta factura
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Utilice el buscador superior para seleccionar un medicamento, ingresar su lote y fecha de vencimiento.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                      <th className="py-2.5 px-4 font-medium">Medicamento & Presentación</th>
                      <th className="py-2.5 px-3 font-medium">Lote & Vencimiento (FEFO)</th>
                      <th className="py-2.5 px-3 font-medium text-center">Cant.</th>
                      <th className="py-2.5 px-3 font-medium text-right">Costo Pres.</th>
                      <th className="py-2.5 px-3 font-medium text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center font-medium w-12">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {items.map((it, idx) => {
                      const alertaVto = calcularEstadoVencimiento(it.fecha_vencimiento);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          {/* Medicamento & Presentación */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">
                              {it.producto_nombre}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {it.presentacion_nombre} (x{it.factor_base} unid.)
                            </div>
                          </td>

                          {/* Lote & Vencimiento */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-foreground">
                              <span>Lote:</span>
                              <input
                                value={it.numero_lote}
                                onChange={(e) =>
                                  handleActualizarItem(
                                    idx,
                                    'numero_lote',
                                    e.target.value.toUpperCase()
                                  )
                                }
                                className="w-24 bg-transparent border-b border-border/40 text-xs uppercase focus:outline-none focus:border-foreground"
                              />
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {it.fecha_vencimiento}
                              </span>
                              {alertaVto && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded border ${alertaVto.color}`}
                                >
                                  {alertaVto.texto}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cantidad */}
                          <td className="py-3 px-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={it.cantidad}
                              onChange={(e) =>
                                handleActualizarItem(
                                  idx,
                                  'cantidad',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-8 w-16 mx-auto text-center font-mono text-xs rounded-lg"
                            />
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                              ={it.cantidad * it.factor_base} u
                            </div>
                          </td>

                          {/* Costo */}
                          <td className="py-3 px-3 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={it.costo_unitario_presentacion}
                              onChange={(e) =>
                                handleActualizarItem(
                                  idx,
                                  'costo_unitario_presentacion',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 w-20 ml-auto text-right font-mono text-xs rounded-lg"
                            />
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                              {formatMoney(
                                it.costo_unitario_presentacion / it.factor_base
                              )}
                              /u
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                            {formatMoney(
                              it.cantidad * it.costo_unitario_presentacion
                            )}
                          </td>

                          {/* Eliminar */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarItem(idx)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Eliminar renglón"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha (4 cols): Resumen Contable & Botones de Acción */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Card Resumen de Liquidación */}
          <Card className="p-5 apple-glass rounded-2xl space-y-4 border border-border shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">
                Liquidación del Comprobante
              </h3>
              <Badge variant="outline" className="text-[11px] font-mono">
                PEN (S/)
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Renglones / Ítems:</span>
                <span className="font-mono text-foreground font-semibold">
                  {items.length}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Base Imponible (Subtotal):</span>
                <span className="font-mono text-foreground font-semibold">
                  {formatMoney(subtotalNeto)}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>IGV (18.0%):</span>
                <span className="font-mono text-foreground font-semibold">
                  {formatMoney(igv)}
                </span>
              </div>

              {/* Percepción SUNAT */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={aplicaPercepcion}
                      onChange={(e) => setAplicaPercepcion(e.target.checked)}
                      className="rounded border-border text-[#0071e3] focus:ring-0"
                    />
                    <span>Percepción SUNAT</span>
                  </label>
                  {aplicaPercepcion && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTasaPercepcion(1)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                          tasaPercepcion === 1
                            ? 'bg-[#0071e3] text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        1%
                      </button>
                      <button
                        type="button"
                        onClick={() => setTasaPercepcion(2)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                          tasaPercepcion === 2
                            ? 'bg-[#0071e3] text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        2%
                      </button>
                    </div>
                  )}
                </div>

                {aplicaPercepcion && (
                  <div className="flex justify-between items-center text-amber-500 font-mono text-[11px] pl-5">
                    <span>Monto Percepción ({tasaPercepcion}%):</span>
                    <span>+{formatMoney(montoPercepcion)}</span>
                  </div>
                )}
              </div>

              {/* Total Final */}
              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-bold text-sm text-foreground">TOTAL FACTURA:</span>
                <span className="font-mono text-2xl font-bold text-emerald-500">
                  {formatMoney(totalGeneral)}
                </span>
              </div>
            </div>

            {/* Aviso BPA / DIGEMID */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground flex gap-2 items-start">
              <Info className="h-4 w-4 text-[#0071e3] shrink-0 mt-0.5" />
              <span>
                Al ingresar a almacén, se actualizará el stock disponible en inventario y se recalculará el costo promedio ponderado de cada medicamento.
              </span>
            </div>

            {/* Acciones */}
            <div className="pt-3 space-y-2.5">
              <Button
                type="button"
                onClick={() => handleGuardar('almacen')}
                disabled={isSubmitting !== null || items.length === 0}
                className="w-full h-11 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white apple-press-feedback gap-2 text-xs shadow-md shadow-emerald-500/20"
              >
                <PackageCheck className="h-4 w-4" />
                <span>
                  {isSubmitting === 'almacen'
                    ? 'Procesando e Ingresando...'
                    : 'Ingresar a Almacén Directamente'}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleGuardar('borrador')}
                disabled={isSubmitting !== null || items.length === 0}
                className="w-full h-10 rounded-xl font-medium border-border gap-2 text-xs hover:bg-muted/30"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {isSubmitting === 'borrador'
                    ? 'Guardando...'
                    : 'Guardar como Borrador (Sin Ingreso Físico)'}
                </span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/compras')}
                disabled={isSubmitting !== null}
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
