import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Boxes,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Receipt,
  ScanLine,
  ArrowRight,
  Clock,
  Pill,
  CheckCircle2,
  FileText,
  DollarSign,
  ThermometerSnowflake,
  Activity,
  Calendar,
  Sparkles,
  Lock,
  PackageCheck,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, CondicionVentaBadge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { obtenerMetricasDashboard, type DashboardMetrics } from '@/lib/dashboard-queries';
import { getSessionUser } from '@/lib/auth';
import { isRouteAllowed } from '@/lib/permissions';
import { MetricCardsSkeleton, TableSkeleton } from '@/components/shared/module-skeletons';
import {
  VentasTendenciaChart,
  TopProductosChart,
  InventarioSaludChart,
} from '@/components/dashboard/dashboard-charts';

import { connection } from 'next/server';

async function DashboardLiveMetrics({ data }: { data: DashboardMetrics }) {
  const metrics = [
    {
      title: 'Ventas de Hoy',
      value: formatMoney(data.totalVentasHoy),
      subtext: `${data.operacionesHoy} comprobantes · Prom: ${formatMoney(data.ticketPromedioHoy)}`,
      icon: TrendingUp,
      accent: 'from-[#0071e3] to-[#0051a8]',
      badge: `${data.boletasCountHoy} Bol / ${data.facturasCountHoy} Fact`,
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Turno de Caja',
      value: data.turnoActivo ? `${data.turnoActivo.cajaNombre} · Abierta` : 'Caja Cerrada',
      subtext: data.turnoActivo
        ? `Cajero: ${data.turnoActivo.cajeroNombre} · Apertura ${formatMoney(data.turnoActivo.montoApertura)}`
        : 'Sin turno abierto en este momento',
      icon: Receipt,
      accent: data.turnoActivo ? 'from-[#34c759] to-[#248a3d]' : 'from-[#8e8e93] to-[#636366]',
      badge: data.turnoActivo ? 'En Operación' : 'Cerrado',
      badgeVariant: data.turnoActivo ? ('success' as const) : ('secondary' as const),
      href: '/caja/arqueo',
    },
    {
      title: 'Semáforo FEFO (< 90d)',
      value: `${data.fefoResumen.totalRiesgo} lotes`,
      subtext: `${data.fefoResumen.criticos30d} críticos (<30d) · ${data.fefoResumen.alerta90d} en alerta`,
      icon: AlertTriangle,
      accent: data.fefoResumen.criticos30d > 0 ? 'from-[#ff3b30] to-[#c70000]' : 'from-[#ff9f0a] to-[#d97706]',
      badge: data.fefoResumen.criticos30d > 0 ? 'Crítico FEFO' : 'Acción Preventiva',
      badgeVariant: data.fefoResumen.criticos30d > 0 ? ('destructive' as const) : ('warning' as const),
      href: '/inventario',
    },
    {
      title: 'Controlados & DIGEMID',
      value: `${data.controladosCount} fármacos`,
      subtext: data.cumplimientoSanitario.controladosPendientesFirma > 0
        ? `${data.cumplimientoSanitario.controladosPendientesFirma} folios pendientes de firma Q.F.`
        : 'Libro oficial 100% validado por Q.F.',
      icon: ShieldCheck,
      accent: 'from-[#af52de] to-[#7928ca]',
      badge: 'Ley 29459',
      badgeVariant: 'purple' as const,
      href: '/controlados',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        const CardWrapper = m.href ? Link : 'div';
        return (
          <CardWrapper key={idx} href={m.href || '#'} className={m.href ? 'block group' : ''}>
            <Card className="relative overflow-hidden p-4 sm:p-5 h-full flex flex-col justify-between apple-glass border-border/60 group-hover:border-border transition-all duration-200">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground tracking-apple-body">
                  {m.title}
                </span>
                <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${m.accent} shadow-sm shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="text-2xl font-bold tracking-apple-title text-foreground group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors">
                  {m.value}
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.subtext}</p>
              </div>

              {m.badge && (
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40">
                  <Badge variant={m.badgeVariant} className="text-[10px] font-mono">
                    {m.badge}
                  </Badge>
                  {m.href && (
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground flex items-center gap-0.5 transition-colors">
                      Ver detalle <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              )}
            </Card>
          </CardWrapper>
        );
      })}
    </section>
  );
}

function TendenciasYTopSection({ data }: { data: DashboardMetrics }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <VentasTendenciaChart data={data.ventasUltimos7Dias} />
      <TopProductosChart data={data.topProductosVendidos} />
    </section>
  );
}

