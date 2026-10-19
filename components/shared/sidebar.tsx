'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  ShoppingCart,
  Boxes,
  ClipboardList,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  X,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  tenantName?: string;
  sucursalActual?: string;
  userRole?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'blue' | 'purple' | 'green' | 'amber';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operaciones',
    items: [
      { href: '/', label: 'Panel de Control', icon: Store },
      { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart, badge: 'F4', badgeVariant: 'blue' },
      { href: '/caja', label: 'Caja & Turnos', icon: ReceiptText },
    ],
  },
  {
    title: 'Almacén & Cadena',
    items: [
      { href: '/inventario', label: 'Inventario & Lotes', icon: Boxes },
      { href: '/compras', label: 'Compras Droguerías', icon: ClipboardList },
    ],
  },
  {
    title: 'Regulatorio & SUNAT',
    items: [
      { href: '/ventas', label: 'Ventas & Facturas', icon: Receipt },
      { href: '/controlados', label: 'Libro Controlados', icon: ShieldCheck, badge: 'DIGEMID', badgeVariant: 'purple' },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  tenantName = 'Botica San Martín',
  sucursalActual = 'Sede Principal · Av. Grau 450',
  userRole = 'Administrador',
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* 1. Header de la Botica & Marca (macOS Squircle & Brand) */}
      <div className="p-3.5 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group overflow-hidden"
          >
            <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0051a8] text-white flex items-center justify-center shadow-sm shadow-[#0071e3]/30 apple-press-feedback">
              <Pill className="h-4 w-4" />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col truncate"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm leading-none tracking-apple-title text-foreground">
                    BotiGest
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0071e3]/10 text-[#2997ff] font-mono font-medium">
                    PRO
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {tenantName}
                </span>
              </motion.div>
            )}
          </Link>

          {/* Toggle buttons */}
          <div className="flex items-center shrink-0">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors apple-press-feedback"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Selector de Sucursal Compacto */}
        {!isCollapsed && (
          <div className="mt-3 px-2.5 py-1.5 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3 w-3 text-[#2997ff] shrink-0" />
              <span className="font-medium text-foreground text-[11px] truncate">{sucursalActual}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
        )}
      </div>

      {/* 2. Navegación Agrupada con Estilo macOS Sequoia */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!isCollapsed && (
              <h4 className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h4>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback',
                      isActive
                        ? 'bg-white/[0.08] dark:bg-white/[0.1] text-foreground font-semibold border border-white/[0.08] shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
                      isCollapsed ? 'justify-center px-0 py-2.5' : ''
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Indicador de barra vertical activa estilo Apple */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-[#0071e3] dark:bg-[#2997ff]" />
                    )}

                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-150',
                        isActive
                          ? 'text-[#0071e3] dark:text-[#2997ff]'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-apple-body">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide shrink-0',
                          item.badgeVariant === 'purple'
                            ? 'bg-[#af52de]/15 text-[#af52de] border border-[#af52de]/20'
                            : 'bg-[#0071e3]/15 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer del Sidebar: Estado & Perfil de Usuario */}
      <div className="p-3 border-t border-border/40 space-y-2">
        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.06]',
            isCollapsed ? 'justify-center p-2' : ''
          )}
        >
          {/* Avatar Squircle */}
          <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-[#0071e3]/20 to-[#af52de]/20 border border-white/10 text-[#2997ff] flex items-center justify-center font-bold text-xs shrink-0">
            CR
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#34c759] border-2 border-background" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate flex-1 text-left">
              <span className="font-semibold text-xs leading-none text-foreground truncate">
                Carlos Ramírez
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {userRole} · En línea
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop con animación fluida de ancho */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-40 apple-glass-sidebar overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Drawer Móvil */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-64 max-w-[80vw] h-full apple-glass-sidebar bg-background/95 shadow-2xl z-10 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
