import * as React from 'react';
import { Suspense } from 'react';
import { obtenerConfiguracionBotica, ConfiguracionForm } from '@/features/configuracion';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

async function ConfiguracionContent() {
  const { configuracion, farmaceuticos } = await obtenerConfiguracionBotica();

  if (!configuracion) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se encontró la configuración del establecimiento.
      </div>
    );
  }

  return (
    <ConfiguracionForm
      initialConfig={configuracion}
      farmaceuticos={farmaceuticos}
    />
  );
}

export default function ConfiguracionPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <Suspense fallback={<ComprasSkeleton />}>
        <ConfiguracionContent />
      </Suspense>
    </main>
  );
}
