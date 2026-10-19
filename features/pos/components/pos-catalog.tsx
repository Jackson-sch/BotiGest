'use client';

import * as React from 'react';
import {
  Search,
  ScanLine,
  Pill,
  Sparkles,
  Plus,
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
  const { searchQuery, setSearchQuery, addItem } = usePosStore();
  const [urlQuery, setUrlQuery] = useQueryState('q', parseAsString.withDefault(''));
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedPresentations, setSelectedPresentations] = React.useState<Record<string, string>>({});

  // Sincronizar parámetro de búsqueda de URL con store
  React.useEffect(() => {
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, searchQuery, setSearchQuery]);

  const [soloConStock, setSoloConStock] = React.useState<boolean>(true);

  // Total de medicamentos con stock físico disponible
  const conStockCount = React.useMemo(
    () => initialProducts.filter((p) => p.stock_disponible_base > 0).length,
    [initialProducts]
  );

  // Filtrado reactivo e instantáneo sobre los productos traídos de la base de datos
  const activeQuery = searchQuery || urlQuery;
  const filteredProducts = React.useMemo(() => {
    let list = initialProducts;

    // Si el filtro "Solo con stock" está activo
    if (soloConStock) {
      list = list.filter((p) => p.stock_disponible_base > 0);
    }

    const q = activeQuery.toLowerCase().trim();
    if (!q) {
      // Sin búsqueda activa: limitar a los 24 medicamentos más prioritarios con stock para máxima agilidad
      return list.slice(0, 24);
    }

    return list.filter((p) => {
      const matchName = p.nombre_comercial.toLowerCase().includes(q);
      const matchGen = p.nombre_generico?.toLowerCase().includes(q) ?? false;
      const matchCod = p.codigo_interno.toLowerCase().includes(q);
      const matchBarcode = p.presentaciones.some((pr) => pr.codigo_barras?.includes(q));
      return matchName || matchGen || matchCod || matchBarcode;
    });
  }, [activeQuery, initialProducts, soloConStock]);

  // Foco automático al montar el componente POS y atajo F2
  React.useEffect(() => {
    // Activar foco inmediatamente al cargar la pantalla
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Integración de Escáner Físico USB / Bluetooth
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

      // Si no hubo coincidencia exacta de código, pero hay un único medicamento en pantalla
      if (!matchedProduct && filteredProducts.length === 1) {
        const single = filteredProducts[0];
        matchedProduct = single;
        matchedPresId = single.presentaciones.find((pr) => pr.es_default)?.id || single.presentaciones[0]?.id;
      }

      if (matchedProduct && matchedPresId) {
        if (matchedProduct.stock_disponible_base <= 0) {
          playScannerBeep(false);
          toast.warning(`⚠️ "${matchedProduct.nombre_comercial}" no tiene stock físico disponible.`);
          searchInputRef.current?.select();
          return;
        }

        playScannerBeep(true);
        addItem(matchedProduct, matchedPresId);
        const presObj = matchedProduct.presentaciones.find((pr) => pr.id === matchedPresId);
        toast.success(`⚡ Escaneado: ${matchedProduct.nombre_comercial} (${presObj?.nombre || 'Unidad'})`);
        
        // Limpiar búsqueda y mantener foco listo para el siguiente producto
        setSearchQuery('');
        setUrlQuery(null);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        playScannerBeep(false);
        toast.error(`Código o medicamento no reconocido: ${barcode}`);
        searchInputRef.current?.select();
      }
    },
    [initialProducts, filteredProducts, addItem, setSearchQuery, setUrlQuery]
  );

  useBarcodeScanner({ onScan: handleBarcodeScan });

  const handleSelectPresentation = (productId: string, presId: string) => {
    setSelectedPresentations((prev) => ({ ...prev, [productId]: presId }));
    searchInputRef.current?.focus();
  };

  const handleAddProduct = (product: PosProductItem) => {
    if (product.stock_disponible_base <= 0) {
      toast.error(`"${product.nombre_comercial}" no tiene stock físico disponible.`);
      return;
    }
    const chosenPresId = selectedPresentations[product.id];
    addItem(product, chosenPresId);
    toast.success(`${product.nombre_comercial} agregado al carrito`);
    // Re-enfocar el buscador para seguir vendiendo ágilmente
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setUrlQuery(val || null);
  };

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
              if (e.key === 'Enter') {
                const val = searchQuery.trim();
                if (val) {
                  e.preventDefault();
                  handleBarcodeScan(val);
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

      {/* Sub-barra: Segmented Control Con Stock / Todo el Catálogo */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap px-0.5">
        <div className="flex items-center gap-1 p-0.5 bg-sidebar/80 dark:bg-white/[0.04] border border-border/60 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setSoloConStock(true)}
            className={`h-7 px-3 flex items-center gap-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              soloConStock
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#34c759]" />
            <span>Disponibles con Stock ({conStockCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSoloConStock(false)}
            className={`h-7 px-3 flex items-center gap-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              !soloConStock
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Todo el Catálogo ({initialProducts.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground font-medium">
          {!activeQuery ? (
            soloConStock ? (
              <span className="text-[#34c759] font-medium">● Mostrando catálogo con stock disponible</span>
            ) : (
              'Mostrando todo el catálogo'
            )
          ) : (
            `${filteredProducts.length} resultado(s) para "${activeQuery}"`
          )}
        </span>
      </div>

      {/* Grid de Productos con Apple Design */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl apple-glass border border-dashed border-border gap-2">
            <Pill className="h-10 w-10 text-muted-foreground/50 mb-1" />
            <p className="text-sm font-medium text-foreground">
              {soloConStock
                ? 'No se encontraron productos con stock disponible'
                : 'No se encontraron medicamentos'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {soloConStock
                ? 'El producto podría estar agotado en este momento.'
                : 'Verifica el nombre o código de barras ingresado.'}
            </p>
            {soloConStock && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoloConStock(false)}
                className="mt-2 text-xs rounded-xl border-dashed"
              >
                Buscar en todo el catálogo (incluyendo agotados)
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const activePresId =
                selectedPresentations[product.id] ||
                product.presentaciones.find((p) => p.es_default)?.id ||
                product.presentaciones[0]?.id;

              const activePres =
                product.presentaciones.find((p) => p.id === activePresId) ||
                product.presentaciones[0];

              const hasStock = product.stock_disponible_base > 0;

              return (
                <Card
                  key={product.id}
                  className={`p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 group border ${
                    hasStock
                      ? 'border-black/[0.05] dark:border-white/[0.07]'
                      : 'border-destructive/20 bg-muted/20 opacity-85'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header del producto */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-apple-title text-foreground group-hover:text-[#0071e3] transition-colors">
                          {product.nombre_comercial}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
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
                      {product.presentaciones.map((pres) => {
                        const isSelected = pres.id === activePresId;
                        return (
                          <button
                            key={pres.id}
                            type="button"
                            onClick={() => handleSelectPresentation(product.id, pres.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#0071e3] text-white shadow-xs font-semibold'
                                : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:text-foreground'
                            }`}
                          >
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
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#34c759]/20 hover:bg-[#34c759]/30 transition-colors shrink-0 ml-1 cursor-pointer"
                        >
                          + Genérico (-{product.alternativa_generica.ahorro_porcentaje}%)
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
                      onClick={() => handleAddProduct(product)}
                      className={`rounded-xl gap-1.5 font-medium px-4 transition-all ${
                        !hasStock
                          ? 'opacity-60 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted'
                          : ''
                      }`}
                    >
                      {hasStock ? (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Agregar</span>
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
        )}
      </div>
    </div>
  );
}