function InventarioSaludYFefoSection({ data }: { data: DashboardMetrics }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Donut Chart de Salud del Inventario FEFO (5 columnas) */}
      <InventarioSaludChart data={data.fefoResumen} />

      {/* Lotes Prioritarios de Despacho FEFO (7 columnas) */}
      <Card className="lg:col-span-7 overflow-hidden p-0 apple-glass border-border/60 flex flex-col justify-between">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#2997ff]" />
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-foreground">
                Lotes Prioritarios de Despacho FEFO
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Primeros en vencer, primeros en salir (First Expired, First Out).
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
            <Link href="/inventario">
              <span>Ver kardex</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-border/50 text-muted-foreground uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Medicamento</th>
                <th className="px-3 py-3">Lote / Vencimiento</th>
                <th className="px-3 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.productosDestacados.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span className="font-semibold">{p.nombre}</span>
                      <span className="text-[10px] text-muted-foreground">{p.presentacion}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-mono text-foreground font-medium">{p.lote}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          p.diasParaVencer <= 30
                            ? 'bg-[#ff3b30]/15 text-[#ff3b30] font-bold'
                            : p.diasParaVencer <= 90
                            ? 'bg-[#ff9f0a]/15 text-[#b45309] dark:text-[#f59e0b]'
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
                        }`}
                      >
                        {p.diasParaVencer <= 0 ? 'Vencido' : `Vence en ${p.diasParaVencer}d (${p.vence})`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] font-mono">
                      {p.stock} uds.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                    {formatMoney(p.precio)}
                  </td>
                </tr>
              ))}
              {data.productosDestacados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No hay productos con stock activo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function UltimosComprobantesSection({ data }: { data: DashboardMetrics }) {
  return (
    <section className="grid grid-cols-1 gap-6">
      <Card className="overflow-hidden p-0 apple-glass border-border/60 flex flex-col justify-between">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#34c759]" />
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-foreground">
                Últimos Comprobantes Emitidos
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sincronización en línea con SUNAT OSE en tiempo real.
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
            <Link href="/ventas">
              <span>Ver todas</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.ventasRecientes.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border/40 flex flex-col justify-between gap-3 hover:border-border transition-all"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {v.correlativo}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono py-0 px-1">
                    {v.tipo}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate block">
                  {v.cliente}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block">Hora: {v.hora}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="font-mono text-xs font-bold text-foreground">
                  {formatMoney(v.total)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/20 flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  SUNAT
                </span>
              </div>
            </div>
          ))}

          {data.ventasRecientes.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              Sin operaciones registradas hoy.
            </div>
          )}
        </div>

        {/* Barra de Cadena de Frío & Sensor DIGEMID */}
        <div className="p-3.5 bg-black/[0.03] dark:bg-white/[0.04] border-t border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ThermometerSnowflake className="h-4 w-4 text-[#2997ff]" />
            <span className="text-muted-foreground text-[11px]">Sensor Cadena Frío (Refrigerador DIGEMID):</span>
            <span className="font-mono font-bold text-foreground text-[11px]">
              {data.cumplimientoSanitario.temperaturaCadenaFrio}°C (Óptimo 2°C - 8°C)
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#34c759] animate-pulse" title="Sensor Operativo" />
        </div>
      </Card>
    </section>
  );
}

export default async function HomePage() {
  await connection();
  const user = await getSessionUser();
  const data = await obtenerMetricasDashboard();

  const userRolLabel = user ? user.rol.toUpperCase().replace('_', ' ') : 'OPERACIONES';
  const userName = user ? user.nombres : 'Equipo Farmacéutico';

  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Hero Adaptativo de Bienvenida Farmacéutica */}
      <section className="relative overflow-hidden rounded-3xl apple-glass p-6 border border-border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#34c759] animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Botica San Martín · {userRolLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-apple-display text-foreground">
            ¡Hola, {userName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body leading-relaxed">
            Sistema activo con despacho automático FEFO, control de recetas DIGEMID y facturación electrónica SUNAT en tiempo real.
          </p>
        </div>

        {/* Accesos Rápidos Inteligentes según Permisos */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {(!user || isRouteAllowed('/pos', user.rol)) && (
            <Button asChild className="flex-1 sm:flex-initial rounded-2xl gap-2 font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shadow-[#0071e3]/25 apple-press-feedback text-xs h-10 px-4">
              <Link href="/pos">
                <ScanLine className="h-4 w-4" />
                <span>Punto de Venta (F4)</span>
              </Link>
            </Button>
          )}

          {(!user || isRouteAllowed('/caja', user.rol)) && (
            <Button asChild variant="outline" className="flex-1 sm:flex-initial rounded-2xl gap-2 text-xs h-10 px-4 border-border hover:bg-black/5 dark:hover:bg-white/5 apple-press-feedback">
              <Link href="/caja/arqueo">
                <Lock className="h-3.5 w-3.5 text-[#af52de]" />
                <span>Arqueo de Caja</span>
              </Link>
            </Button>
          )}

          {(!user || isRouteAllowed('/inventario', user.rol)) && (
            <Button asChild variant="outline" className="flex-1 sm:flex-initial rounded-2xl gap-2 text-xs h-10 px-4 border-border hover:bg-black/5 dark:hover:bg-white/5 apple-press-feedback">
              <Link href="/inventario">
                <Boxes className="h-3.5 w-3.5 text-[#2997ff]" />
                <span>Kardex & Lotes</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Glow sutil en esquina */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-[#0071e3]/10 to-transparent blur-3xl pointer-events-none" />
      </section>

      {/* 4 Métricas Clave en Vivo */}
      <Suspense fallback={<MetricCardsSkeleton count={4} />}>
        <DashboardLiveMetrics data={data} />
      </Suspense>

      {/* Gráficos de Tendencia Semanal & Ranking de Fármacos con shadcn/ui */}
      <TendenciasYTopSection data={data} />

      {/* Salud de Inventario (Donut FEFO) & Lotes Prioritarios */}
      <InventarioSaludYFefoSection data={data} />

      {/* Últimas Operaciones SUNAT & Cadena de Frío */}
      <UltimosComprobantesSection data={data} />

      {/* Pie de Página */}
      <footer className="pt-4 border-t border-border/40 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>BotiGest · Sistema Integral de Gestión Farmacéutica bajo Ley 29459 & SUNAT</p>
        <span className="text-[11px] font-mono text-muted-foreground">Estado OSE: 100% Operativo</span>
      </footer>
    </main>
  );
}
