import * as React from 'react';
import { Suspense } from 'react';
import { obtenerProveedoresActivos } from '@/features/compras';
import { getProductos } from '@/features/productos/queries';
import { NuevaCompraPageView } from '@/features/compras/components';
import { ComprasSkeleton } from '@/components/shared/module-skeletons';

export const metadata = {
  title: 'Nueva Compra a Droguería | Sistema Botica',
  description: 'Registro de facturas de proveedores, captura de lotes y control de vencimientos (BPA)',
};

async function NuevaCompraContent() {
  const [proveedores, productos] = await Promise.all([
    obtenerProveedoresActivos(),
    getProductos({ soloActivos: true }),
  ]);

  return (
    <NuevaCompraPageView
      proveedores={proveedores}
      productos={productos}
    />
  );
}

export default function NuevaCompraPage() {
  return (
    <Suspense fallback={<ComprasSkeleton />}>
      <NuevaCompraContent />
    </Suspense>
  );
}
