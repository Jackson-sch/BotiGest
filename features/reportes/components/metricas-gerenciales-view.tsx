'use client';

import * as React from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import type { MetricasGerenciales } from '../types';

interface MetricasGerencialesViewProps {
  metricas: MetricasGerenciales;
}

export function MetricasGerencialesView({ metricas }: MetricasGerencialesViewProps) {
  return (
    <div className="space-y-6">
      {/* 4 Tarjetas Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Ventas Totales</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatMoney(metricas.ventasMesTotal)}
            </div>
            <span className="text-[11px] text-muted-foreground">Comprobantes completados</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Compras a Droguerías</span>
            <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
              {formatMoney(metricas.comprasMesTotal)}
            </div>
            <span className="text-[11px] text-muted-foreground">Mercadería recibida</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Margen Bruto Estimado</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {metricas.margenBrutoEstimado}%
            </div>
            <span className="text-[11px] text-muted-foreground">Rentabilidad sobre ventas</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Percent className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Ticket Promedio</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {formatMoney(metricas.ticketPromedio)}
            </div>
            <span className="text-[11px] text-muted-foreground">Gasto medio por cliente</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Top 5 Fármacos Más Vendidos */}
      <Card className="p-5 border-border/50 bg-sidebar/50 backdrop-blur-xl rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              Top 5 Fármacos de Mayor Rotación (Rotación A)
            </h4>
            <p className="text-xs text-muted-foreground">
              Productos farmacéuticos de mayor demanda para evitar quiebres de stock
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">
            Sugerido de Reposición
          </span>
        </div>

        <div className="divide-y divide-border/30">
          {metricas.topProductos.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aún no hay suficiente historial de dispensación para calcular el ranking de rotación.
            </p>
          ) : (
            metricas.topProductos.map((prod, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-foreground block">
                      {prod.nombre}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {prod.unidades} unidades dispensadas
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-foreground block">
                    {formatMoney(prod.total)}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    Alta Rotación
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
