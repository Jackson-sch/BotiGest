'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import {
  TrendingUp,
  BarChart3,
  Pill,
  ShieldAlert,
  ArrowRight,
  Receipt,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Ventas7DiasItem {
  dia: string;
  fecha: string;
  total: number;
  cantidad: number;
}

interface TopProductoItem {
  nombre: string;
  categoria?: string;
  cantidad: number;
  total: number;
}

interface FefoResumenItem {
  vencidos: number;
  criticos30d: number;
  alerta90d: number;
  optimos90d?: number;
  totalLotes?: number;
  totalRiesgo: number;
}

interface DashboardChartsProps {
  ventasUltimos7Dias: Ventas7DiasItem[];
  topProductosVendidos: TopProductoItem[];
  fefoResumen: FefoResumenItem;
}

const ventasConfig = {
  total: {
    label: 'Ingresos (S/)',
    color: '#0071e3',
  },
  cantidad: {
    label: 'Comprobantes',
    color: '#34c759',
  },
} satisfies ChartConfig;

const topProductosConfig = {
  cantidad: {
    label: 'Unidades Vendidas',
    color: '#0071e3',
  },
} satisfies ChartConfig;

const fefoConfig = {
  optimos: {
    label: 'Óptimos (> 90d)',
    color: '#30d158',
  },
  alerta: {
    label: 'Alerta (31-90d)',
    color: '#ffd60a',
  },
  criticos: {
    label: 'Críticos (< 30d)',
    color: '#ff453a',
  },
  vencidos: {
    label: 'Vencidos',
    color: '#8e8e93',
  },
} satisfies ChartConfig;

/**
 * 1. Gráfico Interactivo de Rendimiento de Ventas (Últimos 7 Días)
 * Implementado con shadcn AreaChart y gradientes Apple.
 */
