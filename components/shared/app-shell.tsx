'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Search, ShoppingCart, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from '@/components/providers/auth-provider';
import { ShortcutsModal } from './shortcuts-modal';
import { GlobalSearchDialog } from './global-search-dialog';

interface AppShellProps {
  children: React.ReactNode;
}

const ROUTE_INFO: Record<string, { title: string; category: string }> = {
  '/': { title: 'Panel de Control', category: 'Operaciones' },
  '/pos': { title: 'Punto de Venta POS', category: 'Operaciones' },
  '/caja': { title: 'Caja & Turnos', category: 'Operaciones' },
  '/caja/arqueo': { title: 'Arqueo Ciego & Cierre', category: 'Caja & Turnos' },
  '/clientes': { title: 'Clientes & Cuentas Corrientes', category: 'Operaciones' },
  '/inventario': { title: 'Inventario & Lotes FEFO', category: 'Almacén & Cadena' },
  '/productos': { title: 'Catálogo Maestro de Fármacos', category: 'Almacén & Cadena' },
  '/productos/nuevo': { title: 'Nuevo Medicamento', category: 'Catálogo Maestro' },
  '/compras': { title: 'Compras Droguerías', category: 'Almacén & Cadena' },
  '/compras/nueva': { title: 'Nueva Compra', category: 'Almacén & Cadena' },
  '/proveedores': { title: 'Proveedores & Droguerías', category: 'Almacén & Cadena' },
  '/ventas': { title: 'Ventas & Facturación SUNAT', category: 'Regulatorio & SUNAT' },
  '/controlados': { title: 'Libro de Controlados DIGEMID', category: 'Regulatorio & SUNAT' },
  '/reportes': { title: 'Reportes DIGEMID & SUNAT', category: 'Regulatorio & SUNAT' },
  '/usuarios': { title: 'Personal, Sedes & Cajas', category: 'Administración' },
  '/configuracion': { title: 'Configuración Botica', category: 'Administración' },
  '/sin-acceso': { title: 'Módulo Restringido', category: 'Seguridad' },
};

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  const [headerQuery, setHeaderQuery] = React.useState('');

  // En la pantalla de login, no mostrar la barra lateral ni la cabecera
  if (pathname === '/login') {
    return <main className="min-h-screen bg-sidebar flex flex-col justify-center">{children}</main>;
  }

  const currentRoute =
    ROUTE_INFO[pathname] ||
    (pathname.startsWith('/productos/')
      ? { title: 'Ficha de Medicamento', category: 'Catálogo Maestro' }
      : { title: 'BotiGest', category: 'Farmacia' });

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Listener Global de Atajos de Teclado (F4, F8, F9, F7, F1, Ctrl+K)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F4: Acceso directo al Punto de Venta desde cualquier módulo
      if (e.key === 'F4') {
        if (pathname !== '/pos' && canAccess('/pos')) {
          e.preventDefault();
          router.push('/pos');
        }
        return;
      }

      // F1: Abrir / Cerrar panel de Atajos de Teclado
      if (e.key === 'F1') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // F8: Acceso a Caja & Turnos
      if (e.key === 'F8') {
        if (pathname !== '/caja' && canAccess('/caja')) {
          e.preventDefault();
          router.push('/caja');
        }
        return;
      }

      // F9: Acceso al Catálogo de Productos
      if (e.key === 'F9') {
        if (pathname !== '/productos' && canAccess('/productos')) {
          e.preventDefault();
          router.push('/productos');
        }
        return;
      }

      // F7: Acceso a Inventario & Lotes FEFO
      if (e.key === 'F7') {
        if (pathname !== '/inventario' && canAccess('/inventario')) {
          e.preventDefault();
          router.push('/inventario');
        }
        return;
      }

      // Ctrl + K o Cmd + K: Búsqueda Global
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchDialogOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pathname, router, canAccess]);

  const showPosButton = mounted && pathname !== '/pos' && canAccess('/pos');

  return (
    <SidebarProvider defaultOpen={pathname !== '/pos'}>
      <AppSidebar />
      <SidebarInset className="border border-sidebar-border/70 shadow-sm overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Top Header inside the Inset canvas (Oculto al imprimir) */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/60 px-4 transition-[width,height] ease-linear print:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-sidebar-border" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink
                    href="/"
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    {currentRoute.category}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block text-muted-foreground/40" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-foreground tracking-tight">
                    {currentRoute.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => setSearchDialogOpen(true)}
              className="relative hidden md:flex items-center cursor-pointer group"
            >
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none" />
              <input
                id="global-search"
                name="global-search"
                type="text"
                value={headerQuery}
                onChange={(e) => {
                  setHeaderQuery(e.target.value);
                  setSearchDialogOpen(true);
                }}
                onFocus={() => setSearchDialogOpen(true)}
                placeholder="Buscar medicamento, lote o DNI..."
                className="w-52 lg:w-64 pl-8 pr-10 py-1 rounded-lg border border-sidebar-border/60 bg-sidebar/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer select-none"
              />
              <kbd className="absolute right-2 px-1 py-0.2 rounded bg-white/[0.06] text-[10px] font-mono text-muted-foreground pointer-events-none">
                ⌘K
              </kbd>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShortcutsOpen(true)}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hidden sm:flex items-center justify-center transition-colors"
              title="Mapa de Atajos de Teclado [F1]"
            >
              <Keyboard className="h-4 w-4" />
            </Button>

            {showPosButton && (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg px-3 gap-1.5 font-medium bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm text-xs apple-press-feedback"
              >
                <Link href="/pos">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Punto de Venta</span>
                  <span className="text-[10px] opacity-80 font-mono">(F4)</span>
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Contenido de la Página dentro del marco Inset */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
          {children}
        </div>

        {/* Modal de Atajos de Teclado F1 */}
        <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        {/* Modal de Búsqueda Global Universal */}
        <GlobalSearchDialog
          isOpen={searchDialogOpen}
          onClose={() => {
            setSearchDialogOpen(false);
            setHeaderQuery('');
          }}
          initialQuery={headerQuery}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AuthProvider>
      <React.Suspense fallback={<div className="min-h-screen bg-sidebar flex items-center justify-center" />}>
        <AppShellContent>{children}</AppShellContent>
      </React.Suspense>
    </AuthProvider>
  );
}

