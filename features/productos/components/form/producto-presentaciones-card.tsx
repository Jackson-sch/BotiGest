'use client';

import * as React from 'react';
import {
  Layers,
  Plus,
  Barcode,
  Trash2,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PresentacionItem } from '../../types';

interface ProductoPresentacionesCardProps {
  presentaciones: PresentacionItem[];
  unidadBase: string;
  onAddPresentacion: (nombrePreset?: string, factorPreset?: number) => void;
  onRemovePresentacion: (index: number) => void;
  onUpdatePresentacion: (index: number, field: keyof PresentacionItem, val: any) => void;
}

export function ProductoPresentacionesCard({
  presentaciones,
  unidadBase,
  onAddPresentacion,
  onRemovePresentacion,
  onUpdatePresentacion,
}: ProductoPresentacionesCardProps) {
  const defaultIdx = presentaciones.findIndex((p) => p.es_default);
  const selectedRadioValue = defaultIdx >= 0 ? defaultIdx.toString() : '0';

  return (
    <Card className="p-6 apple-glass space-y-5 rounded-3xl border-border/50 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Presentaciones Comerciales & Fraccionamiento</h2>
            <p className="text-[11px] text-muted-foreground">
              Configura precios de venta y códigos de barras USB por caja, blíster o unidad sin scroll horizontal
            </p>
          </div>
        </div>

        {/* Botones rápidos de preset */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddPresentacion('Caja x 100', 100)}
            className="h-8 text-xs rounded-xl apple-press-feedback"
          >
            + Caja x100
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddPresentacion('Caja x 30', 30)}
            className="h-8 text-xs rounded-xl apple-press-feedback"
          >
            + Caja x30
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddPresentacion('Blíster x 10', 10)}
            className="h-8 text-xs rounded-xl apple-press-feedback"
          >
            + Blíster x10
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddPresentacion('Unidad', 1)}
            className="h-8 text-xs rounded-xl apple-press-feedback"
          >
            + Unidad
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onAddPresentacion()}
            className="h-8 text-xs rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Otra
          </Button>
        </div>
      </div>

      {/* Lista de Filas de Presentaciones envueltas en Shadcn RadioGroup */}
      <RadioGroup
        value={selectedRadioValue}
        onValueChange={(val) => onUpdatePresentacion(Number(val), 'es_default', true)}
        className="space-y-2.5 w-full gap-0"
      >
        {/* Cabecera descriptiva visible en pantallas medianas y grandes */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="w-28">Selección POS</span>
          <span className="flex-1 min-w-[140px]">Nombre de Presentación</span>
          <span className="w-28 text-center">Factor ({unidadBase})</span>
          <span className="flex-1 min-w-[160px]">Código de Barras (USB)</span>
          <span className="w-32">Precio Venta (S/.)</span>
          <span className="w-28 text-right">P. Unitario Ref.</span>
          <span className="w-9 text-right"></span>
        </div>

        {presentaciones.map((pres, idx) => {
          const unitPrice =
            pres.factor_base > 0 && pres.precio_venta > 0
              ? (pres.precio_venta / pres.factor_base).toFixed(2)
              : '0.00';

          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-border/40 bg-background/50 hover:bg-background/80 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-3"
            >
              {/* Selector Radio de Presentación Default con Shadcn RadioGroupItem */}
              <label
                htmlFor={`radio-pres-${idx}`}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 cursor-pointer transition-all shrink-0 w-auto md:w-28 select-none ${
                  pres.es_default
                    ? 'bg-[#0071e3]/15 text-[#2997ff] border-[#0071e3]/30 shadow-sm'
                    : 'border-border/40 text-muted-foreground hover:bg-muted/30'
                }`}
                title="Marcar como presentación por defecto al vender en el POS"
              >
                <RadioGroupItem
                  id={`radio-pres-${idx}`}
                  value={idx.toString()}
                  className="border-[#0071e3] text-[#0071e3]"
                />
                <span className="text-[11px] whitespace-nowrap">
                  {pres.es_default ? 'Principal' : 'Secundaria'}
                </span>
              </label>

              {/* Nombre de la presentación */}
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium block md:hidden">
                  Nombre de la Presentación
                </label>
                <Input
                  type="text"
                  value={pres.nombre}
                  onChange={(e) => onUpdatePresentacion(idx, 'nombre', e.target.value)}
                  placeholder="Ej. Caja x 100 / Blíster x 10"
                  className="h-9 text-xs font-semibold bg-background/80"
                  required
                />
              </div>

              {/* Factor de conversión */}
              <div className="w-full md:w-28 space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium block md:hidden">
                  Contiene ({unidadBase})
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min={1}
                    value={pres.factor_base}
                    onChange={(e) => onUpdatePresentacion(idx, 'factor_base', Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold pr-8 bg-background/80 text-center"
                    required
                  />
                  <span className="absolute right-2 text-[10px] text-muted-foreground uppercase pointer-events-none select-none z-10">
                    {unidadBase.slice(0, 3)}
                  </span>
                </div>
              </div>

              {/* Código de barras USB - Icono z-10 pointer-events-none nítido */}
              <div className="flex-1 min-w-[160px] space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium block md:hidden">
                  Código de Barras USB
                </label>
                <div className="relative flex items-center">
                  <Barcode className="absolute left-2.5 h-3.5 w-3.5 text-foreground/70 dark:text-muted-foreground z-10 pointer-events-none select-none" />
                  <Input
                    type="text"
                    value={pres.codigo_barras || ''}
                    onChange={(e) => onUpdatePresentacion(idx, 'codigo_barras', e.target.value)}
                    placeholder="EAN-13 / Lector USB"
                    className="pl-8 h-9 text-xs font-mono bg-background/80"
                  />
                </div>
              </div>

              {/* Precio de Venta S/ - Prefijo z-10 pointer-events-none nítido */}
              <div className="w-full md:w-32 space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium block md:hidden">
                  Precio de Venta (S/.)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs font-bold text-foreground/70 dark:text-muted-foreground z-10 pointer-events-none select-none">
                    S/.
                  </span>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    value={pres.precio_venta}
                    onChange={(e) => onUpdatePresentacion(idx, 'precio_venta', Number(e.target.value))}
                    className="pl-8 h-9 text-xs font-mono font-bold text-foreground bg-background/80 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Precio Unitario Fraccionado */}
              <div className="w-full md:w-28 text-left md:text-right shrink-0">
                <span className="text-[10px] text-muted-foreground block md:hidden">Precio Unitario Ref:</span>
                <div className="text-[11px] font-mono whitespace-nowrap">
                  <span className="text-emerald-400 font-bold">S/ {unitPrice}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    / {unidadBase.toLowerCase().slice(0, 5)}
                  </span>
                </div>
              </div>

              {/* Eliminar fila */}
              <button
                type="button"
                onClick={() => onRemovePresentacion(idx)}
                disabled={presentaciones.length <= 1}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 shrink-0 self-end md:self-center"
                title="Eliminar presentación"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </RadioGroup>

      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-[#2997ff] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            ¿Dónde se registran los Lotes y Fechas de Vencimiento?
          </span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Por normativa DIGEMID (BPA / FEFO), los medicamentos en catálogo no llevan una fecha de vencimiento única. Las fechas de vencimiento y números de lote se registran en cada ingreso de mercadería desde <strong>Compras Droguerías</strong> o mediante <strong>Inventario & Lotes</strong>.
          </p>
        </div>
      </div>
    </Card>
  );
}
