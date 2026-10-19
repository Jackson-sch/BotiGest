'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { guardarProductoAction, crearFormaFarmaceuticaAction } from '../actions';
import type { ProductoItem, PresentacionItem, CatalogoAuxiliares } from '../types';
import {
  ProductoFormHeader,
  ProductoIdentificacionCard,
  ProductoRegulacionCard,
  ProductoPresentacionesCard,
  ModalNuevaForma,
} from './form';

interface ProductoFormViewProps {
  producto?: ProductoItem | null;
  auxiliares: CatalogoAuxiliares;
}

export function ProductoFormView({ producto, auxiliares }: ProductoFormViewProps) {
  const router = useRouter();
  const isEditing = !!producto;

  // Form State
  const [codigoInterno, setCodigoInterno] = React.useState(
    producto?.codigo_interno || 'MED-' + Math.floor(1000 + Math.random() * 9000)
  );
  const [nombreComercial, setNombreComercial] = React.useState(producto?.nombre_comercial || '');
  const [nombreGenerico, setNombreGenerico] = React.useState(producto?.nombre_generico || '');
  const [concentracion, setConcentracion] = React.useState(producto?.concentracion || '');
  const [formaId, setFormaId] = React.useState<number | ''>(
    producto?.forma_farmaceutica_id || (auxiliares.formas[0]?.id ?? '')
  );
  const [formasList, setFormasList] = React.useState(auxiliares.formas);
  const [mostrarModalNuevaForma, setMostrarModalNuevaForma] = React.useState(false);
  const [nuevaFormaNombre, setNuevaFormaNombre] = React.useState('');
  const [nuevaFormaAbrev, setNuevaFormaAbrev] = React.useState('');
  const [guardandoForma, setGuardandoForma] = React.useState(false);

  const [laboratorioId, setLaboratorioId] = React.useState<string>(
    producto?.laboratorio_id || (auxiliares.laboratorios[0]?.id ?? '')
  );
  const [categoriaId, setCategoriaId] = React.useState<string>(
    producto?.categoria_id || (auxiliares.categorias[0]?.id ?? '')
  );
  const [registroSanitario, setRegistroSanitario] = React.useState(producto?.registro_sanitario || '');
  const [condicionVenta, setCondicionVenta] = React.useState<any>(producto?.condicion_venta || 'sin_receta');
  const [esControlado, setEsControlado] = React.useState(producto?.es_controlado || false);
  const [esGenerico, setEsGenerico] = React.useState(producto?.es_generico || false);
  const [requiereCadenaFrio, setRequiereCadenaFrio] = React.useState(producto?.requiere_cadena_frio || false);
  const [unidadBase, setUnidadBase] = React.useState(producto?.unidad_base || 'UNIDAD');
  const [tipoIgv, setTipoIgv] = React.useState<'gravado' | 'exonerado' | 'inafecto'>(
    producto?.tipo_afectacion_igv || 'gravado'
  );
  const [costoUltimo, setCostoUltimo] = React.useState<number>(producto?.costo_ultimo || 0);
  const [activo, setActivo] = React.useState(producto?.activo ?? true);

  // Presentaciones
  const [presentaciones, setPresentaciones] = React.useState<PresentacionItem[]>(
    producto?.presentaciones && producto.presentaciones.length > 0
      ? producto.presentaciones
      : [
          {
            nombre: 'Unidad',
            factor_base: 1,
            codigo_barras: '',
            precio_venta: 0,
            es_default: true,
            activo: true,
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-ajustar esControlado cuando cambia condicionVenta
  React.useEffect(() => {
    if (['psicotropico', 'estupefaciente'].includes(condicionVenta)) {
      setEsControlado(true);
    }
  }, [condicionVenta]);

  const handleAddPresentacion = (nombrePreset?: string, factorPreset?: number) => {
    const nuevoFactor = factorPreset ?? (presentaciones.length === 1 ? 10 : 100);
    const nuevoNombre = nombrePreset ?? `Caja x${nuevoFactor}`;

    setPresentaciones([
      ...presentaciones,
      {
        nombre: nuevoNombre,
        factor_base: nuevoFactor,
        codigo_barras: '',
        precio_venta: 0,
        es_default: false,
        activo: true,
      },
    ]);
  };

  const handleRemovePresentacion = (index: number) => {
    if (presentaciones.length <= 1) {
      toast.error('El fármaco debe tener al menos una presentación registrada.');
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

  const handleGenerarCodigo = () => {
    const random = 'MED-' + Math.floor(1000 + Math.random() * 9000);
    setCodigoInterno(random);
    toast.info(`Nuevo código generado: ${random}`);
  };

  const handleCrearForma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaFormaNombre.trim()) {
      toast.error('Ingrese el nombre de la forma farmacéutica');
      return;
    }
    setGuardandoForma(true);
    try {
      const res = await crearFormaFarmaceuticaAction(nuevaFormaNombre, nuevaFormaAbrev);
      if (res.success && res.forma) {
        toast.success(`Forma "${res.forma.nombre}" agregada con éxito`);
        setFormasList((prev) => [...prev, res.forma!]);
        setFormaId(res.forma.id);
        setMostrarModalNuevaForma(false);
        setNuevaFormaNombre('');
        setNuevaFormaAbrev('');
      } else {
        toast.error(res.error || 'Error al guardar la forma farmacéutica');
      }
    } catch {
      toast.error('Error al registrar la nueva forma');
    } finally {
      setGuardandoForma(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nombreComercial.trim()) {
      toast.error('El nombre comercial del medicamento es obligatorio.');
      return;
    }
    if (!codigoInterno.trim()) {
      toast.error('El código interno es obligatorio.');
      return;
    }
    if (presentaciones.length === 0) {
      toast.error('Debe configurar al menos una presentación.');
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
          : `Medicamento "${nombreComercial}" registrado en el catálogo maestro.`
      );
      router.push('/productos');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Cabecera limpia y libre de efectos blur que oculten iconos */}
      <ProductoFormHeader
        isEditing={isEditing}
        nombreComercial={nombreComercial}
        isSubmitting={isSubmitting}
        onSave={() => handleSubmit()}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila Superior: Identificación (7 cols) + Regulación Sanitaria (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 space-y-6">
            <ProductoIdentificacionCard
              codigoInterno={codigoInterno}
              setCodigoInterno={setCodigoInterno}
              onGenerarCodigo={handleGenerarCodigo}
              nombreComercial={nombreComercial}
              setNombreComercial={setNombreComercial}
              nombreGenerico={nombreGenerico}
              setNombreGenerico={setNombreGenerico}
              concentracion={concentracion}
              setConcentracion={setConcentracion}
              formaId={formaId}
              setFormaId={setFormaId}
              formasList={formasList}
              onAbrirModalNuevaForma={() => setMostrarModalNuevaForma(true)}
              laboratorioId={laboratorioId}
              setLaboratorioId={setLaboratorioId}
              categoriaId={categoriaId}
              setCategoriaId={setCategoriaId}
              laboratorios={auxiliares.laboratorios}
              categorias={auxiliares.categorias}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <ProductoRegulacionCard
              registroSanitario={registroSanitario}
              setRegistroSanitario={setRegistroSanitario}
              condicionVenta={condicionVenta}
              setCondicionVenta={setCondicionVenta}
              unidadBase={unidadBase}
              setUnidadBase={setUnidadBase}
              tipoIgv={tipoIgv}
              setTipoIgv={setTipoIgv}
              requiereCadenaFrio={requiereCadenaFrio}
              setRequiereCadenaFrio={setRequiereCadenaFrio}
              esGenerico={esGenerico}
              setEsGenerico={setEsGenerico}
              esControlado={esControlado}
              setEsControlado={setEsControlado}
              costoUltimo={costoUltimo}
              setCostoUltimo={setCostoUltimo}
              activo={activo}
              setActivo={setActivo}
            />
          </div>
        </div>

        {/* Fila Inferior: Presentaciones Comerciales y Fraccionamiento */}
        <ProductoPresentacionesCard
          presentaciones={presentaciones}
          unidadBase={unidadBase}
          onAddPresentacion={handleAddPresentacion}
          onRemovePresentacion={handleRemovePresentacion}
          onUpdatePresentacion={handleUpdatePresentacion}
        />
      </form>

      {/* Modal Nueva Forma Farmacéutica */}
      <ModalNuevaForma
        isOpen={mostrarModalNuevaForma}
        onClose={() => setMostrarModalNuevaForma(false)}
        onSubmit={handleCrearForma}
        nombre={nuevaFormaNombre}
        setNombre={setNuevaFormaNombre}
        abreviatura={nuevaFormaAbrev}
        setAbreviatura={setNuevaFormaAbrev}
        isSubmitting={guardandoForma}
      />
    </div>
  );
}
