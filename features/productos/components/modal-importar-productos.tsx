'use client';

import * as React from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  downloadPlantillaImportacionProductos,
  parseProductosExcel,
  type FilaProductoImportar,
} from '@/lib/excel-export';
import {
  importarProductosExcelAction,
  type ResultadoImportacion,
} from '../actions';
import { useRouter } from 'next/navigation';

interface ModalImportarProductosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalImportarProductos({
  isOpen,
  onClose,
  onSuccess,
}: ModalImportarProductosProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [filas, setFilas] = React.useState<FilaProductoImportar[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
  const [filtroVista, setFiltroVista] = React.useState<'todos' | 'validos' | 'errores'>('todos');
  const [resultado, setResultado] = React.useState<ResultadoImportacion | null>(null);

  // Reiniciar estado al cerrar o abrir
  const handleCerrar = () => {
    if (isImporting) return;
    setFile(null);
    setFilas([]);
    setResultado(null);
    setFiltroVista('todos');
    onClose();
  };

  const handleDescargarPlantilla = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadPlantillaImportacionProductos();
      toast.success('Plantilla oficial descargada con éxito.');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al descargar plantilla: ' + (err.message || ''));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const procesarArchivo = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor seleccione un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setResultado(null);

    try {
      const data = await parseProductosExcel(selectedFile);
      if (data.length === 0) {
        toast.warning('El archivo Excel no contiene filas de medicamentos válidas.');
      } else {
        toast.success(`Archivo procesado: ${data.length} filas detectadas.`);
      }
      setFilas(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al leer el archivo Excel: ' + (err.message || ''));
      setFile(null);
      setFilas([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      procesarArchivo(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      procesarArchivo(files[0]);
    }
  };

  const handleEjecutarImportacion = async () => {
    const filasValidas = filas.filter((f) => f.valido);
    if (filasValidas.length === 0) {
      toast.error('No hay filas válidas para importar en este archivo.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await importarProductosExcelAction(filasValidas);
      if (!res.success) {
        toast.error(res.error || 'Ocurrió un error durante la importación.');
        return;
      }

      setResultado(res);
      toast.success(
        `Importación completada: ${res.nuevos} nuevos, ${res.actualizados} actualizados.`
      );
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Error de conexión al importar: ' + (err.message || ''));
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const filasValidas = filas.filter((f) => f.valido);
  const filasConError = filas.filter((f) => !f.valido);

  const filasFiltradas = filas.filter((f) => {
    if (filtroVista === 'validos') return f.valido;
    if (filtroVista === 'errores') return !f.valido;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-slate-50 dark:bg-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Importador Masivo de Medicamentos
              </h2>
              <p className="text-xs text-muted-foreground">
                Carga tu catálogo maestro y presentaciones comerciales desde una hoja de cálculo Excel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrar}
            disabled={isImporting}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Si ya se completó la importación con éxito */}
          {resultado ? (
            <div className="space-y-5 py-4">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">
                  ¡Importación Finalizada con Éxito!
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Los registros fueron procesados y sincronizados con el catálogo farmacéutico de la botica.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 text-center">
                  <span className="text-[11px] text-muted-foreground block font-medium">Total Procesados</span>
                  <span className="text-2xl font-bold text-foreground">{resultado.totalProcesados}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[11px] text-emerald-400 block font-medium">Nuevos Fármacos</span>
                  <span className="text-2xl font-bold text-emerald-400">+{resultado.nuevos}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-[11px] text-blue-400 block font-medium">Actualizados</span>
                  <span className="text-2xl font-bold text-blue-400">{resultado.actualizados}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <span className="text-[11px] text-purple-400 block font-medium">Presentaciones</span>
                  <span className="text-2xl font-bold text-purple-400">{resultado.presentacionesRegistradas}</span>
                </div>
              </div>

              {resultado.errores && resultado.errores.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Observaciones en algunas filas ({resultado.errores.length})</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-muted-foreground font-mono">
                    {resultado.errores.map((err, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-amber-400 font-bold">Fila {err.fila}:</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Sección 1: Instrucciones y Descarga de Plantilla */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#1a1a1d] border border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold text-foreground">
                      Paso 1: Descarga la Plantilla Oficial
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Incluye ejemplos, columnas para DCI, laboratorio, presentación, factor y código de barras.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDescargarPlantilla}
                  disabled={isDownloadingTemplate}
                  className="rounded-xl text-xs border-border/70 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-1.5 transition-colors shrink-0"
                >
                  {isDownloadingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  ) : (
                    <Download className="h-4 w-4 text-emerald-400" />
                  )}
                  <span>Descargar Plantilla (.xlsx)</span>
                </Button>
              </div>

              {/* Sección 2: Dropzone de Archivo */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span>Paso 2: Sube tu archivo con los datos completos</span>
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[0.99]'
                        : 'border-border/70 hover:border-primary/50 bg-slate-50/50 dark:bg-[#19191c] hover:bg-slate-100/60 dark:hover:bg-[#1e1e22]'
                    }`}
                  >
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-[#202024] border border-border/60 flex items-center justify-center text-muted-foreground mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Haz clic para buscar o arrastra tu archivo Excel aquí
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos compatibles: Microsoft Excel (.xlsx, .xls)
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FileCheck2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB · {filas.length} filas leídas
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setFilas([]);
                      }}
                      disabled={isImporting}
                      className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Cambiar Archivo
                    </Button>
                  </div>
                )}
              </div>

              {/* Sección 3: Previsualización de Datos */}
              {isParsing && (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Analizando y validando estructura del archivo Excel...
                  </p>
                </div>
              )}

              {filas.length > 0 && !isParsing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Previsualización de Fármacos
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                        {filas.length} registros
                      </span>
                    </div>

                    {/* Filtros de la tabla previa */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1f1f23] p-0.5 rounded-lg border border-border/50 text-xs">
                      <button
                        type="button"
                        onClick={() => setFiltroVista('todos')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                          filtroVista === 'todos'
                            ? 'bg-white dark:bg-[#161618] text-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Todos ({filas.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroVista('validos')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                          filtroVista === 'validos'
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Válidos ({filasValidas.length})
                      </button>
                      {filasConError.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFiltroVista('errores')}
                          className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                            filtroVista === 'errores'
                              ? 'bg-rose-500/15 text-rose-400 font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Con Error ({filasConError.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-border/60 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white dark:bg-[#161618]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-[#1c1c1f] text-muted-foreground sticky top-0 border-b border-border/60">
                        <tr>
                          <th className="py-2 px-3 font-semibold w-12 text-center">Fila</th>
                          <th className="py-2 px-3 font-semibold">Código</th>
                          <th className="py-2 px-3 font-semibold">Medicamento</th>
                          <th className="py-2 px-3 font-semibold">Laboratorio</th>
                          <th className="py-2 px-3 font-semibold">Presentación</th>
                          <th className="py-2 px-3 font-semibold text-right">Precio Venta</th>
                          <th className="py-2 px-3 font-semibold text-center w-24">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {filasFiltradas.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 dark:hover:bg-[#1e1e22] transition-colors ${
                              !item.valido ? 'bg-rose-500/10' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-muted-foreground">
                              {item.fila}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground font-semibold">
                              {item.codigo_interno || (
                                <span className="text-[10px] text-muted-foreground/60 italic font-sans">
                                  Auto
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-sans">
                              <span className="font-semibold text-foreground block">
                                {item.nombre_comercial}
                              </span>
                              {item.nombre_generico && (
                                <span className="text-[10px] text-muted-foreground italic block">
                                  DCI: {item.nombre_generico}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-sans text-muted-foreground">
                              {item.laboratorio || '-'}
                            </td>
                            <td className="py-2 px-3 font-sans">
                              <span className="font-medium text-foreground">
                                {item.presentacion_nombre}
                              </span>
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                Factor: x{item.presentacion_factor}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-foreground">
                              S/ {item.precio_venta.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.valido ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Listo
                                </span>
                              ) : (
                                <span
                                  title={item.error}
                                  className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-sans cursor-help"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-slate-50 dark:bg-[#1a1a1d] flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {filas.length > 0 && !resultado && (
              <span>
                {filasValidas.length} de {filas.length} registros listos para procesar.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCerrar}
              disabled={isImporting}
              className="rounded-xl text-xs"
            >
              {resultado ? 'Cerrar' : 'Cancelar'}
            </Button>

            {!resultado && (
              <Button
                type="button"
                size="sm"
                onClick={handleEjecutarImportacion}
                disabled={isImporting || filasValidas.length === 0}
                className="rounded-xl text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importando al catálogo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>
                      Importar {filasValidas.length > 0 ? `(${filasValidas.length})` : ''}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
