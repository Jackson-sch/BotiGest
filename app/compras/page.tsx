import * as React from 'react';
import { Suspense } from 'react';
import { obtenerHistorialCompras, obtenerProveedoresActivos } from '@/features/compras';
import { obtenerSugeridoCompras } from '@/features/compras/queries-sugerido';
import { obtenerSucursalActivaId } from '@/lib/sucursales';
import { ComprasClientView } from '@/features/compras/components';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

import { connection } from 'next/server';

async function ComprasContent() {
  await connection();
  const activeSucursalId = await obtenerSucursalActivaId();
  const [compras, proveedores, sugeridos] = await Promise.all([
    obtenerHistorialCompras(),
    obtenerProveedoresActivos(),
    obtenerSugeridoCompras(activeSucursalId),
  ]);

  return <ComprasClientView initialCompras={compras} proveedores={proveedores} sugeridos={sugeridos} />;
}

export default function ComprasPage() {
  return (
    <Suspense fallback={<ComprasSkeleton />}>
      <ComprasContent />
    </Suspense>
  );
}
