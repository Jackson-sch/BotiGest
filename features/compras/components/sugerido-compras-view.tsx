'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Plus, 
  Building2,
  DollarSign,
  ArrowRight,
  Filter,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import type { SugeridoCompraItem } from '../queries-sugerido';
import Link from 'next/link';

interface SugeridoComprasViewProps {
  sugeridos: SugeridoCompraItem[];
}

export function SugeridoComprasView({ sugeridos }: SugeridoComprasViewProps) {
  const router = useRouter();
  const [soloQuiebre, setSoloQuiebre] = React.useState(false);
  const [selectedLab, setSelectedLab] = React.useState<string>('todos');
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});

  // Lista de laboratorios únicos con conteo
  const laboratorios = React.useMemo(() => {
    const map = new Map<string, number>();
    sugeridos.forEach((s) => {
      const lab = s.laboratorio || 'Varios';
      map.set(lab, (map.get(lab) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [sugeridos]);

  // Filtrar según quiebre y laboratorio seleccionado
  const listaFiltrada = React.useMemo(() => {
    return sugeridos.filter((s) => {
      if (soloQuiebre && s.stock_actual > s.promedio_diario * 3) {
        return false;
      }
      if (selectedLab !== 'todos' && (s.laboratorio || 'Varios') !== selectedLab) {
        return false;
      }
      return true;
    });
  }, [sugeridos, soloQuiebre, selectedLab]);

  const totalInversionEstimada = listaFiltrada.reduce((acc, s) => acc + s.inversion_estimada, 0);
  const itemsEnRiesgo = sugeridos.filter((s) => s.dias_inventario_restante < 5).length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      // Si desmarca, solo desmarcar los visibles en el filtro actual
      const nuevo = { ...selectedIds };
      listaFiltrada.forEach((s) => {
        delete nuevo[s.producto_id];
      });
      setSelectedIds(nuevo);
    } else {
      const nuevo = { ...selectedIds };
      listaFiltrada.forEach((s) => {
        nuevo[s.producto_id] = true;
      });
      setSelectedIds(nuevo);
    }
  };

  const seleccionadosVisibles = listaFiltrada.filter((s) => selectedIds[s.producto_id]);
  const seleccionadosCount = Object.values(selectedIds).filter(Boolean).length;

  // Analizar laboratorios presentes en la selección actual
  const laboratoriosSeleccionados = React.useMemo(() => {
    const map = new Map<string, number>();
    sugeridos.forEach((s) => {
      if (selectedIds[s.producto_id]) {
        const lab = s.laboratorio || 'Varios';
        map.set(lab, (map.get(lab) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([nombre, count]) => ({ nombre, count }));
  }, [sugeridos, selectedIds]);

  const todosSeleccionados =
    listaFiltrada.length > 0 && listaFiltrada.every((s) => selectedIds[s.producto_id]);

  const handleCrearOrdenConSeleccionados = () => {
    const itemsAComprar = sugeridos
      .filter((s) => selectedIds[s.producto_id])
      .map((s) => ({
        producto_id: s.producto_id,
        nombre: s.nombre_comercial,
        laboratorio: s.laboratorio,
        cantidad_sugerida: s.cantidad_sugerida_comprar,
        costo_promedio: s.costo_promedio,
      }));

    if (itemsAComprar.length === 0) return;

    // Guardar en sessionStorage para ser cargados en la página de nueva compra
    sessionStorage.setItem('botigest_sugerido_compra_draft', JSON.stringify(itemsAComprar));
    router.push('/compras/nueva?origen=sugerido');
  };

  const handleOrdenarUno = (item: SugeridoCompraItem) => {
    const itemsAComprar = [
      {
        producto_id: item.producto_id,
        nombre: item.nombre_comercial,
        laboratorio: item.laboratorio,
        cantidad_sugerida: item.cantidad_sugerida_comprar,
        costo_promedio: item.costo_promedio,
      },
    ];
    sessionStorage.setItem('botigest_sugerido_compra_draft', JSON.stringify(itemsAComprar));
    router.push('/compras/nueva?origen=sugerido');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Sugerido Automático de Compras</h2>
            <Badge variant="outline" className="bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" /> Basado en Rotación 30d
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cálculo de Punto de Reorden (ROP) y rotación diaria para emitir pedidos por droguería o laboratorio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {seleccionadosCount > 0 ? (
            <Button
              size="sm"
              onClick={handleCrearOrdenConSeleccionados}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Generar Orden con ({seleccionadosCount}) ítems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoloQuiebre(!soloQuiebre)}
                className={`text-xs rounded-xl ${
                  soloQuiebre ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : ''
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                {soloQuiebre ? 'Mostrando en Riesgo' : 'Solo en Riesgo (<3d)'}
              </Button>

              <Button asChild size="sm" className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs rounded-xl">
                <Link href="/compras/nueva">
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva Orden Manual
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerta inteligente multi-laboratorio cuando se seleccionan varios ítems */}
      {laboratoriosSeleccionados.length > 1 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                Selección de múltiples laboratorios ({laboratoriosSeleccionados.length}):
              </span>
              <p className="text-amber-700/90 dark:text-amber-400/90 text-[11px] mt-0.5">
                Ha marcado medicamentos de: {laboratoriosSeleccionados.map((l) => `${l.nombre} (${l.count})`).join(', ')}.
                Asegúrese de que su droguería mayorista distribuya todas estas marcas o filtre por un laboratorio específico para pedidos directos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {laboratoriosSeleccionados.slice(0, 2).map((l) => (
              <Button
                key={l.nombre}
                variant="outline"
                size="sm"
                onClick={() => setSelectedLab(l.nombre)}
                className="h-7 text-[11px] rounded-lg border-amber-500/30 bg-background/60 hover:bg-amber-500/20"
              >
                Solo {l.nombre}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros de la vista: Laboratorio y Quiebre */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-muted/20 border border-border/40 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={selectedLab}
              onValueChange={(val) => setSelectedLab(val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl">
                <SelectValue placeholder="Filtrar por Laboratorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  Todos los Laboratorios ({sugeridos.length})
                </SelectItem>
                {laboratorios.map((lab) => (
                  <SelectItem key={lab.nombre} value={lab.nombre}>
                    {lab.nombre} ({lab.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLab !== 'todos' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLab('todos')}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Restablecer filtro
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
          <span>Mostrando: <strong className="text-foreground">{listaFiltrada.length}</strong> productos</span>
          {seleccionadosCount > 0 && (
            <Badge variant="secondary" className="text-xs font-mono">
              {seleccionadosCount} seleccionados en total
            </Badge>
          )}
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Ítems a Reponer</span>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {listaFiltrada.length}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {selectedLab === 'todos' ? 'En todos los laboratorios' : `Laboratorio: ${selectedLab}`}
          </span>
        </Card>

        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">En Riesgo Inminente</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {itemsEnRiesgo}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Inventario para menos de 5 días
          </span>
        </Card>

        <Card className="p-4 apple-glass space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Inversión Estimada</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalInversionEstimada)}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Costo sugerido de reposición
          </span>
        </Card>
      </div>

      {/* Tabla de análisis de reposición */}
      <Card className="p-0 overflow-hidden apple-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-3 py-2.5 text-center font-medium w-10">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={todosSeleccionados}
                      onCheckedChange={(val) => handleSelectAll(!!val)}
                      aria-label="Seleccionar todos"
                    />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left font-medium">Fármaco / Presentación</th>
                <th className="px-4 py-2.5 text-left font-medium">Laboratorio</th>
                <th className="px-4 py-2.5 text-right font-medium">Stock Actual</th>
                <th className="px-4 py-2.5 text-right font-medium">Ventas (30d)</th>
                <th className="px-4 py-2.5 text-right font-medium">Rotación Diaria</th>
                <th className="px-4 py-2.5 text-right font-medium">Días Cobertura</th>
                <th className="px-4 py-2.5 text-right font-medium text-[#0071e3] font-bold">Sugerido Comprar</th>
                <th className="px-4 py-2.5 text-right font-medium">Inversión Est.</th>
                <th className="px-4 py-2.5 text-center font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron productos que requieran reposición con los filtros actuales.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => {
                  const isChecked = !!selectedIds[item.producto_id];
                  return (
                    <tr 
                      key={item.producto_id} 
                      className={`hover:bg-muted/30 transition-colors ${
                        isChecked ? 'bg-[#0071e3]/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleSelect(item.producto_id)}
                            aria-label={`Seleccionar ${item.nombre_comercial}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-foreground">{item.nombre_comercial}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.codigo_interno} {item.concentracion ? `· ${item.concentracion}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge 
                          variant="outline" 
                          className="text-[10px] font-normal cursor-pointer hover:bg-muted/50 border-border/60 transition-colors"
                          onClick={() => setSelectedLab(item.laboratorio || 'Varios')}
                          title="Haga clic para filtrar por este laboratorio"
                        >
                          <Building2 className="w-2.5 h-2.5 mr-1 opacity-70" />
                          {item.laboratorio || 'Varios'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium">
                        <span className={item.stock_actual <= 5 ? 'text-rose-500 font-bold' : ''}>
                          {item.stock_actual} {item.unidad_base}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {item.unidades_vendidas_30d}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                        {item.promedio_diario}/día
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            item.dias_inventario_restante < 4
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : item.dias_inventario_restante < 8
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          }`}
                        >
                          {item.dias_inventario_restante} días
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-[#0071e3] dark:text-[#2997ff]">
                        {item.cantidad_sugerida_comprar} {item.unidad_base}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatMoney(item.inversion_estimada)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleOrdenarUno(item)}
                          className="h-7 px-2.5 text-[11px] rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-1 mx-auto"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Ordenar</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
