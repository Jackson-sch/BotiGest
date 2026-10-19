import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Snowflake,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import {
  InventarioTabs,
  obtenerLotesInventario,
  obtenerAlertasFefo,
  obtenerMovimientosKardex,
} from '@/features/inventario';
import { InventarioSkeleton } from '@/components/shared/module-skeletons';
import { connection } from 'next/server';

async function InventarioContent() {
  await connection();
  const [lotes, alertas, movimientos] = await Promise.all([
    obtenerLotesInventario(),
    obtenerAlertasFefo(),
    obtenerMovimientosKardex(),
  ]);

  const totalStockValorizado = lotes.reduce(
    (acc, l) => acc + l.cantidad_base * l.costo_promedio,
    0
  );

  const totalUnidadesBase = lotes.reduce((acc, l) => acc + l.cantidad_base, 0);
  const cadenaFrioCount = lotes.filter((l) => l.requiere_cadena_frio).length;
  const criticosCount = alertas.filter((a) => a.nivel === 'urgente').length;

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Valorizado Total</span>
            <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
              {formatMoney(totalStockValorizado)}
            </div>
            <span className="text-[11px] text-muted-foreground">Costo promedio ponderado</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Lotes Activos</span>
            <div className="text-xl font-bold font-mono text-foreground">
              {lotes.length} lotes
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {totalUnidadesBase} unidades base
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Por Vencer (&lt; 90d)</span>
            <div className="text-xl font-bold font-mono text-[#ff9f0a]">
              {alertas.length} lotes
            </div>
            <span className="text-[11px] text-muted-foreground">
              {criticosCount > 0 ? `${criticosCount} en nivel crítico (<30d)` : 'Ninguno en nivel crítico'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#ff9f0a]/10 text-[#ff9f0a] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Cadena de Frío</span>
            <div className="text-xl font-bold font-mono text-foreground">
              {cadenaFrioCount} {cadenaFrioCount === 1 ? 'producto' : 'productos'}
            </div>
            <span className="text-[11px] text-[#0071e3]">Monitoreo 2°C a 8°C</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Snowflake className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Vista Modular Tabs: Lotes, Alertas y Kardex con datos de la BD */}
      <InventarioTabs
        lotes={lotes}
        alertas={alertas}
        movimientos={movimientos}
      />
    </div>
  );
}

export default function InventarioPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Encabezado del Módulo (Instant Shell) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
            Inventario & Control de Lotes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
            Despacho FEFO (First Expired, First Out), trazabilidad por lote y kardex inmutable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-xl gap-2 font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback">
            <Link href="/pos">
              Ir al POS
            </Link>
          </Button>
        </div>
      </div>

      {/* Dynamic Data Streamed with Suspense */}
      <Suspense fallback={<InventarioSkeleton />}>
        <InventarioContent />
      </Suspense>
    </main>
  );
}
