'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingDown,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AlertaVencimientoItem } from '../types';

interface AlertasFefoProps {
  alertas: AlertaVencimientoItem[];
  onAccionLote?: (alerta: AlertaVencimientoItem, accion: 'promocion' | 'devolucion' | 'baja') => void;
}

export function AlertasFefo({ alertas, onAccionLote }: AlertasFefoProps) {
  const urgentes = alertas.filter((a) => a.nivel === 'urgente');
  const enAlerta = alertas.filter((a) => a.nivel === 'alerta');
  const preventivos = alertas.filter((a) => a.nivel === 'preventivo');

  return (
    <div className="space-y-6">
      {/* Resumen Superior de Estrategia FEFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-[#ff3b30]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Crítico (&lt; 30 días)</span>
            <Badge variant="destructive">{urgentes.length} lotes</Badge>
          </div>
          <p className="text-xl font-bold font-mono text-foreground mt-2">
            {urgentes.reduce((acc, curr) => acc + curr.cantidad_base, 0)} unidades
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Riesgo inminente: Requiere devolución a droguería o baja inmediata.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#ff9f0a]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Alerta Media (&lt; 60 días)</span>
            <Badge variant="warning">{enAlerta.length} lotes</Badge>
          </div>
          <p className="text-xl font-bold font-mono text-foreground mt-2">
            {enAlerta.reduce((acc, curr) => acc + curr.cantidad_base, 0)} unidades
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Acción recomendada: Promoción de mostrador o descuento autorizado.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#0071e3]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Preventivo (&lt; 90 días)</span>
            <Badge variant="default">{preventivos.length} lotes</Badge>
          </div>
          <p className="text-xl font-bold font-mono text-foreground mt-2">
            {preventivos.reduce((acc, curr) => acc + curr.cantidad_base, 0)} unidades
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Ubicación preferente en el anaquel frontal (despacho FEFO).
          </p>
        </Card>
      </div>

      {/* Lista de Alertas Activas */}
      <Card className="p-5 space-y-4">
        <CardTitle className="text-base">Detalle de Medicamentos Próximos a Vencer</CardTitle>
        <CardDescription>
          El sistema prioriza automáticamente estos lotes al momento de escanear en el POS.
        </CardDescription>

        <div className="divide-y divide-border">
          {alertas.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              ¡Excelente! No hay lotes próximos a vencer en los siguientes 90 días.
            </p>
          ) : (
            alertas.map((a) => (
              <div key={a.lote_id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {a.nombre_comercial}
                    </span>
                    <Badge variant={a.nivel === 'urgente' ? 'destructive' : a.nivel === 'alerta' ? 'warning' : 'default'}>
                      Vence en {a.dias_para_vencer} días
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="font-mono">Lote: {a.numero_lote}</span>
                    <span>·</span>
                    <span>Fecha límite: {a.fecha_vencimiento}</span>
                    <span>·</span>
                    <span className="font-mono font-medium text-foreground">
                      Stock: {a.cantidad_base} {a.unidad_base.toLowerCase()}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAccionLote?.(a, 'promocion')}
                    className="rounded-xl text-xs h-8 gap-1.5 apple-press-feedback hover:border-[#ff9f0a] hover:bg-[#ff9f0a]/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#ff9f0a]" />
                    <span>Lanzar Oferta</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={() => onAccionLote?.(a, 'devolucion')}
                    className="rounded-xl text-xs h-8 gap-1.5 apple-press-feedback hover:border-[#0071e3] hover:bg-[#0071e3]/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#0071e3]" />
                    <span>Devolución</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAccionLote?.(a, 'baja')}
                    className="rounded-xl text-xs h-8 gap-1.5 apple-press-feedback text-rose-400 border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Dar de Baja</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
