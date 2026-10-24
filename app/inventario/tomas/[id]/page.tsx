import * as React from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { obtenerCabeceraTomaInventario } from '@/features/inventario/queries-toma';
import { obtenerDetalleTomaInventarioConBarras } from '@/features/inventario/queries-conteo-rapido';
import { ConteoAuditoriaPageView } from '@/features/inventario/components/conteo-auditoria-page-view';
import { InventarioSkeleton } from '@/components/shared/module-skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ConteoContent({ id }: { id: string }) {
  await connection();

  const [toma, items] = await Promise.all([
    obtenerCabeceraTomaInventario(id),
    obtenerDetalleTomaInventarioConBarras(id),
  ]);

  if (!toma) {
    notFound();
  }

  return <ConteoAuditoriaPageView toma={toma} itemsIniciales={items} />;
}

export default async function ConteoPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-4 sm:p-6"><InventarioSkeleton /></div>}>
      <ConteoContent id={id} />
    </Suspense>
  );
}
