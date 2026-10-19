import * as React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EstadoSunat } from '@/types/database';

interface SunatBadgeProps {
  estado: EstadoSunat;
}

export function SunatBadge({ estado }: SunatBadgeProps) {
  switch (estado) {
    case 'aceptado':
      return (
        <Badge variant="success" className="gap-1 text-[11px]">
          <CheckCircle2 className="h-3 w-3" />
          <span>Aceptado SUNAT</span>
        </Badge>
      );
    case 'pendiente':
      return (
        <Badge variant="warning" className="gap-1 text-[11px]">
          <Clock className="h-3 w-3" />
          <span>Pendiente Envío</span>
        </Badge>
      );
    case 'enviado':
      return (
        <Badge variant="default" className="gap-1 text-[11px]">
          <Clock className="h-3 w-3 animate-spin" />
          <span>Procesando</span>
        </Badge>
      );
    case 'rechazado':
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <XCircle className="h-3 w-3" />
          <span>Rechazado</span>
        </Badge>
      );
    case 'anulado':
      return (
        <Badge variant="secondary" className="gap-1 text-[11px]">
          <RotateCcw className="h-3 w-3" />
          <span>Anulado (NC)</span>
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <AlertCircle className="h-3 w-3" />
          <span>Error API</span>
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}
