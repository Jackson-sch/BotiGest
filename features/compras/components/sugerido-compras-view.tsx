'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Plus, 
  Building2,
  DollarSign,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import type { SugeridoCompraItem } from '../queries-sugerido';
import Link from 'next/link';

interface SugeridoComprasViewProps {
  sugeridos: SugeridoCompraItem[];
}

export function SugeridoComprasView({ sugeridos }: SugeridoComprasViewProps) {
  const router = useRouter();
  const [soloQuiebre, setSoloQuiebre] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});

  const listaFiltrada = soloQuiebre
    ? sugeridos.filter((s) => s.stock_actual <= s.promedio_diario * 3)
    : sugeridos;

  const totalInversionEstimada = listaFiltrada.reduce((acc, s) => acc + s.inversion_estimada, 0);
  const itemsEnRiesgo = sugeridos.filter((s) => s.dias_inventario_restante < 5).length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    const todosSeleccionados = listaFiltrada.every((s) => selectedIds[s.producto_id]);
    if (todosSeleccionados) {
      setSelectedIds({});
    } else {
      const nuevo: Record<string, boolean> = {};
      listaFiltrada.forEach((s) => {
        nuevo[s.producto_id] = true;
      });
      setSelectedIds(nuevo);
    }
  };

  const seleccionadosCount = Object.values(selectedIds).filter(Boolean).length;

  const handleCrearOrdenConSeleccionados = () => {
    const itemsAComprar = listaFiltrada
      .filter((s) => selectedIds[s.producto_id])
      .map((s) => ({
        producto_id: s.producto_id,
        nombre: s.nombre_comercial,
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
        cantidad_sugerida: item.cantidad_sugerida_comprar,
        costo_promedio: item.costo_promedio,
      },
    ];
    sessionStorage.setItem('botigest_sugerido_compra_draft', JSON.stringify(itemsAComprar));
    router.push('/compras/nueva?origen=sugerido');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Sugerido Automático de Compras</h2>
            <Badge variant="outline" className="bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" /> Basado en Rotación 30d
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cálculo de Punto de Reorden (ROP) y consumo promedio diario para evitar quiebres de stock.
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
              <span>Generar Orden con ({seleccionadosCount}) seleccionados</span>
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
            Fármacos con rotación activa
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
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title="Seleccionar todos"
                  >
                    {listaFiltrada.length > 0 && listaFiltrada.every((s) => selectedIds[s.producto_id]) ? (
                      <CheckSquare className="w-4 h-4 text-[#0071e3]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
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
                    No se encontraron productos que requieran reposición inmediata.
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
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.producto_id)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0071e3]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-foreground">{item.nombre_comercial}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.codigo_interno} {item.concentracion ? `· ${item.concentracion}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.laboratorio}
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
