import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PosCatalog,
  PosCart,
  PosRecipeModal,
  PosCheckoutModal,
  obtenerProductosPos,
  obtenerTurnoActivo,
} from '@/features/pos';
import { PosSkeleton } from '@/components/shared/module-skeletons';

import { getSessionUser } from '@/lib/auth';
import { AlertTriangle } from 'lucide-react';

async function PosContent() {
  const user = await getSessionUser();
  const [productos, turno] = await Promise.all([
    obtenerProductosPos(),
    obtenerTurnoActivo(user?.id),
  ]);

  const cajeroNombre = user ? `${user.nombres} ${user.apellidos}` : (turno?.cajero_nombre || 'Cajero');
  const turnoEstado = turno ? 'Turno Abierto' : 'Sin Turno Abierto';
  const cajaNombre = turno?.caja_nombre || 'Terminal 01';

  return (
    <>
      {/* Top Bar del POS translúcida estilo Apple (Oculto al imprimir) */}
      <header className="h-14 px-4 sm:px-6 apple-glass-header flex items-center justify-between z-20 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-2 text-xs font-medium apple-press-feedback">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Link>
          </Button>

          <div className="h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-apple-title text-foreground">
              POS · {cajaNombre}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                turno
                  ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20'
                  : 'bg-[#ff9500]/10 text-[#b25e00] dark:text-[#ff9f0a] border-[#ff9500]/20'
              }`}
            >
              {turnoEstado}
            </span>
          </div>
        </div>

        {/* Atajos de Teclado y Datos del Cajero */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-3 text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.1] text-foreground font-sans">F2</kbd>
              Buscar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.1] text-foreground font-sans">F4</kbd>
              Cobrar
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-border text-foreground font-medium">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{cajeroNombre}</span>
          </div>
        </div>
      </header>

      {/* Banner de Advertencia si no hay turno abierto */}
      {!turno && (
        <div className="bg-[#ff9500]/10 border-b border-[#ff9500]/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#b25e00] dark:text-[#ff9f0a] z-10 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Caja Cerrada:</strong> No tienes un turno abierto en este terminal. Debes aperturar turno con tu saldo inicial para emitir comprobantes y cobrar.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-xl bg-background border-[#ff9500]/30 hover:bg-[#ff9500]/10 font-medium">
            <Link href="/caja">
              Abrir Turno en Caja
            </Link>
          </Button>
        </div>
      )}

      {/* Área Principal de Trabajo POS (Oculto al imprimir) */}
      <main className="flex-1 p-4 sm:p-5 flex flex-col lg:flex-row gap-5 overflow-hidden print:hidden">
        {/* Catálogo de Productos alimentado desde la base de datos */}
        <section className="flex-1 flex flex-col min-h-0">
          <PosCatalog initialProducts={productos} />
        </section>

        {/* Carrito de Compra y Cobro */}
        <aside className="w-full lg:w-96 shrink-0 h-full flex flex-col min-h-0">
          <PosCart hasActiveTurn={Boolean(turno)} />
        </aside>
      </main>

      {/* Modales de Receta y Cobro */}
      <PosRecipeModal />
      <PosCheckoutModal />
    </>
  );
}

export default function PosPage() {
  return (
    <div className="h-screen w-full flex flex-col bg-[#f5f5f7] dark:bg-black text-foreground overflow-hidden">
      <Suspense fallback={<PosSkeleton />}>
        <PosContent />
      </Suspense>
    </div>
  );
}
