'use client';

import * as React from 'react';
import { 
  ArrowRightLeft, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Building2, 
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import { 
  crearTransferenciaAction, 
  despacharTransferenciaAction, 
  recepcionarTransferenciaAction 
} from '../actions-traslados';
import type { Transferencia } from '../queries-traslados';
import type { LoteConStock } from '../types';

interface SucursalMin {
  id: string;
  nombre: string;
  codigo: string;
}

interface TrasladosViewProps {
  transferencias: Transferencia[];
  sucursales: SucursalMin[];
  lotesDisponibles: LoteConStock[];
  activeSucursalId: string;
}

export function TrasladosView({
  transferencias,
  sucursales,
  lotesDisponibles,
  activeSucursalId,
}: TrasladosViewProps) {
  const [openModalCrear, setOpenModalCrear] = React.useState(false);
  const [origenId, setOrigenId] = React.useState(activeSucursalId || sucursales[0]?.id || '');
  const [destinoId, setDestinoId] = React.useState(
    sucursales.find((s) => s.id !== activeSucursalId)?.id || sucursales[1]?.id || ''
  );
  const [selectedLoteId, setSelectedLoteId] = React.useState('');
  const [cantidad, setCantidad] = React.useState('1');
  const [motivo, setMotivo] = React.useState('Reposición periódica de existencias');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const lotesOrigen = lotesDisponibles.filter((l) => l.cantidad_base > 0);
  const loteSeleccionado = lotesOrigen.find((l) => l.id === selectedLoteId);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoteId || !loteSeleccionado) {
      setErrorMsg('Seleccione un producto/lote válido.');
      return;
    }
    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      setErrorMsg('La cantidad debe ser mayor a 0.');
      return;
    }
    if (cantNum > loteSeleccionado.cantidad_base) {
      setErrorMsg(`La cantidad excede el stock disponible (${loteSeleccionado.cantidad_base}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await crearTransferenciaAction({
        sucursalOrigenId: origenId,
        sucursalDestinoId: destinoId,
        motivo,
        items: [
          {
            productoId: loteSeleccionado.producto_id,
            loteId: loteSeleccionado.id,
            cantidad: cantNum,
          },
        ],
      });

      if (res.success) {
        setOpenModalCrear(false);
        setSelectedLoteId('');
        setCantidad('1');
      } else {
        setErrorMsg(res.error || 'Error al crear traslado');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDespachar = async (id: string) => {
    if (!confirm('¿Confirma el despacho y salida física de mercadería de la sede origen?')) return;
    setIsSubmitting(true);
    try {
      const res = await despacharTransferenciaAction(id);
      if (!res.success) alert(res.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecepcionar = async (id: string) => {
    if (!confirm('¿Confirma la recepción e ingreso físico de mercadería en la sede destino?')) return;
    setIsSubmitting(true);
    try {
      const res = await recepcionarTransferenciaAction(id);
      if (!res.success) alert(res.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: Transferencia['estado']) => {
    switch (estado) {
      case 'borrador':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" /> Solicitado / Borrador
          </Badge>
        );
      case 'en_transito':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-[#0071e3] dark:text-[#2997ff] border-blue-500/20 flex items-center gap-1 text-[11px]">
            <Send className="w-3 h-3" /> En Tránsito (Despachado)
          </Badge>
        );
      case 'recibida':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3" /> Recepcionado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Traslados entre Sucursales</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control de transferencias de inventario, guías de remisión internas y kardex intersedes.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModalCrear(true)}
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Traslado
        </Button>
      </div>

      {/* Modal Personalizado Apple Sheet */}
      <AnimatePresence>
        {openModalCrear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-md"
              onClick={() => setOpenModalCrear(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={appleSprings.sheet}
              className="relative w-full max-w-md bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                      Registrar Solicitud de Traslado
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Genere una orden de traslado entre sucursales
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenModalCrear(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCrear} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Sede Origen (Despacho)</label>
                    <select
                      value={origenId}
                      onChange={(e) => setOrigenId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Sede Destino (Recepción)</label>
                    <select
                      value={destinoId}
                      onChange={(e) => setDestinoId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
                    >
                      {sucursales
                        .filter((s) => s.id !== origenId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Fármaco / Lote a Transferir</label>
                  <select
                    value={selectedLoteId}
                    onChange={(e) => setSelectedLoteId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Seleccionar producto con stock --</option>
                    {lotesOrigen.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre_comercial} ({l.concentracion || ''}) - Lote: {l.numero_lote} (Disp: {l.cantidad_base} {l.unidad_base})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Cantidad a Enviar</label>
                    <Input
                      type="number"
                      min="1"
                      max={loteSeleccionado ? loteSeleccionado.cantidad_base : undefined}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                      placeholder="Ej. 10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Stock Actual Origen</label>
                    <div className="h-9 px-3 flex items-center bg-muted/40 rounded-xl text-xs font-mono font-medium">
                      {loteSeleccionado ? `${loteSeleccionado.cantidad_base} ${loteSeleccionado.unidad_base}` : '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Motivo del Traslado</label>
                  <Input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    placeholder="Ej. Reposición por quiebre de stock"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenModalCrear(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedLoteId}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs rounded-xl"
                  >
                    {isSubmitting ? 'Guardando...' : 'Crear Traslado'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lista de transferencias */}
      {transferencias.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2">
          <ArrowRightLeft className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold">No hay traslados registrados</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Utilice el botón "Nuevo Traslado" para solicitar o enviar fármacos entre sus sucursales activas.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transferencias.map((t) => (
            <Card key={t.id} className="p-4 transition-all hover:shadow-xs apple-glass">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0071e3] dark:text-[#2997ff]">
                      {t.numero_guia || 'SIN GUÍA'}
                    </span>
                    {getEstadoBadge(t.estado)}
                    <span className="text-xs text-muted-foreground">· {t.fecha_solicitud}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.origen_nombre}
                    </span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.destino_nombre}
                    </span>
                  </div>

                  {t.motivo && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Motivo: {t.motivo}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {t.estado === 'borrador' && (
                    <Button
                      size="sm"
                      onClick={() => handleDespachar(t.id)}
                      disabled={isSubmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 flex items-center gap-1.5 rounded-xl"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Despachar (Salida Stock)
                    </Button>
                  )}

                  {t.estado === 'en_transito' && (
                    <Button
                      size="sm"
                      onClick={() => handleRecepcionar(t.id)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1.5 rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recepcionar (Ingreso Stock)
                    </Button>
                  )}

                  {t.estado === 'recibida' && (
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                        Finalizado
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.fecha_recepcion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
