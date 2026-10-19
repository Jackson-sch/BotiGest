import { Suspense } from 'react';
import { connection } from 'next/server';
import { getClientes, getMetricasClientes, ClientesClientView } from '@/features/clientes';
import { InventarioSkeleton } from '@/components/shared/module-skeletons';

async function ClientesContent() {
  await connection();
  const [clientes, metricas] = await Promise.all([
    getClientes(),
    getMetricasClientes(),
  ]);

  return (
    <ClientesClientView
      initialClientes={clientes}
      metricas={metricas}
    />
  );
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<InventarioSkeleton />}>
      <ClientesContent />
    </Suspense>
  );
}
