'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ProductosTable } from './productos-table';
import { ModalImportarProductos } from './modal-importar-productos';
import { BarcodeModal } from './barcode-modal';
import type { ProductoItem, CatalogoAuxiliares } from '../types';

interface ProductosClientViewProps {
  productos: ProductoItem[];
  auxiliares: CatalogoAuxiliares;
}

export function ProductosClientView({ productos }: ProductosClientViewProps) {
  const router = useRouter();
  const [mostrarModalImportar, setMostrarModalImportar] = React.useState(false);
  const [productoParaBarcode, setProductoParaBarcode] = React.useState<ProductoItem | null>(null);

  const handleNuevo = () => {
    router.push('/productos/nuevo');
  };

  const handleEditar = (prod: ProductoItem) => {
    router.push(`/productos/${prod.id}/editar`);
  };

  return (
    <div className="space-y-6 w-full">
      <ProductosTable
        productos={productos}
        onNuevoProducto={handleNuevo}
        onEditarProducto={handleEditar}
        onImportarExcel={() => setMostrarModalImportar(true)}
        onImprimirBarcode={(prod) => setProductoParaBarcode(prod)}
      />

      <ModalImportarProductos
        isOpen={mostrarModalImportar}
        onClose={() => setMostrarModalImportar(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <BarcodeModal
        isOpen={!!productoParaBarcode}
        onClose={() => setProductoParaBarcode(null)}
        producto={productoParaBarcode}
      />
    </div>
  );
}

