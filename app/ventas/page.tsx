import * as React from 'react';
import { Suspense } from 'react';
import { obtenerHistorialVentas } from '@/features/ventas';
import { VentasClientView } from '@/features/ventas/components';
import { VentasSkeleton } from '@/components/shared/module-skeletons';
import { connection } from 'next/server';

async function VentasContent() {
  await connection();
  const ventas = await obtenerHistorialVentas();
  return <VentasClientView initialVentas={ventas} />;
}

export default function VentasPage() {
  return (
    <Suspense fallback={<VentasSkeleton />}>
      <VentasContent />
    </Suspense>
  );
}
