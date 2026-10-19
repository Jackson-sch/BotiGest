'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Pill,
  ShoppingCart,
  Boxes,
  User,
  ArrowRight,
  Loader2,
  Calendar,
  ReceiptText,
  Truck,
  Settings,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { buscarGlobalAction, type GlobalSearchResult } from './global-search-action';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SYSTEM_MODULES = [
  { name: 'Punto de Venta POS', path: '/pos', icon: ShoppingCart, shortcut: 'F4', desc: 'Ventas, boletas, facturas y caja rápida' },
  { name: 'Caja & Turnos', path: '/caja', icon: ReceiptText, shortcut: 'F8', desc: 'Apertura de turno, movimientos y arqueo ciego' },
  { name: 'Catálogo de Fármacos', path: '/productos', icon: Pill, shortcut: 'F9', desc: 'Precios, principios activos DCI y presentaciones' },
  { name: 'Inventario & Lotes FEFO', path: '/inventario', icon: Boxes, shortcut: 'F7', desc: 'Control de lotes, semáforo de vencimientos y stock' },
  { name: 'Clientes & Créditos', path: '/clientes', icon: User, shortcut: '', desc: 'Registro de clientes, cuentas corrientes y puntos' },
  { name: 'Compras Droguerías', path: '/compras', icon: Truck, shortcut: '', desc: 'Órdenes de compra y recepción de mercadería' },
  { name: 'Ventas & Facturación SUNAT', path: '/ventas', icon: FileText, shortcut: '', desc: 'Historial de comprobantes y estado OSE' },
  { name: 'Libro de Controlados', path: '/controlados', icon: ShieldCheck, shortcut: '', desc: 'Balance oficial DIGEMID (Psicotrópicos y Estupefacientes)' },
  { name: 'Configuración Botica', path: '/configuracion', icon: Settings, shortcut: '', desc: 'Parámetros del sistema, sedes y series SUNAT' },
];

export function GlobalSearchDialog({ isOpen, onClose, initialQuery = '' }: GlobalSearchDialogProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<GlobalSearchResult>({
    medicamentos: [],
    lotes: [],
    clientes: [],
  });

  // Sincronizar consulta inicial al abrir
  React.useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Manejador de tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda en servidor con debounce
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ medicamentos: [], lotes: [], clientes: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await buscarGlobalAction(q);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  const qLower = query.toLowerCase().trim();
  const modulosCoincidentes = SYSTEM_MODULES.filter(
    (m) =>
      !qLower ||
      m.name.toLowerCase().includes(qLower) ||
      m.desc.toLowerCase().includes(qLower) ||
      m.path.includes(qLower)
  );

  const hasAnyResults =
    results.medicamentos.length > 0 ||
    results.lotes.length > 0 ||
    results.clientes.length > 0 ||
    modulosCoincidentes.length > 0;

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleVenderEnPos = (nombre: string) => {
    router.push(`/pos?q=${encodeURIComponent(nombre)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 sm:pt-20 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Barra de Búsqueda Principal */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border/60 bg-slate-50 dark:bg-[#1a1a1d]">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe un medicamento (Panadol, Paracetamol...), lote o DNI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 ml-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground text-xs mr-2 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/70 text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Contenedor de Resultados con Scroll */}
        <div className="p-3 overflow-y-auto max-h-[65vh] space-y-4">
          {/* Medicamentos Encontrados */}
          {results.medicamentos.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-primary" />
                <span>Medicamentos en Catálogo ({results.medicamentos.length})</span>
              </div>

              <div className="space-y-1">
                {results.medicamentos.map((med) => {
                  const hasStock = med.stock > 0;
                  return (
                    <div
                      key={med.id}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-border/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {med.nombre_comercial}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                              hasStock
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {hasStock ? `Stock: ${med.stock}` : 'Sin Stock'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {med.nombre_generico ? `DCI: ${med.nombre_generico}` : ''}
                          {med.concentracion ? ` · ${med.concentracion}` : ''}
                          {` · ${med.laboratorio}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {med.precio > 0 && (
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatMoney(med.precio)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleVenderEnPos(med.nombre_comercial)}
                          className="h-7 px-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Vender en Punto de Venta"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Vender</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavigate('/productos')}
                          className="h-7 px-2 rounded-lg bg-muted hover:bg-slate-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
                          title="Ver en catálogo de productos"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lotes FEFO Encontrados */}
          {results.lotes.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-cyan-400" />
                <span>Lotes & Vencimientos FEFO ({results.lotes.length})</span>
              </div>

              <div className="space-y-1">
                {results.lotes.map((lote) => (
                  <div
                    key={lote.id}
                    onClick={() => handleNavigate('/inventario')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-border/50 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-foreground">
                          Lote: {lote.numero_lote}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {lote.nombre_comercial}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-cyan-400" />
                          Vence: {lote.fecha_vencimiento}
                        </span>
                        <span>Stock: {lote.cantidad} un.</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clientes Encontrados */}
          {results.clientes.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-400" />
                <span>Clientes ({results.clientes.length})</span>
              </div>

              <div className="space-y-1">
                {results.clientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleNavigate('/clientes')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-border/50 cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        {c.nombres}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {c.tipo_documento.toUpperCase()}: {c.numero_documento}
                        {c.telefono ? ` · Tel: ${c.telefono}` : ''}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Módulos del Sistema */}
          {modulosCoincidentes.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Módulos del Sistema
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {modulosCoincidentes.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.path}
                      onClick={() => handleNavigate(mod.path)}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-2.5 border border-transparent hover:border-border/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block truncate">
                            {mod.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {mod.desc}
                          </span>
                        </div>
                      </div>
                      {mod.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground shrink-0">
                          {mod.shortcut}
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sin Resultados */}
          {!hasAnyResults && query.length >= 2 && !isLoading && (
            <div className="py-10 text-center space-y-2">
              <Pill className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground">
                No se encontraron medicamentos, lotes ni clientes para &quot;{query}&quot;
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Verifica la ortografía o intenta buscar por principio activo genérico (DCI).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/60 bg-slate-50 dark:bg-[#1a1a1d] flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">↑↓</kbd> navegar
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">↵</kbd> seleccionar
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">Esc</kbd> cerrar
            </span>
          </div>
          <span>Búsqueda Rápida Universal</span>
        </div>
      </div>
    </div>
  );
}
