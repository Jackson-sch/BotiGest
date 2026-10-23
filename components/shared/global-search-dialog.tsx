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
  CornerDownLeft,
} from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { buscarGlobalAction, type GlobalSearchResult } from './global-search-action';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface ActionableItem {
  id: string;
  type: 'medicamento' | 'lote' | 'cliente' | 'modulo';
  action: () => void;
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
  const itemRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [query, setQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
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
    }, 180);

    return () => clearTimeout(timeout);
  }, [query]);

  const qLower = query.toLowerCase().trim();
  const modulosCoincidentes = SYSTEM_MODULES.filter(
    (m) =>
      !qLower ||
      m.name.toLowerCase().includes(qLower) ||
      m.desc.toLowerCase().includes(qLower) ||
      m.path.includes(qLower)
  );

  const handleNavigate = React.useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  const handleVenderEnPos = React.useCallback(
    (med: GlobalSearchResult['medicamentos'][0]) => {
      const searchKey = med.codigo_interno || med.nombre_comercial;
      router.push(`/pos?q=${encodeURIComponent(searchKey)}`);
      onClose();
    },
    [router, onClose]
  );

  // Lista plana de elementos interactivos para navegación con teclado
  const actionableItems = React.useMemo<ActionableItem[]>(() => {
    const items: ActionableItem[] = [];

    // 1. Medicamentos (acción primaria: ir a vender en POS)
    results.medicamentos.forEach((m) => {
      items.push({
        id: `med-${m.id}`,
        type: 'medicamento',
        action: () => handleVenderEnPos(m),
      });
    });

    // 2. Lotes FEFO (acción: ir a inventario)
    results.lotes.forEach((l) => {
      items.push({
        id: `lote-${l.id}`,
        type: 'lote',
        action: () => handleNavigate('/inventario'),
      });
    });

    // 3. Clientes (acción: ir a clientes)
    results.clientes.forEach((c) => {
      items.push({
        id: `cli-${c.id}`,
        type: 'cliente',
        action: () => handleNavigate('/clientes'),
      });
    });

    // 4. Módulos del Sistema
    modulosCoincidentes.forEach((mod) => {
      items.push({
        id: `mod-${mod.path}`,
        type: 'modulo',
        action: () => handleNavigate(mod.path),
      });
    });

    return items;
  }, [results, modulosCoincidentes, handleVenderEnPos, handleNavigate]);

  // Reiniciar índice cuando cambia la lista de resultados
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [actionableItems.length]);

  // Auto-scroll del elemento seleccionado para mantenerlo siempre a la vista
  React.useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Manejador de teclado para ↑, ↓, Enter y Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (actionableItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % actionableItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + actionableItems.length) % actionableItems.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const current = actionableItems[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  if (!isOpen) return null;

  const hasAnyResults =
    results.medicamentos.length > 0 ||
    results.lotes.length > 0 ||
    results.clientes.length > 0 ||
    modulosCoincidentes.length > 0;

  // Contador acumulador de índices globales para vincular cada tarjeta a actionableItems
  let runningIndex = 0;

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
            onKeyDown={handleKeyDown}
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
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;
                  const hasStock = med.stock > 0;

                  return (
                    <div
                      key={med.id}
                      ref={(el) => {
                        itemRefs.current[currentIndex] = el;
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={() => handleVenderEnPos(med)}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 border cursor-pointer select-none group ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30 shadow-xs'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-border/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold transition-colors truncate ${
                              isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                            }`}
                          >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVenderEnPos(med);
                          }}
                          className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'bg-primary/90 hover:bg-primary text-primary-foreground'
                          }`}
                          title="Vender en Punto de Venta [Enter]"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Vender</span>
                          {isSelected && <CornerDownLeft className="h-3 w-3 ml-0.5 opacity-80" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate('/productos');
                          }}
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
                {results.lotes.map((lote) => {
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;

                  return (
                    <div
                      key={lote.id}
                      ref={(el) => {
                        itemRefs.current[currentIndex] = el;
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={() => handleNavigate('/inventario')}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-border/50'
                      }`}
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
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-cyan-400" />}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
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
                {results.clientes.map((c) => {
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;

                  return (
                    <div
                      key={c.id}
                      ref={(el) => {
                        itemRefs.current[currentIndex] = el;
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={() => handleNavigate('/clientes')}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-border/50'
                      }`}
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
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-purple-400" />}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
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
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;
                  const Icon = mod.icon;

                  return (
                    <div
                      key={mod.path}
                      ref={(el) => {
                        itemRefs.current[currentIndex] = el;
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={() => handleNavigate(mod.path)}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30 shadow-xs'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-semibold block truncate ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {mod.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {mod.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {mod.shortcut && (
                          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                            {mod.shortcut}
                          </kbd>
                        )}
                        {isSelected && <CornerDownLeft className="h-3 w-3 text-primary ml-1" />}
                      </div>
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
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">↑</kbd>
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">↓</kbd>
              <span>navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-muted font-mono">↵</kbd>
              <span>seleccionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-muted font-mono">Esc</kbd>
              <span>cerrar</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/80">
            {actionableItems.length > 0 ? `${selectedIndex + 1} de ${actionableItems.length}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
