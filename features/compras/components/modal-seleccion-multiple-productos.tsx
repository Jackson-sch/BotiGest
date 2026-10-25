'use client';

import * as React from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Package,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { appleSprings } from '@/lib/utils';
import type { ProductoItem } from '@/features/productos/types';
import type { CompraItemInput } from '../types';

interface ModalSeleccionMultipleProductosProps {
  isOpen: boolean;
  onClose: () => void;
  productos: ProductoItem[];
  onAgregarItems: (items: CompraItemInput[]) => void;
}

export function ModalSeleccionMultipleProductos({
  isOpen,
  onClose,
  productos,
  onAgregarItems,
}: ModalSeleccionMultipleProductosProps) {
  const [busqueda, setBusqueda] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
  const [cantidades, setCantidades] = React.useState<Record<string, number>>({});

  const productosFiltrados = React.useMemo(() => {
    if (!busqueda.trim()) return productos.slice(0, 50);
    const q = busqueda.toLowerCase().trim();
    return productos.filter(
      (p) =>
        p.nombre_comercial.toLowerCase().includes(q) ||
        (p.nombre_generico && p.nombre_generico.toLowerCase().includes(q)) ||
        p.codigo_interno.toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  const handleToggle = (prodId: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev, [prodId]: !prev[prodId] };
      if (next[prodId] && !cantidades[prodId]) {
        setCantidades((c) => ({ ...c, [prodId]: 1 }));
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const todos = productosFiltrados.every((p) => selectedIds[p.id]);
    if (todos) {
      setSelectedIds({});
    } else {
      const nuevo = { ...selectedIds };
      const nuevasCant = { ...cantidades };
      productosFiltrados.forEach((p) => {
        nuevo[p.id] = true;
        if (!nuevasCant[p.id]) nuevasCant[p.id] = 1;
      });
      setSelectedIds(nuevo);
      setCantidades(nuevasCant);
    }
  };

  const seleccionadosTotal = Object.values(selectedIds).filter(Boolean).length;

  const handleConfirmar = () => {
    const seleccionados = productos.filter((p) => selectedIds[p.id]);
    const fechaFutura = new Date();
    fechaFutura.setFullYear(fechaFutura.getFullYear() + 2);
    const vtoDefault = fechaFutura.toISOString().split('T')[0];

    const nuevos: CompraItemInput[] = seleccionados.map((p) => {
      const pres = p.presentaciones.find((pr) => pr.es_default) || p.presentaciones[0];
      const factor = pres?.factor_base || 1;
      const cant = cantidades[p.id] || 1;
      const costo = pres ? Number((pres.precio_venta * 0.7).toFixed(2)) : Number(p.costo_promedio || 1);

      return {
        producto_id: p.id,
        producto_nombre: p.nombre_comercial,
        presentacion_id: pres?.id || 'default-pres',
        presentacion_nombre: pres?.nombre || 'Unidad',
        factor_base: factor,
        numero_lote: 'POR-ASIGNAR',
        fecha_vencimiento: vtoDefault,
        cantidad: cant,
        costo_unitario_presentacion: costo,
      };
    });

    onAgregarItems(nuevos);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={appleSprings.sheet}
            className="relative w-full max-w-4xl h-[82vh] bg-white dark:bg-[#161618] rounded-3xl border border-border shadow-2xl z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    Selección Múltiple de Medicamentos
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Marque todos los productos que desea incluir en esta orden de compra
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Barra de Filtro y Acción Rápida */}
            <div className="p-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, genérico o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="h-8 pl-9 text-xs rounded-xl"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllVisible}
                  className="text-xs rounded-xl h-8"
                >
                  {productosFiltrados.length > 0 &&
                  productosFiltrados.every((p) => selectedIds[p.id])
                    ? 'Deseleccionar Visibles'
                    : 'Seleccionar Visibles'}
                </Button>

                <Badge variant="outline" className="text-xs font-mono">
                  {seleccionadosTotal} seleccionados
                </Badge>
              </div>
            </div>

            {/* Lista de Productos con Checkbox y Cantidad */}
            <div className="flex-1 overflow-y-auto p-3">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-3 py-2 text-center w-10"></th>
                    <th className="px-3 py-2 text-left font-medium">Medicamento / Principio Activo</th>
                    <th className="px-3 py-2 text-left font-medium">Laboratorio</th>
                    <th className="px-3 py-2 text-right font-medium">Stock Actual</th>
                    <th className="px-3 py-2 text-center font-medium w-28">Cant. a Pedir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {productosFiltrados.map((p) => {
                    const isSelected = !!selectedIds[p.id];
                    const pres = p.presentaciones.find((pr) => pr.es_default) || p.presentaciones[0];

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(p.id)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-foreground">{p.nombre_comercial}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {p.nombre_generico ? `${p.nombre_generico} · ` : ''}
                            {p.concentracion ? `${p.concentracion} · ` : ''}
                            <span className="font-mono text-[#0071e3]">{pres?.nombre || 'Unidad'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {p.laboratorio_nombre || 'Varios'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">
                          {p.total_stock || 0} {p.unidad_base}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="1"
                            disabled={!isSelected}
                            value={cantidades[p.id] || 1}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              setCantidades((prev) => ({
                                ...prev,
                                [p.id]: isNaN(v) || v <= 0 ? 1 : v,
                              }));
                            }}
                            className={`h-7 w-20 text-center font-mono font-bold text-xs mx-auto rounded-lg ${
                              isSelected ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'opacity-40'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleConfirmar}
                disabled={seleccionadosTotal === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar ({seleccionadosTotal}) medicamentos a la orden</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
