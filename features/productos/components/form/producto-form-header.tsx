'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductoFormHeaderProps {
  isEditing: boolean;
  nombreComercial: string;
  isSubmitting: boolean;
  onSave: () => void;
}

export function ProductoFormHeader({
  isEditing,
  nombreComercial,
  isSubmitting,
  onSave,
}: ProductoFormHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div className="flex items-center gap-3">
        <Link
          href="/productos"
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/70 bg-sidebar/80 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0 apple-press-feedback"
          title="Volver al catálogo"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {isEditing ? `Editar: ${nombreComercial || 'Fármaco'}` : 'Nuevo Medicamento / Producto'}
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-[10px] bg-[#0071e3]/10 text-[#2997ff] border-[#0071e3]/30"
            >
              {isEditing ? 'Edición Maestro' : 'Alta de Catálogo'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Normativa DIGEMID Ley 29459 · Trazabilidad sanitaria y presentaciones SUNAT
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-center">
        <Button
          asChild
          variant="outline"
          size="sm"
          type="button"
          disabled={isSubmitting}
          className="h-9 rounded-xl text-xs font-medium"
        >
          <Link href="/productos">Cancelar</Link>
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="h-9 px-5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-lg shadow-[#0071e3]/25 apple-press-feedback"
        >
          {isSubmitting ? (
            'Guardando...'
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Fármaco'}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
