import * as React from 'react';
import { Suspense } from 'react';
import { getCatalogoAuxiliares, ProductoFormView } from '@/features/productos';

export const metadata = {
  title: 'Nuevo Medicamento · Botica',
  description: 'Registro de nuevo producto farmacéutico en el catálogo maestro DIGEMID',
};

async function NuevoProductoContent() {
  const auxiliares = await getCatalogoAuxiliares();
  return <ProductoFormView auxiliares={auxiliares} producto={null} />;
}

export default function NuevoProductoPage() {
  return (
    <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8 space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-16 w-full bg-muted/20 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-96 bg-muted/10 animate-pulse rounded-3xl" />
              <div className="lg:col-span-4 h-96 bg-muted/10 animate-pulse rounded-3xl" />
            </div>
          </div>
        }
      >
        <NuevoProductoContent />
      </Suspense>
    </main>
  );
}
