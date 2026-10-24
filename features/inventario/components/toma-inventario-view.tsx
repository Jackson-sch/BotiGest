'use client';

import * as React from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertTriangle, 
  Building2, 
  X, 
  Search,
  Save,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';
import { iniciarTomaInventarioAction, aplicarTomaInventarioAction } from '../actions-toma';
import type { TomaInventario } from '../queries-toma';

interface TomaInventarioViewProps {
  tomas: TomaInventario[];
  activeSucursalId: string;
}

interface ItemConteo {
  id: string;
  producto_id: string;
  nombre_comercial: string;
  concentracion?: string;
  unidad_base: string;
  numero_lote: string;
  fecha_vencimiento: string;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  costo_promedio: number;
  justificacion?: string;
}

export function TomaInventarioView({ tomas, activeSucursalId }: TomaInventarioViewProps) {
  const [openModalCrear, setOpenModalCrear] = React.useState(false);
  const [observaciones, setObservaciones] = React.useState('Auditoría periódica de inventario físico');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Estado para la hoja interactiva de conteo físico
  const [tomaActiva, setTomaActiva] = React.useState<TomaInventario | null>(null);
  const [itemsConteo, setItemsConteo] = React.useState<ItemConteo[]>([]);
  const [cargandoItems, setCargandoItems] = React.useState(false);
  const [filtroTexto, setFiltroTexto] = React.useState('');

  const handleIniciarToma = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await iniciarTomaInventarioAction({
        sucursalId: activeSucursalId,
        observaciones,
      });

      if (res.success) {
        setOpenModalCrear(false);
        toast.success('Toma de inventario iniciada exitosamente');
      } else {
        setErrorMsg(res.error || 'Error al iniciar toma');
        toast.error(res.error || 'Error al iniciar toma');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
      toast.error(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const abrirHojaConteo = async (toma: TomaInventario) => {
    setTomaActiva(toma);
    setCargandoItems(true);
    try {
      const res = await fetch(`/api/inventario/tomas/${toma.id}/items`);
      const data = await res.json();
      if (data.success) {
        setItemsConteo(data.items);
      } else {
        toast.error(data.error || 'Error al cargar ítems');
      }
    } catch {
      toast.error('Error de red al consultar los ítems de la toma');
    } finally {
      setCargandoItems(false);
    }
  };

  const handleUpdateStockFisico = (itemId: string, valor: string) => {
    const num = parseInt(valor, 10);
    setItemsConteo((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const fisico = isNaN(num) || num < 0 ? 0 : num;
          return {
            ...it,
            stock_fisico: fisico,
            diferencia: fisico - it.stock_sistema,
          };
        }
        return it;
      })
    );
  };

  const handleUpdateJustificacion = (itemId: string, justif: string) => {
    setItemsConteo((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, justificacion: justif } : it))
    );
  };

  const ejecutarCierreToma = async (tomaId: string) => {
    setIsSubmitting(true);
    try {
      const conteosFisicos: Record<string, number> = {};
      const justificaciones: Record<string, string> = {};

      itemsConteo.forEach((it) => {
        conteosFisicos[it.id] = it.stock_fisico;
        if (it.justificacion) justificaciones[it.id] = it.justificacion;
      });

      const res = await aplicarTomaInventarioAction(tomaId, conteosFisicos, justificaciones);
      if (res.success) {
        toast.success('Toma de inventario aplicada y kardex ajustado con éxito');
        setTomaActiva(null);
      } else {
        toast.error(res.error || 'Error al cerrar la toma de inventario');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión al cerrar toma');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarCierre = (tomaId: string) => {
    const conDiferencias = itemsConteo.filter((i) => i.diferencia !== 0);
    const mensaje = conDiferencias.length > 0
      ? `Se detectaron ${conDiferencias.length} lotes con diferencias. Se generarán ajustes de inventario automáticos.`
      : 'Todos los lotes coinciden exactamente con el sistema.';

    toast('¿Consolidar y ajustar inventario oficial?', {
      description: mensaje,
      action: {
        label: 'Aplicar Cambios',
        onClick: () => ejecutarCierreToma(tomaId),
      },
      cancel: {
        label: 'Seguir Contando',
        onClick: () => {},
      },
    });
  };

  const itemsFiltrados = itemsConteo.filter(
    (i) =>
      i.nombre_comercial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      i.numero_lote.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const totalSobrantes = itemsConteo.filter((i) => i.diferencia > 0).length;
  const totalFaltantes = itemsConteo.filter((i) => i.diferencia < 0).length;
  const totalCoincidentes = itemsConteo.filter((i) => i.diferencia === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Toma de Inventario Físico & Auditoría</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conteo físico en anaqueles, comparación contra stock del sistema y ajuste automático de mermas.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModalCrear(true)}
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Toma Física
        </Button>
      </div>

      {/* MODAL INICIAR TOMA */}
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
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                      Iniciar Toma de Inventario
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Captura el stock actual del sistema para auditoría
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

              <form onSubmit={handleIniciarToma} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Motivo / Alcance</label>
                  <Input
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    placeholder="Ej. Conteo trimestral de stock"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 text-xs text-[#0071e3] dark:text-[#2997ff] flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Se capturará una instantánea de todos los lotes de esta sede sin interrumpir las ventas.</span>
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
                    disabled={isSubmitting}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs rounded-xl"
                  >
                    {isSubmitting ? 'Iniciando...' : 'Iniciar Conteo'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL HOJA DE CONTEO FÍSICO INTERACTIVA */}
      <AnimatePresence>
        {tomaActiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setTomaActiva(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={appleSprings.sheet}
              className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#161618] rounded-3xl border border-border shadow-2xl z-10 flex flex-col overflow-hidden"
            >
              {/* Header Hoja de Conteo */}
              <div className="p-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base tracking-apple-title text-foreground">
                        Hoja de Conteo Físico: {tomaActiva.codigo}
                      </h3>
                      <Badge variant="outline" className="text-xs font-mono">
                        {tomaActiva.estado === 'en_progreso' ? 'En Progreso' : 'Cerrada'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ingrese las unidades contadas en físico por cada lote. Las diferencias se calcularán en tiempo real.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTomaActiva(null)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Barra de métricas y buscador */}
              <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                    Coincidentes: {totalCoincidentes}
                  </Badge>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs">
                    Faltantes (Merma): {totalFaltantes}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-[#0071e3] border-blue-500/30 text-xs">
                    Sobrantes: {totalSobrantes}
                  </Badge>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fármaco o lote..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="h-8 pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Tabla de conteo con inputs interactivos */}
              <div className="flex-1 overflow-y-auto p-4">
                {cargandoItems ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Cargando lotes para conteo...
                  </div>
                ) : itemsFiltrados.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No se encontraron lotes que coincidan con la búsqueda.
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Producto / Fármaco</th>
                        <th className="px-3 py-2 text-left font-medium">Lote & Vence</th>
                        <th className="px-3 py-2 text-center font-medium">Stock Sistema</th>
                        <th className="px-3 py-2 text-center font-medium text-[#0071e3] font-bold">
                          Stock Físico (Contado)
                        </th>
                        <th className="px-3 py-2 text-center font-medium">Diferencia</th>
                        <th className="px-3 py-2 text-left font-medium">Justificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {itemsFiltrados.map((item) => {
                        const esCerrada = tomaActiva.estado === 'aplicado';
                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-foreground">{item.nombre_comercial}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {item.concentracion || ''} · {item.unidad_base}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono font-medium">{item.numero_lote}</span>
                              <div className="text-[10px] text-muted-foreground">{item.fecha_vencimiento}</div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground">
                              {item.stock_sistema}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {esCerrada ? (
                                <span className="font-mono font-bold">{item.stock_fisico}</span>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.stock_fisico}
                                  onChange={(e) => handleUpdateStockFisico(item.id, e.target.value)}
                                  className="w-24 h-8 text-center font-mono font-bold text-sm mx-auto rounded-lg border-[#0071e3]/40 focus:border-[#0071e3]"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {item.diferencia === 0 ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-[11px]">
                                  0 (OK)
                                </Badge>
                              ) : item.diferencia < 0 ? (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-mono text-[11px] flex items-center gap-1 justify-center w-fit mx-auto">
                                  <TrendingDown className="w-3 h-3" /> {item.diferencia}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-500/10 text-[#0071e3] border-blue-500/20 font-mono text-[11px] flex items-center gap-1 justify-center w-fit mx-auto">
                                  <TrendingUp className="w-3 h-3" /> +{item.diferencia}
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {esCerrada ? (
                                <span className="text-muted-foreground text-[11px]">{item.justificacion || '—'}</span>
                              ) : (
                                <Input
                                  placeholder="Motivo (ej. merma, daño)..."
                                  value={item.justificacion || ''}
                                  onChange={(e) => handleUpdateJustificacion(item.id, e.target.value)}
                                  className="h-8 text-xs rounded-lg max-w-xs"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer con botón de consolidación */}
              <div className="p-4 border-t border-border/80 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTomaActiva(null)}
                  className="text-xs rounded-xl"
                >
                  Cerrar Vista
                </Button>

                {tomaActiva.estado === 'en_progreso' && (
                  <Button
                    onClick={() => handleConfirmarCierre(tomaActiva.id)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Aplicando Ajustes...' : 'Consolidar Conteo y Ajustar Stock'}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LISTA DE TOMAS REGISTRADAS */}
      {tomas.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2">
          <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold">No hay tomas de inventario activas</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Inicie un conteo físico para verificar discrepancias entre el stock de sistema y las unidades reales en anaquel.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tomas.map((t) => (
            <Card key={t.id} className="p-4 transition-all hover:shadow-xs apple-glass">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0071e3] dark:text-[#2997ff]">
                      {t.codigo}
                    </span>
                    {t.estado === 'en_progreso' ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" /> En Progreso
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Aplicado
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">· Inicio: {t.fecha_inicio}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.sucursal_nombre}
                    </span>
                    <span className="text-muted-foreground">· Responsable: {t.responsable_nombre || 'Director Técnico'}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {t.total_items} productos auditados · Discrepancia neta: {t.diferencia_total} unidades
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    onClick={() => abrirHojaConteo(t)}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs h-8 flex items-center gap-1.5 rounded-xl"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    {t.estado === 'en_progreso' ? 'Ingresar Conteo Físico' : 'Ver Resultados de Auditoría'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
