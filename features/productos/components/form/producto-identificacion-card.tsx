'use client';

import * as React from 'react';
import { Pill, Sparkles, Plus, Building2, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CatalogoAuxiliares } from '../../types';

interface ProductoIdentificacionCardProps {
  codigoInterno: string;
  setCodigoInterno: (val: string) => void;
  onGenerarCodigo: () => void;
  nombreComercial: string;
  setNombreComercial: (val: string) => void;
  nombreGenerico: string;
  setNombreGenerico: (val: string) => void;
  concentracion: string;
  setConcentracion: (val: string) => void;
  formaId: number | '';
  setFormaId: (val: number) => void;
  formasList: CatalogoAuxiliares['formas'];
  onAbrirModalNuevaForma: () => void;
  laboratorioId: string;
  setLaboratorioId: (val: string) => void;
  categoriaId: string;
  setCategoriaId: (val: string) => void;
  laboratorios: CatalogoAuxiliares['laboratorios'];
  categorias: CatalogoAuxiliares['categorias'];
}

export function ProductoIdentificacionCard({
  codigoInterno,
  setCodigoInterno,
  onGenerarCodigo,
  nombreComercial,
  setNombreComercial,
  nombreGenerico,
  setNombreGenerico,
  concentracion,
  setConcentracion,
  formaId,
  setFormaId,
  formasList,
  onAbrirModalNuevaForma,
  laboratorioId,
  setLaboratorioId,
  categoriaId,
  setCategoriaId,
  laboratorios,
  categorias,
}: ProductoIdentificacionCardProps) {
  return (
    <Card className="p-6 apple-glass space-y-5 rounded-3xl border-border/50 h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#0071e3]/15 text-[#2997ff] flex items-center justify-center shrink-0">
            <Pill className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Identificación Farmacológica</h2>
            <p className="text-[11px] text-muted-foreground">Nombre, principio activo DCI y laboratorio titular</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        {/* Código Interno */}
        <div className="sm:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Código Interno *</label>
            <button
              type="button"
              onClick={onGenerarCodigo}
              className="text-[10px] text-[#0071e3] hover:underline font-mono flex items-center gap-1"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>Generar</span>
            </button>
          </div>
          <Input
            type="text"
            value={codigoInterno}
            onChange={(e) => setCodigoInterno(e.target.value.toUpperCase())}
            placeholder="MED-0001"
            className="h-10 bg-background/60 font-mono text-xs uppercase font-bold text-[#0071e3]"
            required
          />
        </div>

        {/* Nombre Comercial */}
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-medium text-foreground">Nombre Comercial del Medicamento *</label>
          <Input
            type="text"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            placeholder="Ej. Panadol Antigripal / Amoxicilina Forte"
            className="h-10 bg-background/60 text-xs font-semibold"
            required
          />
        </div>

        {/* Principio Activo DCI */}
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Principio Activo (DCI) / Denominación Genérica
          </label>
          <Input
            type="text"
            value={nombreGenerico}
            onChange={(e) => setNombreGenerico(e.target.value)}
            placeholder="Ej. Paracetamol + Clorfenamina Maleato"
            className="h-10 bg-background/60 text-xs"
          />
          <span className="text-[10px] text-muted-foreground">
            Obligatorio según R.M. 040-2010 para reportes de precios OPPF
          </span>
        </div>

        {/* Concentración */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-medium text-foreground">Concentración</label>
          <Input
            type="text"
            value={concentracion}
            onChange={(e) => setConcentracion(e.target.value)}
            placeholder="Ej. 500 mg / 10 ml"
            className="h-10 bg-background/60 text-xs"
          />
        </div>

        {/* Forma Farmacéutica */}
        <div className="sm:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Forma Farmacéutica</span>
            </label>
            <button
              type="button"
              onClick={onAbrirModalNuevaForma}
              className="text-[11px] text-[#0071e3] hover:underline font-semibold flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" />
              <span>Nueva</span>
            </button>
          </div>
          <Select
            value={formaId ? String(formaId) : undefined}
            onValueChange={(val) => setFormaId(Number(val))}
          >
            <SelectTrigger className="h-10 text-xs bg-background/80">
              <SelectValue placeholder="Seleccionar forma..." />
            </SelectTrigger>
            <SelectContent>
              {formasList.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.nombre} {f.abreviatura ? `(${f.abreviatura})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Laboratorio */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Laboratorio / Titular</span>
          </label>
          <Select
            value={laboratorioId || undefined}
            onValueChange={(val) => setLaboratorioId(val)}
          >
            <SelectTrigger className="h-10 text-xs bg-background/80">
              <SelectValue placeholder="Seleccionar laboratorio..." />
            </SelectTrigger>
            <SelectContent>
              {laboratorios.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoría */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Categoría Terapéutica</span>
          </label>
          <Select
            value={categoriaId || undefined}
            onValueChange={(val) => setCategoriaId(val)}
          >
            <SelectTrigger className="h-10 text-xs bg-background/80">
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
