'use client';

import * as React from 'react';
import {
  ShieldCheck,
  ThermometerSnowflake,
  FileCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductoRegulacionCardProps {
  registroSanitario: string;
  setRegistroSanitario: (val: string) => void;
  condicionVenta: 'sin_receta' | 'con_receta' | 'receta_retenida' | 'psicotropico' | 'estupefaciente';
  setCondicionVenta: (val: any) => void;
  unidadBase: string;
  setUnidadBase: (val: string) => void;
  tipoIgv: 'gravado' | 'exonerado' | 'inafecto';
  setTipoIgv: (val: 'gravado' | 'exonerado' | 'inafecto') => void;
  requiereCadenaFrio: boolean;
  setRequiereCadenaFrio: (val: boolean) => void;
  esGenerico: boolean;
  setEsGenerico: (val: boolean) => void;
  esControlado: boolean;
  setEsControlado: (val: boolean) => void;
  costoUltimo: number;
  setCostoUltimo: (val: number) => void;
  activo: boolean;
  setActivo: (val: boolean) => void;
}

export function ProductoRegulacionCard({
  registroSanitario,
  setRegistroSanitario,
  condicionVenta,
  setCondicionVenta,
  unidadBase,
  setUnidadBase,
  tipoIgv,
  setTipoIgv,
  requiereCadenaFrio,
  setRequiereCadenaFrio,
  esGenerico,
  setEsGenerico,
  esControlado,
  setEsControlado,
  costoUltimo,
  setCostoUltimo,
  activo,
  setActivo,
}: ProductoRegulacionCardProps) {
  return (
    <Card className="p-6 apple-glass space-y-5 rounded-3xl border-border/50 h-full">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
        <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Regulación Sanitaria & Tributación</h2>
          <p className="text-[11px] text-muted-foreground">DIGEMID, recetas médicas y fiscalización</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Registro Sanitario */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Registro Sanitario DIGEMID</label>
          <Input
            type="text"
            value={registroSanitario}
            onChange={(e) => setRegistroSanitario(e.target.value)}
            placeholder="Ej. EN-01234"
            className="h-10 bg-background/60 font-mono text-xs uppercase font-semibold"
          />
        </div>

        {/* Condición de Venta */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Condición de Venta *</label>
          <Select
            value={condicionVenta}
            onValueChange={(val) => setCondicionVenta(val)}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Condición de venta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin_receta">Venta Libre (OTC)</SelectItem>
              <SelectItem value="con_receta">Con Receta Simple</SelectItem>
              <SelectItem value="receta_retenida">Receta Retenida</SelectItem>
              <SelectItem value="psicotropico">Psicotrópico (Lista IV B)</SelectItem>
              <SelectItem value="estupefaciente">Estupefaciente (Lista II)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unidad Base */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Unidad Mínima Almacén *</label>
          <Select
            value={unidadBase}
            onValueChange={(val) => setUnidadBase(val)}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Unidad almacén" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNIDAD">UNIDAD (Pastilla / Cápsula)</SelectItem>
              <SelectItem value="TABLETA">TABLETA</SelectItem>
              <SelectItem value="FRASCO">FRASCO</SelectItem>
              <SelectItem value="AMPOLLA">AMPOLLA</SelectItem>
              <SelectItem value="TUBO">TUBO (Crema / Gel)</SelectItem>
              <SelectItem value="SOBRE">SOBRE</SelectItem>
              <SelectItem value="MILILITRO">MILILITRO (ml)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Afectación IGV */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Tipo de IGV</label>
          <Select
            value={tipoIgv}
            onValueChange={(val: any) => setTipoIgv(val)}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Tipo de IGV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gravado">Gravado (18% IGV)</SelectItem>
              <SelectItem value="exonerado">Exonerado de IGV</SelectItem>
              <SelectItem value="inafecto">Inafecto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggles Especiales con Shadcn Checkbox */}
      <div className="space-y-2 pt-1 border-t border-border/40">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Cadena de frío */}
          <label
            htmlFor="chk-cadena-frio"
            className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors select-none"
          >
            <Checkbox
              id="chk-cadena-frio"
              checked={requiereCadenaFrio}
              onCheckedChange={(checked) => setRequiereCadenaFrio(!!checked)}
            />
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <ThermometerSnowflake className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Frío (2°-8°C)</span>
            </div>
          </label>

          {/* Genérico Esencial */}
          <label
            htmlFor="chk-dci-esencial"
            className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors select-none"
          >
            <Checkbox
              id="chk-dci-esencial"
              checked={esGenerico}
              onCheckedChange={(checked) => setEsGenerico(!!checked)}
            />
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <FileCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>DCI Esencial</span>
            </div>
          </label>

          {/* Controlado / Psicotrópico */}
          <label
            htmlFor="chk-fiscalizado"
            className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors select-none"
          >
            <Checkbox
              id="chk-fiscalizado"
              checked={esControlado}
              onCheckedChange={(checked) => setEsControlado(!!checked)}
            />
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Fiscalizado</span>
            </div>
          </label>
        </div>

        {/* Costo Último y Fármaco Activo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Costo Compra Ref. (S/.)</label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs font-bold text-muted-foreground z-10 pointer-events-none select-none">
                S/.
              </span>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={costoUltimo}
                onChange={(e) => setCostoUltimo(Number(e.target.value))}
                placeholder="0.00"
                className="pl-8 h-9 text-xs font-mono font-bold bg-background/80"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label
              htmlFor="chk-farmaco-activo"
              className="flex items-center justify-between w-full h-9 px-3 rounded-xl bg-muted/20 border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors select-none"
            >
              <span className="text-xs font-medium text-foreground">Fármaco Activo</span>
              <Checkbox
                id="chk-farmaco-activo"
                checked={activo}
                onCheckedChange={(checked) => setActivo(!!checked)}
              />
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}
