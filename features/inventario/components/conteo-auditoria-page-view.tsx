'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Barcode, 
  Search, 
  CheckCircle2, 
  Save, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { aplicarTomaInventarioAction } from '@/features/inventario/actions-toma';
import type { TomaInventario } from '@/features/inventario/queries-toma';

export interface ItemAuditoria {
  id: string;
  producto_id: string;
  codigo_interno: string;
  nombre_comercial: string;
  concentracion?: string;
  unidad_base: string;
  codigo_barras?: string;
  numero_lote: string;
  fecha_vencimiento: string;
  lote_id: string;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  costo_promedio: number;
  justificacion?: string;
}

interface ConteoAuditoriaPageViewProps {
  toma: TomaInventario;
  itemsIniciales: ItemAuditoria[];
}

export function ConteoAuditoriaPageView({ toma, itemsIniciales }: ConteoAuditoriaPageViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<ItemAuditoria[]>(itemsIniciales);
  const [filtroTexto, setFiltroTexto] = React.useState('');
  const [filtroEstado, setFiltroEstado] = React.useState<'todos' | 'diferencias' | 'ok'>('todos');
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-foco en escáner de barras al cargar
  React.useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Lógica de pistola / lector de código de barras
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Buscar por código de barras exacto, código interno o número de lote
    const matchIndex = items.findIndex(
      (it) =>
        it.codigo_barras === code ||
        it.codigo_interno === code ||
        it.numero_lote.toLowerCase() === code.toLowerCase()
    );

    if (matchIndex >= 0) {
      const match = items[matchIndex];
      // Incrementar stock físico en +1
      const nuevoFisico = match.stock_fisico + 1;
      const nuevaDif = nuevoFisico - match.stock_sistema;

      setItems((prev) => {
        const copy = [...prev];
        copy[matchIndex] = {
          ...copy[matchIndex],
          stock_fisico: nuevoFisico,
          diferencia: nuevaDif,
        };
        return copy;
      });

      toast.success(`+1 en ${match.nombre_comercial} (Lote: ${match.numero_lote}) -> Total: ${nuevoFisico}`);
      setBarcodeInput('');
    } else {
      toast.error(`No se encontró ningún producto con código/lote: ${code}`);
      setBarcodeInput('');
    }
  };

  const handleUpdateStockFisico = (itemId: string, valor: string) => {
    const num = parseInt(valor, 10);
    setItems((prev) =>
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

  const handleIncrementar = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const fisico = Math.max(0, it.stock_fisico + delta);
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
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, justificacion: justif } : it))
    );
  };

  const handleAplicarConteo = async () => {
    const diferenciasCount = items.filter((i) => i.diferencia !== 0).length;
    const desc = diferenciasCount > 0
      ? `Hay ${diferenciasCount} lotes con diferencias que ajustarán el Kardex y stock de la botica.`
      : 'Todos los lotes coinciden exactamente con el sistema.';

    toast('¿Confirmar cierre y ajuste definitivo de stock?', {
      description: desc,
      action: {
        label: 'Aplicar Auditoría',
        onClick: async () => {
          setIsSubmitting(true);
          try {
            const conteos: Record<string, number> = {};
            const justifs: Record<string, string> = {};

            items.forEach((it) => {
              conteos[it.id] = it.stock_fisico;
              if (it.justificacion) justifs[it.id] = it.justificacion;
            });

            const res = await aplicarTomaInventarioAction(toma.id, conteos, justifs);
            if (res.success) {
              toast.success('Auditoría aplicada con éxito. Stock oficial actualizado.');
              router.push('/inventario?tab=tomas');
              router.refresh();
            } else {
              toast.error(res.error || 'Error al aplicar auditoría');
            }
          } catch (err: any) {
            toast.error(err.message || 'Error de red');
          } finally {
            setIsSubmitting(false);
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: 10000,
    });
  };

  // Filtrado
  const itemsFiltrados = items.filter((it) => {
    const coincideTexto =
      it.nombre_comercial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      it.numero_lote.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (it.codigo_barras && it.codigo_barras.includes(filtroTexto));

    if (!coincideTexto) return false;
    if (filtroEstado === 'diferencias') return it.diferencia !== 0;
    if (filtroEstado === 'ok') return it.diferencia === 0;
    return true;
  });

  const totalSobrantes = items.filter((i) => i.diferencia > 0).length;
  const totalFaltantes = items.filter((i) => i.diferencia < 0).length;
  const totalCoincidentes = items.filter((i) => i.diferencia === 0).length;
  const esCerrada = toma.estado === 'aplicado';

  return (
    <div className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Barra superior / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-xl h-9 w-9 p-0">
            <Link href="/inventario?tab=tomas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Toma de Inventario: {toma.codigo}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs font-mono ${
                  esCerrada
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                }`}
              >
                {esCerrada ? 'Finalizado & Aplicado' : 'Conteo en Progreso'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {toma.sucursal_nombre}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Inicio: {toma.fecha_inicio}
              </span>
              <span>·</span>
              <span>Responsable: {toma.responsable_nombre || 'Director Técnico'}</span>
            </p>
          </div>
        </div>

        {!esCerrada && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAplicarConteo}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 h-9 px-4 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Aplicando...' : 'Finalizar y Ajustar Stock'}
            </Button>
          </div>
        )}
      </div>

      {/* Escáner de Códigos de Barras Rápido */}
      {!esCerrada && (
        <Card className="p-4 apple-glass border-2 border-[#0071e3]/30 bg-gradient-to-r from-[#0071e3]/5 via-transparent to-transparent">
          <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
              <Barcode className="h-6 w-6" />
            </div>
            <div className="flex-1 w-full space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Registro Rápido con Pistola / Lector de Barras</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#0071e3]/15 text-[#0071e3] font-mono">
                  Auto +1 por escaneo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pase el código de barras o lote del fármaco. El sistema sumará +1 inmediatamente al conteo físico.
              </p>
            </div>
            <div className="w-full sm:w-80 flex items-center gap-2">
              <Input
                ref={barcodeInputRef}
                placeholder="Escanee código o digite..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="h-10 text-xs font-mono font-bold tracking-wider rounded-xl bg-background"
              />
              <Button type="submit" size="sm" className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl h-10 px-3">
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Métricas de Progreso y Comparación */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 apple-glass space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Lotes Auditados</span>
          <div className="text-2xl font-bold font-mono text-foreground">{items.length}</div>
          <span className="text-[10px] text-muted-foreground">Base de datos de la sede</span>
        </Card>

        <Card className="p-3.5 apple-glass space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Coincidentes Exactos</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {totalCoincidentes}
          </div>
          <span className="text-[10px] text-emerald-600/80">Stock Físico = Sistema</span>
        </Card>

        <Card className="p-3.5 apple-glass space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Faltantes (Mermas)</span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {totalFaltantes}
          </div>
          <span className="text-[10px] text-rose-600/80">Requieren justificación</span>
        </Card>

        <Card className="p-3.5 apple-glass space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Sobrantes (Excedentes)</span>
          <div className="text-2xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
            {totalSobrantes}
          </div>
          <span className="text-[10px] text-[#0071e3]/80">Unidades adicionales</span>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
          {[
            { id: 'todos', label: 'Todos los Lotes', badge: `${items.length}` },
            { id: 'diferencias', label: 'Con Diferencias', badge: `${totalFaltantes + totalSobrantes}` },
            { id: 'ok', label: 'Coincidentes', badge: `${totalCoincidentes}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filtroEstado === tab.id
                  ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1]">
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por fármaco, lote o código de barras..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="h-9 pl-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Tabla Principal de Auditoría */}
      <Card className="p-0 overflow-hidden apple-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Producto / Fármaco</th>
                <th className="px-4 py-3 text-left font-medium">Lote & Vencimiento</th>
                <th className="px-4 py-3 text-center font-medium">Stock en BD (Sistema)</th>
                <th className="px-4 py-3 text-center font-medium text-[#0071e3] font-bold">
                  Stock Físico (Anaquel)
                </th>
                <th className="px-4 py-3 text-center font-medium">Discrepancia</th>
                <th className="px-4 py-3 text-left font-medium">Justificación / Causa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No hay productos que coincidan con el filtro actual.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-sm">{item.nombre_comercial}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{item.codigo_interno}</span>
                        {item.concentracion && <span>· {item.concentracion}</span>}
                        <span>· {item.unidad_base}</span>
                        {item.codigo_barras && (
                          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded">
                            {item.codigo_barras}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-foreground">{item.numero_lote}</div>
                      <div className="text-[11px] text-muted-foreground">Vence: {item.fecha_vencimiento}</div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="font-mono font-bold text-base text-foreground">
                        {item.stock_sistema}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{item.unidad_base}</span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {esCerrada ? (
                        <div className="font-mono font-bold text-base text-[#0071e3]">
                          {item.stock_fisico}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleIncrementar(item.id, -1)}
                            className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-muted/80 hover:bg-muted active:scale-95 text-foreground font-bold flex items-center justify-center text-lg apple-press-feedback transition-transform cursor-pointer select-none"
                            title="Restar 1 unidad"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            min="0"
                            value={item.stock_fisico}
                            onChange={(e) => handleUpdateStockFisico(item.id, e.target.value)}
                            className="w-24 h-11 text-center font-mono font-bold text-lg rounded-xl border-[#0071e3]/40 focus:border-[#0071e3] shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrementar(item.id, 1)}
                            className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-[#0071e3]/15 hover:bg-[#0071e3]/25 active:scale-95 text-[#0071e3] dark:text-[#2997ff] font-bold flex items-center justify-center text-lg apple-press-feedback transition-transform cursor-pointer select-none"
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {item.diferencia === 0 ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-xs font-bold">
                          0 (OK)
                        </Badge>
                      ) : item.diferencia < 0 ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-mono text-xs font-bold flex items-center gap-1 justify-center w-fit mx-auto">
                          <TrendingDown className="w-3.5 h-3.5" /> {item.diferencia}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-[#0071e3] border-blue-500/20 font-mono text-xs font-bold flex items-center gap-1 justify-center w-fit mx-auto">
                          <TrendingUp className="w-3.5 h-3.5" /> +{item.diferencia}
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {esCerrada ? (
                        <span className="text-muted-foreground text-xs">{item.justificacion || '—'}</span>
                      ) : (
                        <Input
                          placeholder="Motivo de discrepancia (merma, quiebre)..."
                          value={item.justificacion || ''}
                          onChange={(e) => handleUpdateJustificacion(item.id, e.target.value)}
                          className="h-8 text-xs rounded-xl max-w-sm"
                        />
                      )}
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
