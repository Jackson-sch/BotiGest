import * as React from 'react';
import { Suspense } from 'react';
import { obtenerProveedores, ProveedoresClientView } from '@/features/proveedores';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

async function ProveedoresContent() {
  const proveedores = await obtenerProveedores();
  return <ProveedoresClientView initialProveedores={proveedores} />;
}

export default function ProveedoresPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <Suspense fallback={<ComprasSkeleton />}>
        <ProveedoresContent />
      </Suspense>
    </main>
  );
}
