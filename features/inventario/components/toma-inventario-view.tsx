'use client';

import * as React from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertTriangle,
  Building2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import { iniciarTomaInventarioAction, aplicarTomaInventarioAction } from '../actions-toma';
import type { TomaInventario } from '../queries-toma';

interface TomaInventarioViewProps {
  tomas: TomaInventario[];
  activeSucursalId: string;
}

export function TomaInventarioView({ tomas, activeSucursalId }: TomaInventarioViewProps) {
  const [openModalCrear, setOpenModalCrear] = React.useState(false);
  const [observaciones, setObservaciones] = React.useState('Auditoría periódica de inventario físico');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
      } else {
        setErrorMsg(res.error || 'Error al iniciar toma');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCerrarToma = async (tomaId: string) => {
    if (!confirm('¿Desea cerrar la toma y consolidar los saldos en el inventario oficial?')) return;
    setIsSubmitting(true);
    try {
      const res = await aplicarTomaInventarioAction(tomaId, {});
      if (!res.success) alert(res.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Toma de Inventario Físico & Auditoría</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conteo físico a ciegas, detección de mermas y balance de existencias por sede.
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

      {/* Modal Iniciar Toma */}
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

      {/* Lista de tomas de inventario */}
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
                    {t.total_items} productos auditados · Discrepancia acumulada: {t.diferencia_total} unidades
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {t.estado === 'en_progreso' && (
                    <Button
                      size="sm"
                      onClick={() => handleCerrarToma(t.id)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1.5 rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Consolidar y Ajustar
                    </Button>
                  )}

                  {t.estado === 'aplicado' && (
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                        Inventario Ajustado
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.fecha_cierre}
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
