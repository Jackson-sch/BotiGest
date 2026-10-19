'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  ShoppingCart,
  Boxes,
  ClipboardList,
  ReceiptText,
  Receipt,
  ShieldCheck,
  Building2,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  tenantName?: string;
  sucursalActual?: string;
  userRole?: string;
}

export function Header({
  tenantName = 'Botica San Martín',
  sucursalActual = 'Sede Principal - Av. Grau 450',
  userRole = 'Administrador',
}: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Store },
    { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart, highlight: true },
    { href: '/caja', label: 'Caja & Turnos', icon: ReceiptText },
    { href: '/inventario', label: 'Inventario & Lotes', icon: Boxes },
    { href: '/compras', label: 'Compras', icon: ClipboardList },
    { href: '/ventas', label: 'Ventas & SUNAT', icon: Receipt },
    { href: '/controlados', label: 'Libro Controlados', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full apple-glass-header transition-all duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Marca & Selector de Sucursal */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0051a8] text-white shadow-sm apple-press-feedback">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight tracking-apple-title text-foreground">
                BotiGest
              </span>
              <span className="text-[11px] text-muted-foreground tracking-apple-body">
                {tenantName}
              </span>
            </div>
          </Link>

          {/* Selector de Sucursal translúcido */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{sucursalActual}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Navegación central con material fluido */}
        <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback',
                  isActive
                    ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-[#0071e3] dark:text-[#2997ff]' : '')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Estado Operativo & Perfil */}
        <div className="flex items-center gap-3">
          {/* Indicador Online/Offline (PWA) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] text-[11px] font-medium border border-[#34c759]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34c759] animate-pulse" />
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">En línea</span>
          </div>

          <Button size="sm" variant="glass" className="rounded-xl gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
            <span className="text-xs">{userRole}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
