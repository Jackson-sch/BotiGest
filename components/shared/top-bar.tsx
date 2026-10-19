'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  ShoppingCart,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  onOpenMobile: () => void;
}

const ROUTE_INFO: Record<string, { title: string; category: string }> = {
  '/': { title: 'Panel de Control', category: 'Operaciones' },
  '/pos': { title: 'Punto de Venta', category: 'Ventas' },
  '/caja': { title: 'Caja & Turnos', category: 'Operaciones' },
  '/inventario': { title: 'Inventario & Lotes', category: 'Almacén' },
  '/compras': { title: 'Compras Droguerías', category: 'Almacén' },
  '/ventas': { title: 'Ventas & SUNAT', category: 'Facturación' },
  '/controlados': { title: 'Libro de Controlados', category: 'Regulatorio' },
};

export function TopBar({ onOpenMobile }: TopBarProps) {
  const pathname = usePathname();
  const currentRoute = ROUTE_INFO[pathname] || {
    title: 'BotiGest',
    category: 'Botica',
  };

  return (
    <header className="h-14 w-full apple-glass-header px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-all border-b border-border/40">
      {/* Botón Móvil & Breadcrumb contextual */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors apple-press-feedback"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">
            {currentRoute.category}
          </span>
          <span className="text-muted-foreground/40 font-mono">/</span>
          <span className="font-semibold text-foreground tracking-tight text-sm">
            {currentRoute.title}
          </span>
        </div>
      </div>

      {/* Buscador global con atajo rápido & Acciones */}
      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar medicamento, lote o DNI..."
            className="w-56 lg:w-72 pl-8 pr-10 py-1 rounded-xl border border-border/50 bg-white/[0.03] dark:bg-white/[0.04] text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#2997ff] focus:border-[#2997ff] transition-all"
          />
          <kbd className="absolute right-2 px-1 py-0.2 rounded bg-white/[0.06] text-[10px] font-mono text-muted-foreground pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {pathname !== '/pos' && (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-xl px-3 gap-1.5 font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shadow-[#0071e3]/20 apple-press-feedback text-xs"
          >
            <Link href="/pos">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">POS</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
