'use client';

import * as React from 'react';
import { 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Snowflake,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appleSprings } from '@/lib/utils';
import { guardarRegistroTemperaturaAction } from '../actions-temperatura';
import type { RegistroTemperaturaHumedad } from '../queries-temperatura';

interface BPAViewProps {
  registros: RegistroTemperaturaHumedad[];
  activeSucursalId: string;
}

export function RegistroBpaView({ registros, activeSucursalId }: BPAViewProps) {
  const [openModal, setOpenModal] = React.useState(false);
  const [zona, setZona] = React.useState<'ambiente' | 'cadena_frio'>('ambiente');
  const [turno, setTurno] = React.useState<'mañana' | 'tarde'>('mañana');
  const [temperatura, setTemperatura] = React.useState('22.5');
  const [humedad, setHumedad] = React.useState('58');
  const [observacion, setObservacion] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Determinar turno actual automáticamente según la hora
  React.useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 13) {
      setTurno('tarde');
    } else {
      setTurno('mañana');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempNum = parseFloat(temperatura);
    const humNum = humedad ? parseFloat(humedad) : undefined;

    if (isNaN(tempNum)) {
      setErrorMsg('Ingrese un valor numérico válido para temperatura.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await guardarRegistroTemperaturaAction({
        sucursalId: activeSucursalId,
        zona,
        turno,
        temperatura: tempNum,
        humedad: humNum,
        observacion: observacion || undefined,
      });

      if (res.success) {
        setOpenModal(false);
        setObservacion('');
      } else {
        setErrorMsg(res.error || 'Error al guardar lectura');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const registrosHoy = registros.filter(
    (r) => r.fecha === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Control de Temperatura y Humedad (BPA)</h2>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px]">
              DIGEMID / BPA
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro diario de termohigrómetros (mañana y tarde) obligatorio para fiscalización sanitaria.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)}
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar Lectura
        </Button>
      </div>

      {/* Modal Apple Sheet */}
      <AnimatePresence>
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-md"
              onClick={() => setOpenModal(false)}
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
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                      Registrar Lectura Termohigrómetro
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Registro conforme a las Buenas Prácticas de Almacenamiento
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Área / Zona de Control</label>
                    <select
                      value={zona}
                      onChange={(e) => {
                        const newZ = e.target.value as 'ambiente' | 'cadena_frio';
                        setZona(newZ);
                        if (newZ === 'cadena_frio') {
                          setTemperatura('4.5');
                          setHumedad('');
                        } else {
                          setTemperatura('22.5');
                          setHumedad('58');
                        }
                      }}
                      className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
                    >
                      <option value="ambiente">Ambiente (&le; 30°C)</option>
                      <option value="cadena_frio">Cadena de Frío (2°C - 8°C)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Turno de Inspección</label>
                    <select
                      value={turno}
                      onChange={(e) => setTurno(e.target.value as 'mañana' | 'tarde')}
                      className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
                    >
                      <option value="mañana">Mañana (08:00 - 10:00)</option>
                      <option value="tarde">Tarde (15:00 - 17:00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Temperatura (°C)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                      placeholder="Ej. 22.5"
                      required
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {zona === 'ambiente' ? 'Límite: 15°C a 30°C' : 'Rango: 2°C a 8°C'}
                    </span>
                  </div>

                  {zona === 'ambiente' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Humedad Relativa (% H.R.)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={humedad}
                        onChange={(e) => setHumedad(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        placeholder="Ej. 60"
                        required
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Límite: &le; 70% H.R.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Refrigeradora Médica</label>
                      <div className="h-9 px-3 flex items-center bg-blue-500/10 text-[#0071e3] rounded-xl text-xs font-medium">
                        Sensor calibrado
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Observaciones / Medidas Correctivas</label>
                  <Input
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    placeholder="Ej. Aire acondicionado operativo / Sin incidencias"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs rounded-xl"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Lectura'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tarjetas resumen de estado hoy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Lecturas Hoy</span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {registrosHoy.length} / 4
          </div>
          <span className="text-[11px] text-muted-foreground">
            2 turnos x 2 zonas requeridas
          </span>
        </Card>

        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Conformidad DIGEMID</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {registros.filter((r) => !r.conformidad).length === 0 ? '100% OK' : `${registros.filter((r) => r.conformidad).length} Conformes`}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Sin excursiones críticas en los últimos 30 días
          </span>
        </Card>

        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Última Temperatura</span>
            <Thermometer className="w-4 h-4 text-[#0071e3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
            {registros[0] ? `${registros[0].temperatura}°C` : '—'}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {registros[0] ? `${registros[0].zona === 'ambiente' ? 'Ambiente' : 'Cadena Frío'} · Turno ${registros[0].turno}` : 'Sin lecturas'}
          </span>
        </Card>
      </div>

      {/* Historial de Lecturas */}
      <Card className="p-0 overflow-hidden apple-glass">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bitácora Oficial de Tomas</h3>
          <span className="text-xs text-muted-foreground">Últimos 30 días</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-4 py-2.5 text-left font-medium">Turno</th>
                <th className="px-4 py-2.5 text-left font-medium">Zona / Área</th>
                <th className="px-4 py-2.5 text-right font-medium">Temperatura</th>
                <th className="px-4 py-2.5 text-right font-medium">Humedad</th>
                <th className="px-4 py-2.5 text-center font-medium">Conformidad</th>
                <th className="px-4 py-2.5 text-left font-medium">Responsable</th>
                <th className="px-4 py-2.5 text-left font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No se han registrado lecturas de temperatura todavía.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {r.fecha} <span className="text-[10px] text-muted-foreground/60">{r.hora}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium capitalize">
                      {r.turno}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.zona === 'ambiente' ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Thermometer className="w-3 h-3" /> Ambiente Botica
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#0071e3] font-medium">
                          <Snowflake className="w-3 h-3" /> Cadena de Frío
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      {r.temperatura}°C
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {r.humedad !== null && r.humedad !== undefined ? `${r.humedad}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.conformidad ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                          Conforme
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]">
                          Excursión
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[140px]">
                      {r.usuario_nombre || 'Químico Farmacéutico'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[180px]">
                      {r.observacion || 'Sin incidencias'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
