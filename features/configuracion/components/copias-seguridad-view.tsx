'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  FileCode,
  Sparkles,
  Info,
  Terminal,
  RotateCcw,
  Upload,
  AlertTriangle,
  X,
  FileUp,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { appleSprings } from '@/lib/utils';
import {
  generarBackupAction,
  listarBackupsAction,
  eliminarBackupAction,
  restablecerBackupAction,
  subirBackupAction,
} from '../backup-actions';
import type { BackupItem } from '@/lib/backup/backup-service';

export function CopiasSeguridadView() {
  const [backups, setBackups] = React.useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<'sql' | 'dump'>('sql');

  // Estado para modal de restauración
  const [backupParaRestablecer, setBackupParaRestablecer] = React.useState<BackupItem | null>(null);
  const [confirmacionTexto, setConfirmacionTexto] = React.useState('');
  const [isRestoring, setIsRestoring] = React.useState(false);

  // Estado para terminal interactivo
  const [terminalTab, setTerminalTab] = React.useState<'windows' | 'linux'>('windows');
  const [copiedCommand, setCopiedCommand] = React.useState(false);

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    toast.success('Comando copiado al portapapeles.');
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const cargarBackups = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listarBackupsAction();
      setBackups(data);
    } catch {
      toast.error('No se pudo cargar el historial de copias de seguridad.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarBackups();
  }, [cargarBackups]);

  const handleGenerarBackup = async () => {
    setIsGenerating(true);
    try {
      const res = await generarBackupAction(tipoSeleccionado);
      if (res.success) {
        toast.success(res.message || 'Copia de seguridad generada exitosamente.');
        await cargarBackups();
      } else {
        toast.error(res.error || 'Error al generar copia de seguridad.');
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar el respaldo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql') && !file.name.endsWith('.dump')) {
      toast.error('Formato no soportado. Seleccione un archivo .sql o .dump.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await subirBackupAction(formData);
      if (res.success) {
        toast.success(res.message || 'Archivo de copia de seguridad subido exitosamente.');
        await cargarBackups();
      } else {
        toast.error(res.error || 'Error al subir la copia de seguridad.');
      }
    } catch {
      toast.error('Ocurrió un error al subir el archivo al servidor.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminar = (filename: string) => {
    toast(`¿Eliminar copia de seguridad?`, {
      description: `Se eliminará permanentemente ${filename} del servidor.`,
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const res = await eliminarBackupAction(filename);
            if (res.success) {
              toast.success(`Copia ${filename} eliminada correctamente.`);
              setBackups((prev) => prev.filter((b) => b.filename !== filename));
            } else {
              toast.error(res.error || 'No se pudo eliminar el archivo.');
            }
          } catch {
            toast.error('Error al intentar eliminar el archivo.');
          }
        },
      },
    });
  };

  const handleEjecutarRestauracion = async () => {
    if (!backupParaRestablecer) return;

    if (confirmacionTexto.trim() !== 'RESTABLECER') {
      toast.error('Debe escribir exactamente "RESTABLECER" en mayúsculas.');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restablecerBackupAction(
        backupParaRestablecer.filename,
        confirmacionTexto.trim()
      );

      if (res.success) {
        toast.success('¡Base de datos restablecida exitosamente!', {
          description: res.preRestoreBackup
            ? `Se generó un respaldo preventivo: ${res.preRestoreBackup}`
            : undefined,
          duration: 6000,
        });
        setBackupParaRestablecer(null);
        setConfirmacionTexto('');
        await cargarBackups();

        // Recargar la ventana tras 2 segundos para sincronizar estados en memoria
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        toast.error(res.error || 'Error al restablecer la base de datos.');
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar la restauración.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Cálculo de estadísticas
  const totalBytes = backups.reduce((acc, b) => acc + b.sizeBytes, 0);
  const totalFormatted =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalBytes / 1024).toFixed(2)} KB`;

  const ultimoBackup = backups[0]?.createdAt || 'Sin respaldos previos';

  return (
    <div className="space-y-6">
      {/* Input oculto para subir archivo de respaldo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSubirArchivo}
        accept=".sql,.dump"
        className="hidden"
      />

      {/* Tarjeta de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl apple-glass border border-border flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Respaldos Almacenados</span>
            <p className="text-xl font-bold text-foreground font-mono">{backups.length}</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl apple-glass border border-border flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Espacio Utilizado</span>
            <p className="text-xl font-bold text-foreground font-mono">{totalFormatted}</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl apple-glass border border-border flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Última Generación</span>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">{ultimoBackup}</p>
          </div>
        </Card>
      </div>

      {/* Panel de Acciones Rápidas (Generar Respaldo y Subir Archivo) */}
      <Card className="p-5 rounded-2xl apple-glass border border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Gestión de Copias de Seguridad</h3>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" />
                Cifrado y Verificado
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Exporta o restablece un volcado completo de todas las tablas (Ventas, Compras, Lotes, Kardex, Clientes y Catálogo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-9 px-3.5 text-xs font-medium rounded-xl border-border gap-1.5 hover:bg-muted/30"
              title="Subir un archivo .sql o .dump generado anteriormente"
            >
              <FileUp className={`h-3.5 w-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Subiendo archivo...' : 'Subir Copia Externa'}</span>
            </Button>

            <div className="w-36">
              <Select
                value={tipoSeleccionado}
                onValueChange={(val) => setTipoSeleccionado(val as 'sql' | 'dump')}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="sql">SQL Texto (.sql)</SelectItem>
                  <SelectItem value="dump">Binario Comprimido (.dump)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleGenerarBackup}
              disabled={isGenerating}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generando Copia...' : 'Crear Respaldo Ahora'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Copias Existentes */}
      <Card className="p-5 rounded-2xl apple-glass border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-[#0071e3]" />
            <h3 className="text-sm font-semibold text-foreground">Historial de Copias de Seguridad</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cargarBackups}
            disabled={isLoading}
            className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {backups.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-border/60 rounded-xl">
            <Database className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
            <p className="text-xs text-muted-foreground">No hay copias de seguridad registradas en el servidor.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerarBackup}
              disabled={isGenerating}
              className="text-xs rounded-xl h-8"
            >
              Generar primera copia
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-medium">Nombre de Archivo</th>
                  <th className="pb-2 font-medium">Formato</th>
                  <th className="pb-2 font-medium">Tamaño</th>
                  <th className="pb-2 font-medium">Fecha y Hora</th>
                  <th className="pb-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-foreground">
                      {b.filename}
                    </td>
                    <td className="py-2.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                        {b.tipo}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      {b.sizeFormatted}
                    </td>
                    <td className="py-2.5 text-muted-foreground font-mono text-[11px]">
                      {b.createdAt}
                    </td>
                    <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Botón Restablecer */}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBackupParaRestablecer(b);
                          setConfirmacionTexto('');
                        }}
                        className="h-7 px-2 text-xs rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                        title="Restablecer la base de datos a este punto"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restablecer
                      </Button>

                      {/* Botón Descargar */}
                      <a
                        href={`/api/backups/${encodeURIComponent(b.filename)}`}
                        download={b.filename}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs rounded-lg text-[#0071e3] hover:text-[#0071e3] hover:bg-blue-500/10"
                          title="Descargar copia de seguridad"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Descargar
                        </Button>
                      </a>

                      {/* Botón Eliminar */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(b.filename)}
                        className="h-7 px-2 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                        title="Eliminar archivo de copia"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Guía de Automatización con Estilo Terminal macOS / Unix */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#0071e3]" />
              <h3 className="text-sm font-semibold text-foreground">
                Automatización de Copias Diarias (Task Scheduler / Crontab)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preserva automáticamente las ventas, compras y el Libro de Controlados (obligación legal DIGEMID y SUNAT de conservar registros por un mínimo de 5 años).
            </p>
          </div>
        </div>

        {/* Ventana de Terminal */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0d1117] shadow-2xl overflow-hidden font-mono text-xs">
          {/* Barra Superior estilo macOS / Terminal */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-zinc-800/80">
            {/* Botones de ventana (Semáforo macOS) */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-xs" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-xs" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-xs" />
              <span className="ml-2 text-[11px] text-zinc-400 font-medium select-none">
                {terminalTab === 'windows' ? 'powershell.exe — botigest-backup' : 'bash — botica@server:~/backup'}
              </span>
            </div>

            {/* Selector de SO y Botón Copiar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-black/40 rounded-lg border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTerminalTab('windows')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    terminalTab === 'windows'
                      ? 'bg-zinc-700/80 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Windows (PowerShell)
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalTab('linux')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    terminalTab === 'linux'
                      ? 'bg-zinc-700/80 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Linux / VPS (Crontab)
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopyCommand(
                    terminalTab === 'windows'
                      ? 'npx tsx scripts/backup-database.ts'
                      : '0 2 * * * cd /ruta/al/proyecto && npx tsx scripts/backup-database.ts >> /var/log/botica-backup.log 2>&1'
                  )
                }
                className="h-7 px-2.5 text-[11px] rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 gap-1.5"
              >
                {copiedCommand ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-zinc-400" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Cuerpo del Terminal */}
          <div className="p-4 sm:p-5 text-zinc-200 space-y-3 leading-relaxed overflow-x-auto text-[12px] sm:text-[13px] selection:bg-emerald-500/30 selection:text-emerald-200">
            {terminalTab === 'windows' ? (
              <>
                <div className="text-zinc-500">
                  <span className="text-zinc-600 font-semibold"># 1. </span>
                  Ejecutar respaldo inmediato de prueba:
                </div>
                <div className="flex items-center gap-2 text-zinc-100">
                  <span className="text-sky-400 select-none">PS C:\botica&gt;</span>
                  <span className="text-emerald-300 font-semibold">npx tsx scripts/backup-database.ts</span>
                </div>

                <div className="text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span className="text-zinc-600 font-semibold"># 2. </span>
                  Programar ejecución nocturna automática diaria (02:00 AM) en Task Scheduler:
                </div>
                <div className="space-y-1 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 select-none">PS C:\botica&gt;</span>
                    <span className="text-amber-200">$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File scripts\backup-cron.ps1"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 select-none">PS C:\botica&gt;</span>
                    <span className="text-amber-200">$trigger = New-ScheduledTaskTrigger -Daily -At 2:00am</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 select-none">PS C:\botica&gt;</span>
                    <span className="text-amber-200">Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "BotigestBackupDiario"</span>
                  </div>
                </div>

                {/* Salida simulada del comando */}
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] space-y-1 text-zinc-400">
                  <div className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>[EXITO] Respaldo de botica_db completado en 1.2s</span>
                  </div>
                  <div className="text-zinc-400 pl-5">
                    Archivo generado: <span className="text-zinc-200">botica_backup_2026-10-28_020000.sql</span> (229 KB)
                  </div>
                  <div className="text-zinc-500 pl-5">
                    Retención: 5 respaldos activos conservados. Política DIGEMID / SUNAT vigente.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-zinc-500">
                  <span className="text-zinc-600 font-semibold"># 1. </span>
                  Ejecutar respaldo inmediato de prueba en terminal Linux:
                </div>
                <div className="flex items-center gap-2 text-zinc-100">
                  <span className="text-emerald-400 select-none">botica@server:~/app$</span>
                  <span className="text-emerald-300 font-semibold">npx tsx scripts/backup-database.ts</span>
                </div>

                <div className="text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span className="text-zinc-600 font-semibold"># 2. </span>
                  Registrar en el crontab del sistema para ejecutarse todas las noches a las 02:00 AM:
                </div>
                <div className="space-y-1 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 select-none">botica@server:~/app$</span>
                    <span className="text-sky-300">crontab -e</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 text-amber-200 text-xs">
                    0 2 * * * cd /ruta/al/proyecto && npx tsx scripts/backup-database.ts &gt;&gt; /var/log/botica-backup.log 2&gt;&amp;1
                  </div>
                </div>

                {/* Salida simulada del comando */}
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] space-y-1 text-zinc-400">
                  <div className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>[OK] Dump exitoso: botica_backup_2026-10-28_020000.sql</span>
                  </div>
                  <div className="text-zinc-400 pl-5">
                    Proceso cron finalizado con código 0.
                  </div>
                </div>
              </>
            )}

            {/* Prompt interactivo simulado con cursor parpadeante */}
            <div className="pt-2 flex items-center gap-2 text-zinc-400 text-xs border-t border-zinc-800/40">
              <span className={terminalTab === 'windows' ? 'text-sky-400 select-none' : 'text-emerald-400 select-none'}>
                {terminalTab === 'windows' ? 'PS C:\botica>' : 'botica@server:~$'}
              </span>
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle" />
            </div>
          </div>
        </div>

        {/* Nota informativa de la política de retención */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#0071e3]" />
          <span>
            <strong>Política de Retención Automática:</strong> El sistema conserva de forma garantizada los 5 respaldos más recientes y elimina automáticamente archivos con más de 30 días de antigüedad para evitar el llenado innecesario del disco duro.
          </span>
        </div>
      </div>

      {/* Modal de Confirmación Crítica para Restablecer Base de Datos */}
      <AnimatePresence>
        {backupParaRestablecer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!isRestoring) setBackupParaRestablecer(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={appleSprings.sheet}
              className="relative w-full max-w-lg bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground tracking-apple-title">
                      Restablecer Base de Datos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Operación crítica de restauración de datos
                    </p>
                  </div>
                </div>

                {!isRestoring && (
                  <button
                    type="button"
                    onClick={() => setBackupParaRestablecer(null)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Advertencia y detalles del archivo */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-medium leading-relaxed">
                  Esta acción reemplazará la información actual de la base de datos con los datos contenidos en esta copia de seguridad.
                </p>
                <div className="pt-1 border-t border-amber-500/20 text-[11px] font-mono space-y-0.5">
                  <div><strong>Archivo:</strong> {backupParaRestablecer.filename}</div>
                  <div><strong>Tamaño:</strong> {backupParaRestablecer.sizeFormatted}</div>
                  <div><strong>Fecha:</strong> {backupParaRestablecer.createdAt}</div>
                </div>
              </div>

              {/* Mensaje de Respaldo Preventivo Garantizado */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Copia Preventiva Automática:</strong> Antes de aplicar los cambios, el sistema generará automáticamente un respaldo previo del estado actual. Si te equivocas de archivo, podrás recuperarlo de inmediato.
                </span>
              </div>

              {/* Confirmación obligatoria */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-foreground block">
                  Para confirmar, escribe la palabra <strong className="font-mono text-amber-500">RESTABLECER</strong>:
                </label>
                <Input
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value)}
                  placeholder="Escribe RESTABLECER aquí..."
                  disabled={isRestoring}
                  className="font-mono text-xs h-10 rounded-xl uppercase tracking-wider"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBackupParaRestablecer(null)}
                  disabled={isRestoring}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={handleEjecutarRestauracion}
                  disabled={isRestoring || confirmacionTexto.trim() !== 'RESTABLECER'}
                  className="rounded-xl text-xs h-9 px-5 font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? 'Restableciendo Base de Datos...' : 'Confirmar y Restablecer'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
