'use client';

import * as React from 'react';
import {
  Search,
  ScanLine,
  Pill,
  Sparkles,
  Plus,
  TrendingUp,
  PackageCheck,
  Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CondicionVentaBadge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { usePosStore } from '../store';
import type { PosProductItem } from '../types';
import { useQueryState, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import { useBarcodeScanner, playScannerBeep } from '../hooks/use-barcode-scanner';

interface PosCatalogProps {
  initialProducts?: PosProductItem[];
}

export function PosCatalog({ initialProducts = [] }: PosCatalogProps) {
  const {
    searchQuery,
    setSearchQuery,
    addItem,
    isCheckoutModalOpen,
    isRecetaModalOpen,
    isHeldCartsModalOpen,
  } = usePosStore();
  const [urlQuery, setUrlQuery] = useQueryState('q', parseAsString.withDefault(''));
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [selectedPresentations, setSelectedPresentations] = React.useState<Record<string, string>>({});
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);

  type CatalogTab = 'rotacion' | 'stock' | 'todos';
  const [catalogTab, setCatalogTab] = React.useState<CatalogTab>('rotacion');
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = React.useState<number>(PAGE_SIZE);

  // Sincronizar parámetro de búsqueda de URL con store
  React.useEffect(() => {
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);

      // Si el producto buscado no tiene stock disponible, cambiar a 'todos' para mostrarlo
      const qNorm = urlQuery.toLowerCase().trim();
      const matchInAll = initialProducts.filter((p) => {
        return (
          p.codigo_interno.toLowerCase() === qNorm ||
          p.nombre_comercial.toLowerCase().includes(qNorm) ||
          p.presentaciones.some((pr) => pr.codigo_barras === qNorm)
        );
      });

      if (matchInAll.length > 0) {
        const hasStock = matchInAll.some((p) => p.stock_disponible_base > 0);
        if (!hasStock) {
          setCatalogTab('todos');
        }
      }
    }
  }, [urlQuery, searchQuery, setSearchQuery, initialProducts]);

  // Contadores dinámicos
  const conStockCount = React.useMemo(
    () => initialProducts.filter((p) => p.stock_disponible_base > 0).length,
    [initialProducts]
  );

  const rotacionCount = React.useMemo(() => {
    const withSales = initialProducts.filter((p) => p.stock_disponible_base > 0 && (p.total_vendidos ?? 0) > 0).length;
    // Si aún no hay ventas históricas en el sistema, mostrar el total con stock disponible
    return withSales > 0 ? withSales : conStockCount;
  }, [initialProducts, conStockCount]);

  // Filtrado reactivo e instantáneo sobre los productos traídos de la base de datos
  const activeQuery = searchQuery || urlQuery;
  const filteredProducts = React.useMemo(() => {
    const q = activeQuery.toLowerCase().trim();

    // 1. Con búsqueda activa (texto o código de barras)
    if (q) {
      const matches = initialProducts.filter((p) => {
        const matchName = p.nombre_comercial.toLowerCase().includes(q);
        const matchGen = p.nombre_generico?.toLowerCase().includes(q) ?? false;
        const matchCod = p.codigo_interno.toLowerCase().includes(q);
        const matchBarcode = p.presentaciones.some((pr) => pr.codigo_barras?.includes(q));
        return matchName || matchGen || matchCod || matchBarcode;
      });

      // Ordenar: primero los con stock disponible, luego mayor rotación, luego alfabético
      return matches.sort((a, b) => {
        const stockA = a.stock_disponible_base > 0 ? 1 : 0;
        const stockB = b.stock_disponible_base > 0 ? 1 : 0;
        if (stockB !== stockA) return stockB - stockA;
        const salesDiff = (b.total_vendidos || 0) - (a.total_vendidos || 0);
        if (salesDiff !== 0) return salesDiff;
        return a.nombre_comercial.localeCompare(b.nombre_comercial);
      });
    }

    // 2. Sin búsqueda activa: filtrar según pestaña seleccionada
    if (catalogTab === 'rotacion') {
      const withStock = initialProducts.filter((p) => p.stock_disponible_base > 0);
      return withStock.sort((a, b) => {
        const salesDiff = (b.total_vendidos || 0) - (a.total_vendidos || 0);
        if (salesDiff !== 0) return salesDiff;
        return a.nombre_comercial.localeCompare(b.nombre_comercial);
      });
    }

    if (catalogTab === 'stock') {
      return initialProducts
        .filter((p) => p.stock_disponible_base > 0)
        .sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial));
    }

    // 'todos': Todo el catálogo, con stock disponible primero y luego agotados
    return [...initialProducts].sort((a, b) => {
      const stockA = a.stock_disponible_base > 0 ? 1 : 0;
      const stockB = b.stock_disponible_base > 0 ? 1 : 0;
      if (stockB !== stockA) return stockB - stockA;
      return a.nombre_comercial.localeCompare(b.nombre_comercial);
    });
  }, [activeQuery, initialProducts, catalogTab]);

  // Principios Activos (DCI) populares o sugeridos disponibles en stock
  const dciSugerencias = React.useMemo(() => {
    const q = activeQuery.toLowerCase().trim();
    const dcisConStock = new Map<string, number>();

    for (const p of initialProducts) {
      if (p.stock_disponible_base > 0 && p.nombre_generico && p.nombre_generico.trim() !== '') {
        const dci = p.nombre_generico.trim();
        dcisConStock.set(dci, (dcisConStock.get(dci) || 0) + 1);
      }
    }

    if (!q) {
      return Array.from(dcisConStock.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([dci]) => dci);
    }

    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    const matches: string[] = [];

    for (const [dci] of dcisConStock.entries()) {
      const dciLower = dci.toLowerCase();
      if (tokens.some((token) => dciLower.includes(token))) {
        matches.push(dci);
      }
    }

    if (matches.length > 0) {
      return matches.slice(0, 6);
    }

    return Array.from(dcisConStock.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([dci]) => dci);
  }, [initialProducts, activeQuery]);

  // Si hay coincidencias en todo el catálogo (incluyendo agotados)
  const coincidenciasEnAgotados = React.useMemo(() => {
    if (!activeQuery) return 0;
    const q = activeQuery.toLowerCase().trim();
    return initialProducts.filter((p) => {
      const matchName = p.nombre_comercial.toLowerCase().includes(q);
      const matchGen = p.nombre_generico?.toLowerCase().includes(q) ?? false;
      const matchCod = p.codigo_interno.toLowerCase().includes(q);
      return (matchName || matchGen || matchCod) && p.stock_disponible_base <= 0;
    }).length;
  }, [initialProducts, activeQuery]);

  // Renderizado progresivo (chunks de 24) para mantener la UI ágil incluso con cientos o miles de productos
  const displayedProducts = React.useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );
  const hasMore = visibleCount < filteredProducts.length;

  // Cálculo dinámico de columnas de la grilla (1 o 2 columnas según pantalla/responsividad)
  const getGridColumns = React.useCallback(() => {
    if (!gridRef.current) {
      if (typeof window !== 'undefined' && window.innerWidth < 1280) return 1;
      return 2;
    }
    const gridComputed = window.getComputedStyle(gridRef.current);
    const gridTemplateColumns = gridComputed.getPropertyValue('grid-template-columns');
    const cols = gridTemplateColumns.split(' ').filter(Boolean).length;
    return cols > 0 ? cols : 1;
  }, []);

  // Navegación bidimensional suave con teclas direccionales (↑ ↓ ← →)
  const navigateGrid = React.useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (displayedProducts.length === 0) return;

      const cols = getGridColumns();
      const total = displayedProducts.length;

      if (selectedIndex === -1) {
        if (direction === 'down' || direction === 'right') {
          setSelectedIndex(0);
        }
        return;
      }

      let nextIndex = selectedIndex;

      if (direction === 'right') {
        if (selectedIndex + 1 < total) {
          nextIndex = selectedIndex + 1;
        }
      } else if (direction === 'left') {
        if (selectedIndex - 1 >= 0) {
          nextIndex = selectedIndex - 1;
        } else {
          // Salir y devolver foco al buscador
          setSelectedIndex(-1);
          searchInputRef.current?.focus();
          return;
        }
      } else if (direction === 'down') {
        if (cols === 1) {
          if (selectedIndex + 1 < total) {
            nextIndex = selectedIndex + 1;
          }
        } else {
          // Grilla de 2 columnas
          if (selectedIndex + cols < total) {
            nextIndex = selectedIndex + cols;
          } else if (selectedIndex + 1 < total) {
            // Caso donde la última fila tiene número impar de productos
            nextIndex = selectedIndex + 1;
          }
        }
      } else if (direction === 'up') {
        if (cols === 1) {
          if (selectedIndex - 1 >= 0) {
            nextIndex = selectedIndex - 1;
          } else {
            // Salir al buscador
            setSelectedIndex(-1);
            searchInputRef.current?.focus();
            return;
          }
        } else {
          // Grilla de 2 columnas
          if (selectedIndex - cols >= 0) {
            nextIndex = selectedIndex - cols;
          } else {
            // Fila superior (índice 0 o 1): Salir hacia el buscador
            setSelectedIndex(-1);
            searchInputRef.current?.focus();
            return;
          }
        }
      }

      if (nextIndex !== selectedIndex) {
        setSelectedIndex(nextIndex);
        if (nextIndex >= visibleCount - 2 && hasMore) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      }
    },
    [displayedProducts.length, selectedIndex, getGridColumns, visibleCount, hasMore]
  );

  // Auto-scroll del producto seleccionado a la vista sin sobresaltos
  React.useEffect(() => {
    if (selectedIndex >= 0 && cardRefs.current[selectedIndex]) {
      cardRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Si cambia el catálogo filtrado y el índice queda fuera de rango, reajustarlo
  React.useEffect(() => {
    if (selectedIndex >= displayedProducts.length && displayedProducts.length > 0) {
      setSelectedIndex(displayedProducts.length - 1);
    }
  }, [displayedProducts.length, selectedIndex]);

  // Foco automático al montar el componente POS y atajo F2
  React.useEffect(() => {
    // Activar foco inmediatamente al cargar la pantalla
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setSelectedIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Integración de Escáner Físico USB / Bluetooth (Lectura de pistola por ráfagas)
  const handleBarcodeScan = React.useCallback(
    (barcode: string) => {
      let matchedProduct: PosProductItem | undefined;
      let matchedPresId: string | undefined;

      for (const p of initialProducts) {
        const pres = p.presentaciones.find((pr) => pr.codigo_barras === barcode);
        if (pres) {
          matchedProduct = p;
          matchedPresId = pres.id;
          break;
        }
        if (p.codigo_interno.toLowerCase() === barcode.toLowerCase()) {
          matchedProduct = p;
          matchedPresId = p.presentaciones.find((pr) => pr.es_default)?.id || p.presentaciones[0]?.id;
          break;
        }
      }

      if (matchedProduct && matchedPresId) {
        if (matchedProduct.stock_disponible_base <= 0) {
          playScannerBeep(false);
          toast.warning(`"${matchedProduct.nombre_comercial}" no tiene stock físico disponible.`);
          searchInputRef.current?.select();
          return;
        }

        playScannerBeep(true);
        addItem(matchedProduct, matchedPresId);
        const presObj = matchedProduct.presentaciones.find((pr) => pr.id === matchedPresId);
        toast.success(`Escaneado: ${matchedProduct.nombre_comercial} (${presObj?.nombre || 'Unidad'})`);
        
        // Limpiar búsqueda y mantener foco listo para el siguiente producto
        setSearchQuery('');
        setUrlQuery(null);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        playScannerBeep(false);
        toast.error(`Código de barras no registrado: ${barcode}`);
        searchInputRef.current?.select();
      }
    },
    [initialProducts, addItem, setSearchQuery, setUrlQuery]
  );

  useBarcodeScanner({ onScan: handleBarcodeScan });

  // Manejador cuando el usuario presiona Enter en el input de búsqueda
  const handleInputEnter = (val: string) => {
    const q = val.trim();
    if (!q) return;

    // 1. Coincidencia exacta por código de barras
    for (const p of initialProducts) {
      const pres = p.presentaciones.find((pr) => pr.codigo_barras === q);
      if (pres) {
        if (p.stock_disponible_base <= 0) {
          playScannerBeep(false);
          toast.warning(`"${p.nombre_comercial}" no tiene stock físico disponible.`);
          return;
        }
        playScannerBeep(true);
        addItem(p, pres.id);
        toast.success(`Agregado: ${p.nombre_comercial} (${pres.nombre})`);
        setSearchQuery('');
        setUrlQuery(null);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }
    }

    // 2. Coincidencia exacta por código interno (ej. MED-001)
    const exactCode = initialProducts.find(
      (p) => p.codigo_interno.toLowerCase() === q.toLowerCase()
    );
    if (exactCode) {
      if (exactCode.stock_disponible_base <= 0) {
        setCatalogTab('todos');
        setVisibleCount(PAGE_SIZE);
        toast.warning(`"${exactCode.nombre_comercial}" no tiene stock físico disponible.`);
        return;
      }
      playScannerBeep(true);
      const defaultPresId = exactCode.presentaciones.find((pr) => pr.es_default)?.id || exactCode.presentaciones[0]?.id;
      addItem(exactCode, defaultPresId);
      toast.success(`Agregado: ${exactCode.nombre_comercial}`);
      setSearchQuery('');
      setUrlQuery(null);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    // 3. Si hay exactamente 1 producto visible en el catálogo filtrado
    if (filteredProducts.length === 1) {
      const single = filteredProducts[0];
      if (single.stock_disponible_base <= 0) {
        toast.warning(`"${single.nombre_comercial}" no tiene stock físico disponible.`);
        return;
      }
      playScannerBeep(true);
      const defaultPresId = single.presentaciones.find((pr) => pr.es_default)?.id || single.presentaciones[0]?.id;
      addItem(single, defaultPresId);
      toast.success(`Agregado: ${single.nombre_comercial}`);
      setSearchQuery('');
      setUrlQuery(null);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    // 4. Si hay varios resultados en el catálogo (ej. "paracetamol" o "panadol")
    if (filteredProducts.length > 1) {
      // Si el usuario aún no seleccionó un producto, pre-seleccionar el primero para facilitar navegación
      if (selectedIndex === -1) {
        setSelectedIndex(0);
      }
      return;
    }

    // 5. Si hay 0 resultados visibles
    if (filteredProducts.length === 0) {
      const matchAgotado = initialProducts.find(
        (p) =>
          p.nombre_comercial.toLowerCase().includes(q.toLowerCase()) ||
          p.codigo_interno.toLowerCase() === q.toLowerCase()
      );

      if (matchAgotado && catalogTab !== 'todos') {
        setCatalogTab('todos');
        setVisibleCount(PAGE_SIZE);
        setSelectedIndex(-1);
        toast.info(`"${matchAgotado.nombre_comercial}" no tiene stock físico disponible.`);
        return;
      }

      playScannerBeep(false);
      toast.error(`No se encontraron medicamentos para "${q}".`);
    }
  };

  const handleSelectPresentation = (productId: string, presId: string) => {
    setSelectedPresentations((prev) => ({ ...prev, [productId]: presId }));
    searchInputRef.current?.focus();
  };

  const handleAddProduct = React.useCallback((product: PosProductItem) => {
    if (product.stock_disponible_base <= 0) {
      playScannerBeep(false);
      toast.error(`"${product.nombre_comercial}" no tiene stock físico disponible.`);
      return;
    }
    const chosenPresId = selectedPresentations[product.id];
    addItem(product, chosenPresId);
    playScannerBeep(true);
    toast.success(`${product.nombre_comercial} agregado al carrito`);
    // Re-enfocar el buscador para seguir vendiendo ágilmente
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [selectedPresentations, addItem]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setUrlQuery(val || null);
    setVisibleCount(PAGE_SIZE);
    setSelectedIndex(-1);
  };

  // Escucha global de teclado para navegación y atajos rápidos
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Si hay un modal abierto o el foco está en otro campo de texto ajeno, no interceptar
      if (isCheckoutModalOpen || isRecetaModalOpen || isHeldCartsModalOpen) return;

      const active = document.activeElement;
      const isOtherInput =
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT') &&
        active !== searchInputRef.current;
      if (isOtherInput) return;

      // Si el foco está en el input de búsqueda, delegamos al onKeyDown del input
      if (active === searchInputRef.current) return;

      // Flechas direccionales cuando el foco está suelto en la pantalla
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowDown') navigateGrid('down');
        if (e.key === 'ArrowUp') navigateGrid('up');
        if (e.key === 'ArrowLeft') navigateGrid('left');
        if (e.key === 'ArrowRight') navigateGrid('right');
        return;
      }

      // Enter para agregar producto seleccionado
      if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < displayedProducts.length) {
        e.preventDefault();
        const selProd = displayedProducts[selectedIndex];
        if (selProd) {
          handleAddProduct(selProd);
        }
        return;
      }

      // Escape para volver al buscador
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIndex(-1);
        searchInputRef.current?.focus();
        return;
      }

      // 1..9 para elegir presentaciones
      if (selectedIndex >= 0 && /^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        const selProd = displayedProducts[selectedIndex];
        if (selProd && selProd.presentaciones[num - 1]) {
          e.preventDefault();
          handleSelectPresentation(selProd.id, selProd.presentaciones[num - 1].id);
        }
        return;
      }

      // Alt+G para agregar alternativa genérica
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        if (selectedIndex >= 0) {
          const selProd = displayedProducts[selectedIndex];
          if (selProd?.alternativa_generica) {
            e.preventDefault();
            const genericProd = initialProducts.find(
              (p) => p.producto_id === selProd.alternativa_generica?.producto_id
            );
            if (genericProd) {
              handleAddProduct(genericProd);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isCheckoutModalOpen,
    isRecetaModalOpen,
    isHeldCartsModalOpen,
    navigateGrid,
    selectedIndex,
    displayedProducts,
    initialProducts,
    handleAddProduct,
  ]);

  return (
    <div className="flex-1 flex flex-col space-y-3.5 h-full">
      {/* Buscador inteligente y escáner de código de barras */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            autoFocus
            type="text"
            placeholder="Buscar por nombre comercial, principio activo (DCI) o escanear código de barras [F2]..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateGrid('down');
              } else if (e.key === 'ArrowUp') {
                if (selectedIndex >= 0) {
                  e.preventDefault();
                  navigateGrid('up');
                }
              } else if (e.key === 'ArrowRight' && selectedIndex >= 0) {
                e.preventDefault();
                navigateGrid('right');
              } else if (e.key === 'ArrowLeft' && selectedIndex >= 0) {
                e.preventDefault();
                navigateGrid('left');
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < displayedProducts.length) {
                  const selProd = displayedProducts[selectedIndex];
                  if (selProd) {
                    handleAddProduct(selProd);
                  }
                } else {
                  handleInputEnter(searchQuery);
                }
              } else if (e.key === 'Escape') {
                if (selectedIndex >= 0) {
                  e.preventDefault();
                  setSelectedIndex(-1);
                  searchInputRef.current?.select();
                } else if (searchQuery) {
                  e.preventDefault();
                  handleSearchChange('');
                }
              } else if (selectedIndex >= 0 && /^[1-9]$/.test(e.key)) {
                const num = parseInt(e.key, 10);
                const selProd = displayedProducts[selectedIndex];
                if (selProd && selProd.presentaciones[num - 1]) {
                  e.preventDefault();
                  handleSelectPresentation(selProd.id, selProd.presentaciones[num - 1].id);
                }
              } else if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'g') {
                if (selectedIndex >= 0) {
                  const selProd = displayedProducts[selectedIndex];
                  if (selProd?.alternativa_generica) {
                    e.preventDefault();
                    const genericProd = initialProducts.find(
                      (p) => p.producto_id === selProd.alternativa_generica?.producto_id
                    );
                    if (genericProd) {
                      handleAddProduct(genericProd);
                    }
                  }
                }
              }
            }}
            className="pl-10 pr-24 h-12 text-sm rounded-2xl apple-glass shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
              F2
            </span>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleSearchChange('');
              searchInputRef.current?.focus();
            }}
            className="rounded-xl text-xs"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Sub-barra: Segmented Control Con Stock / Más Vendidos / Todo el Catálogo */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap px-0.5">
        <div className="flex items-center gap-1 p-0.5 bg-sidebar/80 dark:bg-white/[0.04] border border-border/60 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => {
              setCatalogTab('rotacion');
              setVisibleCount(PAGE_SIZE);
              setSelectedIndex(-1);
            }}
            className={`h-7 px-3 flex items-center gap-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              catalogTab === 'rotacion'
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            <span>Más Vendidos ({rotacionCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCatalogTab('stock');
              setVisibleCount(PAGE_SIZE);
              setSelectedIndex(-1);
            }}
            className={`h-7 px-3 flex items-center gap-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              catalogTab === 'stock'
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5 text-[#34c759]" />
            <span>Con Stock ({conStockCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCatalogTab('todos');
              setVisibleCount(PAGE_SIZE);
              setSelectedIndex(-1);
            }}
            className={`h-7 px-3 flex items-center gap-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              catalogTab === 'todos'
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Todo el Catálogo ({initialProducts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium">
            {!activeQuery ? (
              catalogTab === 'rotacion' ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  ● Alta rotación con stock ({displayedProducts.length} de {filteredProducts.length})
                </span>
              ) : catalogTab === 'stock' ? (
                <span className="text-[#34c759] font-medium">
                  ● Catálogo con stock ({displayedProducts.length} de {filteredProducts.length})
                </span>
              ) : (
                `Todo el catálogo (${displayedProducts.length} de ${filteredProducts.length})`
              )
            ) : (
              `${filteredProducts.length} resultado(s) para "${activeQuery}"`
            )}
          </span>

          {displayedProducts.length > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/80 bg-black/[0.03] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg border border-border/50">
              <span className="font-mono bg-background border border-border/70 px-1 py-0.2 rounded font-semibold text-foreground">
                ↑ ↓ ← →
              </span>
              <span>Navegar</span>
              <span className="opacity-40">•</span>
              <span className="font-mono bg-background border border-border/70 px-1 py-0.2 rounded font-semibold text-foreground">
                Enter
              </span>
              <span>Agregar</span>
              {selectedIndex >= 0 && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="font-mono bg-background border border-border/70 px-1 py-0.2 rounded font-semibold text-foreground">
                    1..9
                  </span>
                  <span>Presentación</span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono bg-background border border-border/70 px-1 py-0.2 rounded font-semibold text-foreground">
                    Esc
                  </span>
                  <span>Buscar</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid de Productos con Apple Design */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="py-10 px-6 flex flex-col items-center justify-center text-center rounded-3xl apple-glass border border-dashed border-border/80 gap-3 max-w-xl mx-auto my-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1 shadow-xs">
              <Pill className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground tracking-apple-title">
                {activeQuery
                  ? `No hay coincidencias para "${activeQuery}"`
                  : catalogTab !== 'todos'
                  ? 'No hay productos con stock disponible en esta vista'
                  : 'No se encontraron medicamentos'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                {coincidenciasEnAgotados > 0
                  ? `Existen ${coincidenciasEnAgotados} producto(s) en el catálogo general que coinciden pero están actualmente sin stock físico.`
                  : 'Verifica la ortografía o intenta buscar por Principio Activo (DCI) para encontrar alternativas farmacéuticas.'}
              </p>
            </div>

            {/* Sugerencias de Principio Activo (DCI) con 1 clic */}
            {dciSugerencias.length > 0 && (
              <div className="w-full pt-3 pb-1 border-t border-border/40 mt-1 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Sugerencias por Principio Activo (DCI) con stock disponible:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {dciSugerencias.map((dci) => (
                    <button
                      key={dci}
                      type="button"
                      onClick={() => {
                        handleSearchChange(dci);
                        searchInputRef.current?.focus();
                        toast.info(`Filtrando por DCI: ${dci}`);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-all apple-press-feedback cursor-pointer border border-primary/20"
                    >
                      {dci}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2 flex-wrap justify-center pt-2">
              {activeQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="rounded-xl text-xs gap-1.5 apple-press-feedback"
                >
                  Limpiar búsqueda
                  <kbd className="px-1 py-0.2 rounded bg-muted text-[10px] font-mono">Esc</kbd>
                </Button>
              )}

              {catalogTab !== 'todos' && (
                <Button
                  variant={coincidenciasEnAgotados > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCatalogTab('todos');
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`rounded-xl text-xs gap-1.5 ${
                    coincidenciasEnAgotados > 0
                      ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm'
                      : 'border-dashed'
                  }`}
                >
                  {coincidenciasEnAgotados > 0
                    ? `Ver ${coincidenciasEnAgotados} en catálogo general (Agotados)`
                    : 'Buscar en todo el catálogo (incluye agotados)'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div ref={gridRef} className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {displayedProducts.map((product, idx) => {
              const activePresId =
                selectedPresentations[product.id] ||
                product.presentaciones.find((p) => p.es_default)?.id ||
                product.presentaciones[0]?.id;

              const activePres =
                product.presentaciones.find((p) => p.id === activePresId) ||
                product.presentaciones[0];

              const hasStock = product.stock_disponible_base > 0;
              const isProductSelected = selectedIndex === idx;

              return (
                <Card
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  key={product.id}
                  onClick={() => setSelectedIndex(idx)}
                  tabIndex={0}
                  onFocus={() => setSelectedIndex(idx)}
                  className={`p-4 flex flex-col justify-between transition-all duration-200 group border cursor-pointer outline-none relative rounded-2xl ${
                    isProductSelected
                      ? hasStock
                        ? 'border-[#0071e3]/70 dark:border-[#2997ff]/60 bg-gradient-to-b from-[#0071e3]/[0.06] via-[#0071e3]/[0.02] to-transparent dark:from-[#2997ff]/[0.08] dark:via-[#2997ff]/[0.02] dark:to-transparent shadow-[0_0_0_1px_rgba(0,113,227,0.22),0_8px_20px_-6px_rgba(0,113,227,0.16)] dark:shadow-[0_0_0_1px_rgba(41,151,255,0.25),0_8px_24px_-6px_rgba(41,151,255,0.18)] -translate-y-0.5'
                        : 'border-amber-500/50 dark:border-amber-500/40 bg-amber-500/[0.03] shadow-[0_0_0_1px_rgba(245,158,11,0.2)] opacity-85'
                      : hasStock
                      ? 'border-black/[0.06] dark:border-white/[0.08] hover:border-border/80 hover:shadow-xs'
                      : 'border-destructive/20 bg-muted/20 opacity-80 hover:border-destructive/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header del producto */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-semibold text-sm tracking-apple-title transition-colors truncate ${
                            isProductSelected ? 'text-[#0071e3] dark:text-[#2997ff]' : 'text-foreground group-hover:text-[#0071e3]'
                          }`}>
                            {product.nombre_comercial}
                          </span>
                          {product.total_vendidos && product.total_vendidos > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 shrink-0">
                              <TrendingUp className="h-2.5 w-2.5" />
                              <span>{product.total_vendidos} vend.</span>
                            </span>
                          ) : null}
                          {isProductSelected && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0071e3]/10 dark:bg-[#2997ff]/15 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20 dark:border-[#2997ff]/30 shrink-0 shadow-xs animate-in fade-in duration-150">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3] dark:bg-[#2997ff] animate-pulse" />
                              <span>Activo</span>
                              <kbd className="text-[9px] font-mono opacity-70 ml-0.5">Enter ↵</kbd>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium truncate">
                          {product.nombre_generico} · {product.concentracion}
                        </span>
                      </div>
                      <CondicionVentaBadge condicion={product.condicion_venta} />
                    </div>

                    {/* Stock y Laboratorio */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Lab: {product.laboratorio}</span>
                      <span className="font-mono">
                        Stock:{' '}
                        <strong
                          className={
                            hasStock
                              ? 'text-[#34c759] font-bold'
                              : 'text-destructive font-semibold'
                          }
                        >
                          {product.stock_disponible_base}
                        </strong>{' '}
                        {product.unidad_base.toLowerCase()}s
                      </span>
                    </div>

                    {/* Selector de Fraccionamiento (Unidad, Blíster, Caja) */}
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      {product.presentaciones.map((pres, presIdx) => {
                        const isPresSelected = pres.id === activePresId;
                        return (
                          <button
                            key={pres.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPresentation(product.id, pres.id);
                              setSelectedIndex(idx);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback flex items-center gap-1.5 cursor-pointer ${
                              isPresSelected
                                ? 'bg-[#0071e3] text-white shadow-xs font-semibold'
                                : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {isProductSelected && (
                              <span
                                className={`text-[9px] font-mono px-1 py-0.2 rounded transition-colors ${
                                  isPresSelected
                                    ? 'bg-white/25 text-white font-bold'
                                    : 'bg-black/10 dark:bg-white/10 text-muted-foreground'
                                }`}
                                title={`Presiona la tecla "${presIdx + 1}" para seleccionar`}
                              >
                                {presIdx + 1}
                              </span>
                            )}
                            <span>{pres.nombre}</span>
                            <span className="opacity-90 font-mono text-[11px]">
                              {formatMoney(pres.precio_venta)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Banner de Alternativa Genérica (Ley DIGEMID) */}
                    {product.alternativa_generica && (
                      <div className="mt-2 p-2 rounded-xl bg-[#34c759]/10 border border-[#34c759]/25 flex items-center justify-between text-xs text-[#248a3d] dark:text-[#30d158]">
                        <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            DCI: <strong>{product.alternativa_generica.nombre_comercial}</strong> ({formatMoney(product.alternativa_generica.precio_venta)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const genericProd = initialProducts.find(
                              (p) => p.producto_id === product.alternativa_generica?.producto_id
                            );
                            if (genericProd) {
                              handleAddProduct(genericProd);
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#34c759]/20 hover:bg-[#34c759]/30 transition-colors shrink-0 ml-1 cursor-pointer flex items-center gap-1"
                          title="Agregar alternativa genérica (Atajo: Alt+G)"
                        >
                          <span>+ Genérico (-{product.alternativa_generica.ahorro_porcentaje}%)</span>
                          {isProductSelected && (
                            <kbd className="px-1 py-0.2 rounded bg-[#34c759]/30 text-[9px] font-mono">
                              Alt+G
                            </kbd>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botón de Agregar al carrito con precio */}
                  <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Precio ({activePres?.nombre})
                      </span>
                      <span className="text-lg font-bold font-mono tracking-tight text-foreground">
                        {formatMoney(activePres?.precio_venta || 0)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      disabled={!hasStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProduct(product);
                      }}
                      className={`rounded-xl gap-1.5 font-medium px-4 transition-all cursor-pointer ${
                        !hasStock
                          ? 'opacity-60 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted'
                          : isProductSelected
                          ? 'bg-[#0071e3] hover:bg-[#0071e3]/90 text-white shadow-sm'
                          : ''
                      }`}
                    >
                      {hasStock ? (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Agregar</span>
                          {isProductSelected && (
                            <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded bg-white/20 text-[10px] font-mono font-medium">
                              ↵ Enter
                            </kbd>
                          )}
                        </>
                      ) : (
                        <span>Sin Stock</span>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Botón de Cargar Más para catálogos extensos (+200 productos) */}
          {hasMore && (
            <div className="pt-3 pb-6 flex flex-col items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="rounded-xl px-5 h-9 text-xs font-semibold border-border/70 shadow-xs hover:bg-accent apple-press-feedback transition-all cursor-pointer"
              >
                Cargar más productos ({displayedProducts.length} de {filteredProducts.length})
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Presiona F2 o escribe en el buscador para localizar cualquier producto de inmediato
              </span>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
