'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Boxes,
  Clock,
  Building2,
  CheckCircle2,
  Plus,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import {
  ComprasTable,
  NuevaCompraModal,
  CompraDetalleModal,
  ModalAnularCompra,
} from './index';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { SugeridoComprasView } from './sugerido-compras-view';
import type { CompraCompleta, CompraResumen, Proveedor } from '../types';
import type { SugeridoCompraItem } from '../queries-sugerido';
import { recibirCompraAction } from '../actions';
import { toast } from 'sonner';

const COMPRAS_TABS = ['historial', 'sugerido'] as const;
type ComprasTabType = (typeof COMPRAS_TABS)[number];

interface ComprasClientViewProps {
  initialCompras: CompraCompleta[];
  proveedores: Proveedor[];
  sugeridos?: SugeridoCompraItem[];
}

export function ComprasClientView({ 
  initialCompras, 
  proveedores,
  sugeridos = [] 
}: ComprasClientViewProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useQueryState(
    'tab',
    parseAsStringLiteral(COMPRAS_TABS).withDefault('historial')
  );
  const [compras, setCompras] = React.useState<CompraCompleta[]>(initialCompras);
  const [isNuevaCompraOpen, setIsNuevaCompraOpen] = React.useState(false);
  const [selectedCompra, setSelectedCompra] = React.useState<CompraCompleta | null>(null);
  const [compraParaAnular, setCompraParaAnular] = React.useState<CompraResumen | null>(null);

  // Sincronizar estado local cuando initialCompras cambie por revalidación del servidor
  React.useEffect(() => {
    setCompras(initialCompras);
  }, [initialCompras]);

  // Al montar la vista, solicitar actualización fresca del servidor
  React.useEffect(() => {
    router.refresh();
  }, [router]);

  const ejecutarRecepcion = async (compraId: string) => {
    try {
      const res = await recibirCompraAction({ compra_id: compraId });
      if (res.success) {
        const hoy = new Date().toLocaleDateString('es-PE');
        setCompras((prev) =>
          prev.map((c) =>
            c.id === compraId
              ? {
                  ...c,
                  estado: 'recibida',
                  fecha_recepcion: hoy,
                }
              : c
          )
        );
        if (selectedCompra?.id === compraId) {
          setSelectedCompra((prev) =>
            prev ? { ...prev, estado: 'recibida', fecha_recepcion: hoy } : null
          );
        }
        toast.success('Mercadería recibida exitosamente en almacén');
      } else {
        toast.error(res.error || 'Error al procesar la recepción');
      }
    } catch {
      toast.error('Ocurrió un error inesperado al recibir la compra');
    }
  };

  const handleRecibir = (compraId: string) => {
    toast('¿Confirmar recepción de mercadería?', {
      description: 'Se ingresarán los lotes a almacén y se actualizará el stock disponible.',
      action: {
        label: 'Confirmar',
        onClick: () => ejecutarRecepcion(compraId),
      },
      duration: 8000,
    });
  };

  const totalRecibido = compras
    .filter((c) => c.estado === 'recibida')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendientesRecepcion = compras.filter((c) => c.estado === 'borrador').length;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
              Compras & Recepción a Droguerías
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
              Registro de facturas de proveedores, captura de lotes, vencimiento y recálculo de costo promedio.
            </p>
          </div>

          <Button
            asChild
            className="rounded-xl gap-2 font-medium bg-[#34c759] hover:bg-[#28a745] text-white apple-press-feedback"
          >
            <Link href="/compras/nueva">
              <Plus className="h-4 w-4" />
              <span>Registrar Factura Proveedor</span>
            </Link>
          </Button>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Recibido en Almacén</span>
              <div className="text-xl font-bold font-mono text-[#34c759] dark:text-[#30d158]">
                {formatMoney(totalRecibido)}
              </div>
              <span className="text-[11px] text-muted-foreground">Kardex actualizado</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Por Recibir (Borrador)</span>
              <div className="text-xl font-bold font-mono text-[#ff9f0a]">
                {pendientesRecepcion} órdenes
              </div>
              <span className="text-[11px] text-muted-foreground">Verificación física pendiente</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#ff9f0a]/10 text-[#ff9f0a] flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Proveedores Registrados</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {proveedores.length} droguerías
              </div>
              <span className="text-[11px] text-muted-foreground">Droguería Suiza, Medifarma...</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Control de Lotes</span>
              <div className="text-xl font-bold font-mono text-foreground">
                100% FEFO
              </div>
              <span className="text-[11px] text-[#248a3d] dark:text-[#30d158]">Trazabilidad DIGEMID</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#248a3d]/10 text-[#248a3d] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Sub-Tabs de Navegación Compras */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setSubTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              subTab === 'historial'
                ? 'bg-white dark:bg-white/10 text-[#34c759] dark:text-[#30d158] font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Facturas & Órdenes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
              {compras.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('sugerido')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              subTab === 'sugerido'
                ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Sugerido de Compra (ROP)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff]">
              {sugeridos.length}
            </span>
          </button>
        </div>

        {subTab === 'historial' ? (
          <>
            {/* Tabla de Compras */}
            <ComprasTable
              compras={compras}
              onVerDetalle={(c) => {
                const completa = compras.find((x) => x.id === c.id);
                setSelectedCompra(completa || null);
              }}
              onRecibir={(c) => handleRecibir(c.id)}
              onAnular={(c) => setCompraParaAnular(c)}
            />
          </>
        ) : (
          <SugeridoComprasView sugeridos={sugeridos} />
        )}

        {/* Modal de Nueva Compra */}
        <NuevaCompraModal
          isOpen={isNuevaCompraOpen}
          onClose={() => setIsNuevaCompraOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        {/* Modal de Detalle */}
        <CompraDetalleModal
          compra={selectedCompra}
          isOpen={!!selectedCompra}
          onClose={() => setSelectedCompra(null)}
          onRecibir={(id) => handleRecibir(id)}
          onAnular={(c) => setCompraParaAnular(c)}
        />

        {/* Modal de Anulación de Compra */}
        <ModalAnularCompra
          compra={compraParaAnular}
          isOpen={!!compraParaAnular}
          onClose={() => setCompraParaAnular(null)}
          onSuccess={() => {
            if (compraParaAnular) {
              setCompras((prev) =>
                prev.map((c) =>
                  c.id === compraParaAnular.id
                    ? { ...c, estado: 'anulada' }
                    : c
                )
              );
            }
            router.refresh();
          }}
        />
      </main>
  );
}
