'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Barcode,
  ThermometerSnowflake,
  ShieldCheck,
  Building,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';

import { guardarProductoAction } from '../actions';
import type { ProductoItem, PresentacionItem, CatalogoAuxiliares } from '../types';

interface ModalProductoFormProps {
  producto: ProductoItem | null; // null si es nuevo
  auxiliares: CatalogoAuxiliares;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalProductoForm({
  producto,
  auxiliares,
  isOpen,
  onClose,
  onSuccess,
}: ModalProductoFormProps) {
  const isEditing = !!producto;

  // Form State
  const [codigoInterno, setCodigoInterno] = React.useState('');
  const [nombreComercial, setNombreComercial] = React.useState('');
  const [nombreGenerico, setNombreGenerico] = React.useState('');
  const [concentracion, setConcentracion] = React.useState('');
  const [formaId, setFormaId] = React.useState<number | ''>('');
  const [laboratorioId, setLaboratorioId] = React.useState<string>('');
  const [categoriaId, setCategoriaId] = React.useState<string>('');
  const [registroSanitario, setRegistroSanitario] = React.useState('');
  const [condicionVenta, setCondicionVenta] = React.useState<any>('sin_receta');
  const [esControlado, setEsControlado] = React.useState(false);
  const [esGenerico, setEsGenerico] = React.useState(false);
  const [requiereCadenaFrio, setRequiereCadenaFrio] = React.useState(false);
  const [unidadBase, setUnidadBase] = React.useState('UNIDAD');
  const [tipoIgv, setTipoIgv] = React.useState<'gravado' | 'exonerado' | 'inafecto'>('gravado');
  const [costoUltimo, setCostoUltimo] = React.useState<number>(0);
  const [activo, setActivo] = React.useState(true);

  // Presentaciones
  const [presentaciones, setPresentaciones] = React.useState<PresentacionItem[]>([
    { nombre: 'Unidad', factor_base: 1, codigo_barras: '', precio_venta: 0, es_default: true, activo: true },
  ]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (producto) {
        setCodigoInterno(producto.codigo_interno);
        setNombreComercial(producto.nombre_comercial);
        setNombreGenerico(producto.nombre_generico || '');
        setConcentracion(producto.concentracion || '');
        setFormaId(producto.forma_farmaceutica_id || '');
        setLaboratorioId(producto.laboratorio_id || '');
        setCategoriaId(producto.categoria_id || '');
        setRegistroSanitario(producto.registro_sanitario || '');
        setCondicionVenta(producto.condicion_venta);
        setEsControlado(producto.es_controlado);
        setEsGenerico(producto.es_generico);
        setRequiereCadenaFrio(producto.requiere_cadena_frio);
        setUnidadBase(producto.unidad_base || 'UNIDAD');
        setTipoIgv(producto.tipo_afectacion_igv);
        setCostoUltimo(producto.costo_ultimo || 0);
        setActivo(producto.activo);
        setPresentaciones(
          producto.presentaciones.length > 0
            ? producto.presentaciones
            : [{ nombre: 'Unidad', factor_base: 1, codigo_barras: '', precio_venta: 0, es_default: true, activo: true }]
        );
      } else {
        // Inicializar nuevo
        const randomCode = 'MED-' + Math.floor(1000 + Math.random() * 9000);
        setCodigoInterno(randomCode);
        setNombreComercial('');
        setNombreGenerico('');
        setConcentracion('');
        setFormaId(auxiliares.formas[0]?.id || '');
        setLaboratorioId(auxiliares.laboratorios[0]?.id || '');
        setCategoriaId(auxiliares.categorias[0]?.id || '');
        setRegistroSanitario('');
        setCondicionVenta('sin_receta');
        setEsControlado(false);
        setEsGenerico(false);
        setRequiereCadenaFrio(false);
        setUnidadBase('UNIDAD');
        setTipoIgv('gravado');
        setCostoUltimo(0);
        setActivo(true);
        setPresentaciones([
          { nombre: 'Unidad', factor_base: 1, codigo_barras: '', precio_venta: 0, es_default: true, activo: true },
        ]);
      }
    }
  }, [isOpen, producto, auxiliares]);

  if (!isOpen) return null;

  const handleAddPresentacion = () => {
    setPresentaciones([
      ...presentaciones,
      {
        nombre: 'Caja x' + (presentaciones.length === 1 ? '10' : '100'),
        factor_base: presentaciones.length === 1 ? 10 : 100,
        codigo_barras: '',
        precio_venta: 0,
        es_default: false,
        activo: true,
      },
    ]);
  };

  const handleRemovePresentacion = (index: number) => {
    if (presentaciones.length <= 1) {
      toast.error('El fármaco debe tener al menos una presentación');
      return;
    }
    const updated = presentaciones.filter((_, i) => i !== index);
    if (!updated.some((p) => p.es_default)) {
      updated[0].es_default = true;
    }
    setPresentaciones(updated);
  };

  const handleUpdatePresentacion = (index: number, field: keyof PresentacionItem, val: any) => {
    const updated = [...presentaciones];
    if (field === 'es_default' && val === true) {
      updated.forEach((p, i) => {
        p.es_default = i === index;
      });
    } else {
      (updated[index] as any)[field] = val;
    }
    setPresentaciones(updated);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreComercial.trim()) {
      toast.error('El nombre comercial es obligatorio');
      return;
    }
    if (!codigoInterno.trim()) {
      toast.error('El código interno es obligatorio');
      return;
    }
    if (presentaciones.length === 0) {
      toast.error('Debe configurar al menos una presentación');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await guardarProductoAction({
        id: producto?.id,
        codigo_interno: codigoInterno.trim().toUpperCase(),
        nombre_comercial: nombreComercial.trim(),
        nombre_generico: nombreGenerico.trim() || null,
        concentracion: concentracion.trim() || null,
        forma_farmaceutica_id: formaId ? Number(formaId) : null,
        laboratorio_id: laboratorioId || null,
        categoria_id: categoriaId || null,
        registro_sanitario: registroSanitario.trim() || null,
        condicion_venta: condicionVenta,
        es_controlado: ['psicotropico', 'estupefaciente'].includes(condicionVenta) || esControlado,
        es_generico: esGenerico,
        requiere_cadena_frio: requiereCadenaFrio,
        unidad_base: unidadBase.trim().toUpperCase() || 'UNIDAD',
        unidad_medida_sunat: 'NIU',
        tipo_afectacion_igv: tipoIgv,
        costo_ultimo: Number(costoUltimo) || 0,
        activo,
        presentaciones: presentaciones.map((p) => ({
          id: p.id,
          nombre: p.nombre.trim(),
          factor_base: Number(p.factor_base) || 1,
          precio_venta: Number(p.precio_venta) || 0,
          codigo_barras: p.codigo_barras?.trim() || null,
          es_default: p.es_default,
          activo: p.activo ?? true,
        })),
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo guardar el fármaco.');
        return;
      }

      toast.success(
        isEditing
          ? `Medicamento "${nombreComercial}" actualizado con éxito.`
          : `Medicamento "${nombreComercial}" creado con éxito.`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop glass */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-2xl bg-white dark:bg-[#161618] border border-border shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/15 border border-[#0071e3]/30 flex items-center justify-center text-[#2997ff]">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isEditing ? 'Editar Fármaco / Producto' : 'Nuevo Fármaco en Catálogo'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  DIGEMID Ley 29459 · Trazabilidad de presentaciones y precios
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {/* 1. SECCIÓN: IDENTIFICACIÓN PRINCIPAL */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-[#2997ff]" />
                Identificación Farmacéutica
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Código Interno *</label>
                  <Input
                    type="text"
                    value={codigoInterno}
                    onChange={(e) => setCodigoInterno(e.target.value)}
                    placeholder="MED-1001"
                    className="h-9 bg-background/60 font-mono text-xs uppercase"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Nombre Comercial *</label>
                  <Input
                    type="text"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                    placeholder="Ej. Panadol Antigripal"
                    className="h-9 bg-background/60 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Principio Activo (DCI) / Genérico
                  </label>
                  <Input
                    type="text"
                    value={nombreGenerico}
                    onChange={(e) => setNombreGenerico(e.target.value)}
                    placeholder="Ej. Paracetamol + Clorfenamina"
                    className="h-9 bg-background/60 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Concentración</label>
                  <Input
                    type="text"
                    value={concentracion}
                    onChange={(e) => setConcentracion(e.target.value)}
                    placeholder="Ej. 500mg / 4mg"
                    className="h-9 bg-background/60 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Forma Farmacéutica</label>
                  <Select
                    value={formaId ? String(formaId) : undefined}
                    onValueChange={(val) => setFormaId(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Seleccionar forma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {auxiliares.formas.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.nombre} {f.abreviatura ? `(${f.abreviatura})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Laboratorio / Titular</label>
                  <Select
                    value={laboratorioId || undefined}
                    onValueChange={(val) => setLaboratorioId(val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Seleccionar laboratorio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {auxiliares.laboratorios.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Categoría</label>
                  <Select
                    value={categoriaId || undefined}
                    onValueChange={(val) => setCategoriaId(val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      {auxiliares.categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. SECCIÓN: REGULACIÓN SANITARIA & TRIBUTARIA */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                Regulación Sanitaria DIGEMID & SUNAT
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Registro Sanitario DIGEMID</label>
                  <Input
                    type="text"
                    value={registroSanitario}
                    onChange={(e) => setRegistroSanitario(e.target.value)}
                    placeholder="Ej. EN-01234"
                    className="h-9 bg-background/60 font-mono text-xs uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Condición de Venta *</label>
                  <Select
                    value={condicionVenta}
                    onValueChange={(val) => setCondicionVenta(val as any)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Condición de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin_receta">Sin Receta (Venta Libre / OTC)</SelectItem>
                      <SelectItem value="con_receta">Con Receta Médica Simple</SelectItem>
                      <SelectItem value="receta_retenida">Con Receta Retenida</SelectItem>
                      <SelectItem value="psicotropico">Psicotrópico (Lista IV B DIGEMID)</SelectItem>
                      <SelectItem value="estupefaciente">Estupefaciente (Lista II DIGEMID)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Afectación IGV</label>
                  <Select
                    value={tipoIgv}
                    onValueChange={(val: any) => setTipoIgv(val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Afectación IGV" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gravado">Gravado (18% IGV)</SelectItem>
                      <SelectItem value="exonerado">Exonerado de IGV</SelectItem>
                      <SelectItem value="inafecto">Inafecto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              {/* Switches Farmacéuticos con Shadcn Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label
                  htmlFor="modal-chk-cadena-frio"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                >
                  <Checkbox
                    id="modal-chk-cadena-frio"
                    checked={requiereCadenaFrio}
                    onCheckedChange={(checked) => setRequiereCadenaFrio(!!checked)}
                  />
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ThermometerSnowflake className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Requiere Cadena de Frío (2°C - 8°C)</span>
                  </div>
                </label>

                <label
                  htmlFor="modal-chk-dci-esencial"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                >
                  <Checkbox
                    id="modal-chk-dci-esencial"
                    checked={esGenerico}
                    onCheckedChange={(checked) => setEsGenerico(!!checked)}
                  />
                  <span className="text-xs font-medium text-foreground">
                    Es Genérico Esencial (Catálogo MINSA)
                  </span>
                </label>
              </div>
            </div>

            {/* 3. SECCIÓN: PRESENTACIONES Y PRECIOS AL PÚBLICO */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-amber-400" />
                    Presentaciones Comerciales & Fraccionamiento
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Cada presentación tiene su propio precio de venta y código de barras para el lector USB.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPresentacion}
                  className="h-7 text-xs rounded-xl gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-2">
                {presentaciones.map((pres, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-border/50 bg-background/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    {/* Nombre */}
                    <div className="sm:col-span-3 space-y-0.5">
                      <label className="text-[10px] text-muted-foreground">Presentación</label>
                      <Input
                        type="text"
                        value={pres.nombre}
                        onChange={(e) => handleUpdatePresentacion(idx, 'nombre', e.target.value)}
                        placeholder="Ej. Blíster x10"
                        className="h-8 text-xs font-medium bg-background/80"
                        required
                      />
                    </div>

                    {/* Factor Base */}
                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="text-[10px] text-muted-foreground">Factor ({unidadBase})</label>
                      <Input
                        type="number"
                        min={1}
                        value={pres.factor_base}
                        onChange={(e) => handleUpdatePresentacion(idx, 'factor_base', Number(e.target.value))}
                        className="h-8 text-xs font-mono font-semibold bg-background/80"
                        required
                      />
                    </div>

                    {/* Código de barras USB */}
                    <div className="sm:col-span-3 space-y-0.5">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Barcode className="h-3 w-3" />
                        Código de Barras
                      </label>
                      <Input
                        type="text"
                        value={pres.codigo_barras || ''}
                        onChange={(e) => handleUpdatePresentacion(idx, 'codigo_barras', e.target.value)}
                        placeholder="775123456789"
                        className="h-8 text-xs font-mono bg-background/80"
                      />
                    </div>

                    {/* Precio de Venta S/ */}
                    <div className="sm:col-span-3 space-y-0.5">
                      <label className="text-[10px] text-muted-foreground font-semibold text-emerald-400">
                        Precio Venta (S/.)
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        min={0}
                        value={pres.precio_venta}
                        onChange={(e) => handleUpdatePresentacion(idx, 'precio_venta', Number(e.target.value))}
                        className="h-8 text-xs font-mono font-bold text-foreground bg-background/80 focus:border-emerald-500"
                        required
                      />
                    </div>

                    {/* Botón eliminar */}
                    <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemovePresentacion(idx)}
                        disabled={presentaciones.length <= 1}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="h-9 px-5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-lg shadow-[#0071e3]/25"
              >
                {isSubmitting ? (
                  'Guardando...'
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {isEditing ? 'Guardar Cambios' : 'Registrar Fármaco'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
