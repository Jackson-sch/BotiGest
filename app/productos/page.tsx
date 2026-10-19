import * as React from 'react';
import { Suspense } from 'react';
import { Pill, ShieldCheck, ThermometerSnowflake, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getProductos, getCatalogoAuxiliares, ProductosClientView } from '@/features/productos';

import { connection } from 'next/server';

async function ProductosContent() {
  await connection();
  const [productos, auxiliares] = await Promise.all([
    getProductos(),
    getCatalogoAuxiliares(),
  ]);

  const totalProductos = productos.length;
  const genericosCount = productos.filter((p) => p.es_generico).length;
  const frioCount = productos.filter((p) => p.requiere_cadena_frio).length;
  const controladosCount = productos.filter((p) => p.es_controlado).length;

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas del Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Fármacos Registrados</span>
            <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
              {totalProductos}
            </div>
            <span className="text-[11px] text-muted-foreground">Catálogo maestro activo</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Pill className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Genéricos Esenciales</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {genericosCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Con denominación DCI</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Cadena de Frío (2°-8°C)</span>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {frioCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Refrigeración obligatoria</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ThermometerSnowflake className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Sustancias Controladas</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {controladosCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Psicotrópicos y Estupefacientes</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Vista de Catálogo */}
      <ProductosClientView productos={productos} auxiliares={auxiliares} />
    </div>
  );
}

export default function ProductosPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Catálogo Maestro de Fármacos
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#0071e3]/10 text-[#2997ff] border border-[#0071e3]/20">
            DIGEMID · D.S. 014-2011-SA
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Administración de medicamentos, principios activos DCI, registros sanitarios, presentaciones y precios al público.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-24 w-full bg-muted/20 animate-pulse rounded-2xl" />
            <div className="h-96 w-full bg-muted/10 animate-pulse rounded-2xl" />
          </div>
        }
      >
        <ProductosContent />
      </Suspense>
    </main>
  );
}
