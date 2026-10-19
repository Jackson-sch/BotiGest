import * as React from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductoById, getCatalogoAuxiliares, ProductoFormView } from '@/features/productos';

export const metadata = {
  title: 'Editar Medicamento · Botica',
  description: 'Edición de fármaco y presentaciones en el catálogo maestro',
};

interface EditarProductoContentProps {
  params: Promise<{ id: string }>;
}

async function EditarProductoContent({ params }: EditarProductoContentProps) {
  const { id } = await params;
  const [producto, auxiliares] = await Promise.all([
    getProductoById(id),
    getCatalogoAuxiliares(),
  ]);

  if (!producto) {
    notFound();
  }

  return <ProductoFormView auxiliares={auxiliares} producto={producto} />;
}

export default function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        <EditarProductoContent params={params} />
      </Suspense>
    </main>
  );
}
