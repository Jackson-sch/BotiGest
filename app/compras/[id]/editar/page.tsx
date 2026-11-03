import * as React from 'react';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { obtenerProveedoresActivos, obtenerCompraPorId } from '@/features/compras';
import { getProductos } from '@/features/productos/queries';
import { NuevaCompraPageView } from '@/features/compras/components';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const compra = await obtenerCompraPorId(id);
  if (!compra) return { title: 'Compra no encontrada · Sistema Botica' };
  return {
    title: `Editar Compra ${compra.serie_numero} · Sistema Botica`,
    description: `Edición de orden de compra en estado borrador ${compra.serie_numero}`,
  };
}

async function EditarCompraContent({ params }: PageProps) {
  const { id } = await params;
  const [compra, proveedores, productos] = await Promise.all([
    obtenerCompraPorId(id),
    obtenerProveedoresActivos(),
    getProductos({ soloActivos: true }),
  ]);

  if (!compra) {
    notFound();
  }

  // Las compras recibidas o anuladas no admiten edición directa para proteger el Kardex
  if (compra.estado !== 'borrador') {
    redirect('/compras');
  }

  return (
    <NuevaCompraPageView
      proveedores={proveedores}
      productos={productos}
      compraInicial={compra}
    />
  );
}

export default function EditarCompraPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ComprasSkeleton />}>
      <EditarCompraContent params={params} />
    </Suspense>
  );
}
