'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import { ProveedoresTable } from './proveedores-table';
import { ProveedorModal } from './proveedor-modal';
import type { ProveedorItem } from '../types';

interface ProveedoresClientViewProps {
  initialProveedores: ProveedorItem[];
}

export function ProveedoresClientView({
  initialProveedores,
}: ProveedoresClientViewProps) {
  const [proveedores, setProveedores] = React.useState<ProveedorItem[]>(initialProveedores);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProveedor, setEditingProveedor] = React.useState<ProveedorItem | null>(null);

  // Sincronizar estado cuando se actualiza desde el servidor
  React.useEffect(() => {
    setProveedores(initialProveedores);
  }, [initialProveedores]);

  const handleNuevo = () => {
    setEditingProveedor(null);
    setModalOpen(true);
  };

  const handleEditar = (prov: ProveedorItem) => {
    setEditingProveedor(prov);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    // La mutación ya realiza revalidatePath en el servidor
  };

  const totalProveedores = proveedores.length;
  const activosCount = proveedores.filter((p) => p.activo).length;
  const conComprasCount = proveedores.filter((p) => p.total_compras > 0).length;
  const totalMontoInvertido = proveedores.reduce(
    (acc, p) => acc + p.total_monto_compras,
    0
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
            Proveedores & Droguerías
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
            Mantenimiento y directorio de laboratorios y distribuidores farmacéuticos autorizados por DIGEMID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-9 px-3 text-xs rounded-xl border-border/60 hover:bg-muted gap-1.5"
          >
            <Link href="/compras/nueva">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span>Nueva Compra</span>
            </Link>
          </Button>

          <Button
            onClick={handleNuevo}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Proveedor</span>
          </Button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Directorio Droguerías</span>
            <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
              {totalProveedores}
            </div>
            <span className="text-[11px] text-muted-foreground">Empresas registradas</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Proveedores Activos</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {activosCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Habilitados para compras</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Con Compras Registradas</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {conComprasCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Con historial de facturas</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Total Comprado (Histórico)</span>
            <div className="text-xl font-bold font-mono text-foreground">
              {formatMoney(totalMontoInvertido)}
            </div>
            <span className="text-[11px] text-muted-foreground">En mercadería recepcionada</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Tabla Principal */}
      <ProveedoresTable
        proveedores={proveedores}
        onEditar={handleEditar}
        onNuevo={handleNuevo}
      />

      {/* Modal Alta / Edición */}
      <ProveedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        proveedor={editingProveedor}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
