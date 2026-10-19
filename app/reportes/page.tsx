import * as React from 'react';
import { Suspense } from 'react';
import { ShieldCheck, Award, Receipt, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  getDatosOppfDigemid,
  getBalanceTrimestralControlados,
  getSireVentas,
  getMetricasGerenciales,
  ReportesTabs,
} from '@/features/reportes';
import { connection } from 'next/server';

async function ReportesContent() {
  await connection();
  const [oppfItems, balanceControlados, sireVentas, metricas] = await Promise.all([
    getDatosOppfDigemid(),
    getBalanceTrimestralControlados(),
    getSireVentas(),
    getMetricasGerenciales(),
  ]);

  return (
    <ReportesTabs
      oppfItems={oppfItems}
      balanceControlados={balanceControlados}
      sireVentas={sireVentas}
      metricas={metricas}
    />
  );
}

export default function ReportesPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <div className="print:hidden">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reportes Regulatorios DIGEMID & SUNAT
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Cumplimiento Legal MINSA
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Exportables oficiales para el Observatorio Peruano de Productos Farmacéuticos (OPPF), Balance Trimestral de Controlados y SIRE SUNAT.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-20 w-full bg-muted/20 animate-pulse rounded-2xl" />
            <div className="h-96 w-full bg-muted/10 animate-pulse rounded-2xl" />
          </div>
        }
      >
        <ReportesContent />
      </Suspense>
    </main>
  );
}
