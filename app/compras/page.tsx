import * as React from 'react';
import { Suspense } from 'react';
import { obtenerHistorialCompras, obtenerProveedoresActivos } from '@/features/compras';
import { ComprasClientView } from '@/features/compras/components';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

import { connection } from 'next/server';

async function ComprasContent() {
  await connection();
  const [compras, proveedores] = await Promise.all([
    obtenerHistorialCompras(),
    obtenerProveedoresActivos(),
  ]);

  return <ComprasClientView initialCompras={compras} proveedores={proveedores} />;
}

export default function ComprasPage() {
  return (
    <Suspense fallback={<ComprasSkeleton />}>
      <ComprasContent />
    </Suspense>
  );
}