export function VentasTendenciaChart({ data }: { data: Ventas7DiasItem[] }) {
  const [metricaActiva, setMetricaActiva] = React.useState<'total' | 'cantidad'>('total');

  const maxItem = React.useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => b.total - a.total)[0];
  }, [data]);

  const totalSemana = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  const totalOperaciones = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [data]);

  return (
    <Card className="lg:col-span-7 p-5 apple-glass border-border/60 flex flex-col justify-between space-y-4">
      {/* Encabezado con Controles y Métricas Clave */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                Rendimiento Semanal de Ventas
              </h3>
              {maxItem && maxItem.total > 0 && (
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 gap-1 hidden sm:inline-flex">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Pico: {maxItem.dia} ({formatMoney(maxItem.total)})</span>
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total 7 días: <span className="font-semibold text-foreground">{formatMoney(totalSemana)}</span> ({totalOperaciones} tickets)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Switcher de Métrica con altura h-8 */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-border/50 text-[11px]">
            <button
              type="button"
              onClick={() => setMetricaActiva('total')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                metricaActiva === 'total'
                  ? 'bg-white dark:bg-[#161618] text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ingresos (S/)
            </button>
            <button
              type="button"
              onClick={() => setMetricaActiva('cantidad')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                metricaActiva === 'cantidad'
                  ? 'bg-white dark:bg-[#161618] text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tickets
            </button>
          </div>

          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/ventas">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Gráfico shadcn Recharts */}
      <div className="w-full h-56 pt-2">
        <ChartContainer config={ventasConfig} className="w-full h-full aspect-auto">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0071e3" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0071e3" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillCantidad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34c759" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#34c759" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />

            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => String(val).toUpperCase()}
              className="text-[10px] font-semibold"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) =>
                metricaActiva === 'total'
                  ? `S/${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                  : `${val}`
              }
              className="text-[10px] font-mono"
            />

            <ChartTooltip
              cursor={{ stroke: 'rgba(0, 113, 227, 0.3)', strokeWidth: 1.5 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(val, name, item) => (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-muted-foreground">
                        {name === 'total' ? 'Monto Recaudado' : 'Comprobantes'}:
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {name === 'total' ? formatMoney(Number(val)) : `${val} ventas`}
                      </span>
                    </div>
                  )}
                  labelFormatter={(_, payload) => {
                    const diaData = payload?.[0]?.payload as Ventas7DiasItem | undefined;
                    return diaData ? `${diaData.dia.toUpperCase()} · ${diaData.fecha}` : '';
                  }}
                />
              }
            />

            {metricaActiva === 'total' ? (
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0071e3"
                strokeWidth={2.5}
                fill="url(#fillTotal)"
                dot={{ r: 3, fill: '#0071e3', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0071e3', stroke: '#ffffff', strokeWidth: 2 }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="cantidad"
                stroke="#34c759"
                strokeWidth={2.5}
                fill="url(#fillCantidad)"
                dot={{ r: 3, fill: '#34c759', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#34c759', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

/**
 * 2. Gráfico Horizontal de Top Fármacos Más Vendidos
 * Implementado con shadcn BarChart vertical y visualización enriquecida.
 */
export function TopProductosChart({ data }: { data: TopProductoItem[] }) {
  const chartData = React.useMemo(() => {
    return data.map((d) => ({
      ...d,
      nombreCorto: d.nombre.length > 22 ? d.nombre.slice(0, 20) + '...' : d.nombre,
    }));
  }, [data]);

  return (
    <Card className="lg:col-span-5 p-5 apple-glass border-border/60 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center shrink-0">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
              Fármacos de Mayor Demanda
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Mayor rotación de stock registrada en mostrador hoy.
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/inventario">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Gráfico Horizontal de Barras */}
      {data.length > 0 ? (
        <div className="w-full h-56 pt-2">
          <ChartContainer config={topProductosConfig} className="w-full h-full aspect-auto">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />

              <XAxis type="number" hide />
              <YAxis
                dataKey="nombreCorto"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
                className="text-[10px] font-medium fill-foreground"
              />

              <ChartTooltip
                cursor={{ fill: 'rgba(0, 113, 227, 0.08)' }}
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => {
                      const payload = item?.payload as TopProductoItem;
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">Unidades:</span>
                            <span className="font-mono font-bold text-foreground">{val} und.</span>
                          </div>
                          {payload?.total && (
                            <div className="flex justify-between gap-3 text-xs">
                              <span className="text-muted-foreground">Monto:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {formatMoney(payload.total)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as TopProductoItem | undefined;
                      return item?.nombre || '';
                    }}
                  />
                }
              />

              <Bar
                dataKey="cantidad"
                fill="#0071e3"
                radius={[0, 6, 6, 0]}
                barSize={18}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#0071e3' : index === 1 ? '#2997ff' : index === 2 ? '#34c759' : '#ff9f0a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="py-14 text-center text-xs text-muted-foreground">
          Aún no se han registrado ventas en el mostrador hoy.
        </div>
      )}
    </Card>
  );
}

/**
 * 3. Gráfico Donut de Salud del Inventario y Semáforo FEFO
 * Implementado con shadcn PieChart / Donut con centro informativo.
 */
export function InventarioSaludChart({ data }: { data: FefoResumenItem }) {
  const optimos = data.optimos90d ?? Math.max(0, (data.totalLotes || 10) - data.totalRiesgo);
  const total = (data.optimos90d ?? 0) + data.alerta90d + data.criticos30d + data.vencidos || data.totalLotes || 1;

  const pieData = [
    { name: 'optimos', label: 'Óptimos (>90d)', valor: Math.max(optimos, 1), fill: '#30d158' },
    { name: 'alerta', label: 'Preventivos (31-90d)', valor: data.alerta90d, fill: '#ffd60a' },
    { name: 'criticos', label: 'Críticos (<30d)', valor: data.criticos30d, fill: '#ff453a' },
    { name: 'vencidos', label: 'Vencidos / Baja', valor: data.vencidos, fill: '#8e8e93' },
  ].filter((d) => d.valor > 0);

  return (
    <Card className="lg:col-span-5 p-5 apple-glass border-border/60 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#ff9f0a]/10 text-[#ff9f0a] flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
              Semáforo de Vencimiento FEFO
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Salud y rotación preventiva de lotes farmacéuticos.
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/inventario?tab=alertas">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Donut Chart */}
      <div className="w-full h-52 flex items-center justify-center">
        <ChartContainer config={fefoConfig} className="w-full h-full aspect-auto">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const item = pieData.find((p) => p.name === name);
                    const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                    return (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{item?.label || name}:</span>
                        <span className="font-mono font-bold text-foreground">
                          {value} lotes ({pct}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="valor"
              nameKey="name"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold font-mono"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-muted-foreground text-[10px]"
                        >
                          Lotes en Stock
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* Leyenda Semafórica */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#30d158]" />
          <span className="text-muted-foreground">Óptimos (&gt;90d):</span>
          <span className="font-mono font-bold text-foreground">{optimos}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ffd60a]" />
          <span className="text-muted-foreground">Alerta (31-90d):</span>
          <span className="font-mono font-bold text-foreground">{data.alerta90d}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff453a]" />
          <span className="text-muted-foreground">Críticos (&lt;30d):</span>
          <span className="font-mono font-bold text-rose-400">{data.criticos30d}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8e8e93]" />
          <span className="text-muted-foreground">Vencidos:</span>
          <span className="font-mono font-bold text-foreground">{data.vencidos}</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Contenedor Maestro de Gráficos para el Dashboard
 */
export function DashboardChartsSection({
  ventasUltimos7Dias,
  topProductosVendidos,
  fefoResumen,
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Fila 1: Rendimiento de Ventas (7 cols) + Top Fármacos Demanda (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <VentasTendenciaChart data={ventasUltimos7Dias} />
        <TopProductosChart data={topProductosVendidos} />
      </section>

      {/* Fila 2: Semáforo FEFO Donut (5 cols) con tarjetas contextuales */}
    </div>
  );
}
