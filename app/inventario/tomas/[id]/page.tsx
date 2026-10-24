import * as React from 'react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { obtenerCabeceraTomaInventario } from '@/features/inventario/queries-toma';
import { obtenerDetalleTomaInventarioConBarras } from '@/features/inventario/queries-conteo-rapido';
import { ConteoAuditoriaPageView } from '@/features/inventario/components/conteo-auditoria-page-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConteoPage({ params }: PageProps) {
  await connection();
  const { id } = await params;

  const [toma, items] = await Promise.all([
    obtenerCabeceraTomaInventario(id),
    obtenerDetalleTomaInventarioConBarras(id),
  ]);

  if (!toma) {
    notFound();
  }

  return <ConteoAuditoriaPageView toma={toma} itemsIniciales={items} />;
}
