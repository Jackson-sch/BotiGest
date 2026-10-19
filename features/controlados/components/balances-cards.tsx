'use client';

import * as React from 'react';
import { ShieldCheck, AlertCircle, Clock, Pill } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BalanceSustanciaControlada } from '../types';

interface BalancesCardsProps {
  balances: BalanceSustanciaControlada[];
}

export function BalancesCards({ balances }: BalancesCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {balances.map((b) => (
        <Card
          key={b.producto_id}
          className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-[#af52de]"
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-xs text-foreground tracking-apple-title">
                {b.nombre_comercial}
              </span>
              <Badge variant={b.condicion === 'estupefaciente' ? 'destructive' : 'purple'}>
                {b.condicion === 'estupefaciente' ? 'Estupefaciente' : 'Psicotrópico'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {b.codigo_interno} · {b.concentracion}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-end justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Saldo Físico Permanente
              </span>
              <div className="text-2xl font-bold font-mono text-foreground">
                {b.saldo_actual_base}{' '}
                <span className="text-xs font-normal text-muted-foreground lowercase">
                  {b.unidad_base}s
                </span>
              </div>
            </div>

            {b.asientos_pendientes_firma > 0 ? (
              <Badge variant="warning" className="text-[10px]">
                {b.asientos_pendientes_firma} pendientes QF
              </Badge>
            ) : (
              <Badge variant="success" className="text-[10px]">
                Al día
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
