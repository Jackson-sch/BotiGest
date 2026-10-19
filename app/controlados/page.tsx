import * as React from 'react';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ControladosClientView,
  obtenerBalancesControlados,
  obtenerAsientosLibroControlados,
  obtenerDirectorTecnico,
} from '@/features/controlados';
import { obtenerConfiguracionBotica } from '@/features/configuracion';
import { ControladosSkeleton } from '@/components/shared/module-skeletons';
import { connection } from 'next/server';

async function ControladosContent() {
  await connection();
  const [balances, asientos, directorTecnico, boticaData] = await Promise.all([
    obtenerBalancesControlados(),
    obtenerAsientosLibroControlados(),
    obtenerDirectorTecnico(),
    obtenerConfiguracionBotica(),
  ]);

  const cfg = boticaData?.configuracion;
  const qfNombre = directorTecnico?.nombre_completo || cfg?.director_tecnico_nombre || 'Q.F. Alejandro Morales Reyes';
  const qfCqfp = directorTecnico?.cqfp || cfg?.director_tecnico_cqfp || 'CQFP 18452';
  const establecimientoNombre = cfg?.nombre_comercial || cfg?.razon_social || 'Botica San Martín';
  const ruc = cfg?.ruc || '20601234567';
  const direccion = cfg?.direccion_fiscal || 'Jr. Lima 123, San Martín de Porres, Lima';
  const autorizacionDigemid = cfg?.autorizacion_digemid || 'BOT-2026-00452';

  return (
    <div className="space-y-6">
      {/* Banner de Cumplimiento Sanitario DIGEMID */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl apple-glass border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#af52de] to-[#7928ca] text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-apple-title text-foreground">
                Libro Oficial de Controlados
              </h1>
              <Badge variant="purple" className="text-[10px]">
                Ley N° 29459
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Director Técnico: <strong>{qfNombre}</strong> · Colegio Químico Farmacéutico: <strong>{qfCqfp}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block text-xs">
            <span className="text-muted-foreground">Registro Inmutable:</span>
            <p className="font-semibold text-foreground">Base de Datos PostgreSQL (botica_db)</p>
          </div>
        </div>
      </div>

      {/* Vista Cliente con Datos Reales de PostgreSQL */}
      <ControladosClientView
        initialBalances={balances}
        initialAsientos={asientos}
        directorTecnico={qfNombre}
        cqfp={qfCqfp}
        establecimientoNombre={establecimientoNombre}
        ruc={ruc}
        direccion={direccion}
        autorizacionDigemid={autorizacionDigemid}
      />
    </div>
  );
}

export default function ControladosPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <Suspense fallback={<ControladosSkeleton />}>
        <ControladosContent />
      </Suspense>
    </main>
  );
}
