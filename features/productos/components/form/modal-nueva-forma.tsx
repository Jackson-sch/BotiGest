'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ModalNuevaFormaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  nombre: string;
  setNombre: (val: string) => void;
  abreviatura: string;
  setAbreviatura: (val: string) => void;
  isSubmitting: boolean;
}

export function ModalNuevaForma({
  isOpen,
  onClose,
  onSubmit,
  nombre,
  setNombre,
  abreviatura,
  setAbreviatura,
  isSubmitting,
}: ModalNuevaFormaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#161618] border border-border p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground">Nueva Forma Farmacéutica</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Nombre de la Forma *</label>
            <Input
              type="text"
              required
              placeholder="Ej. Parche Transdérmico, Elíxir..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9 text-xs"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Abreviatura (Opcional)</label>
            <Input
              type="text"
              placeholder="Ej. PARC, ELIX..."
              value={abreviatura}
              onChange={(e) => setAbreviatura(e.target.value)}
              className="h-9 text-xs uppercase"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !nombre.trim()}
              className="rounded-xl text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold apple-press-feedback"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Forma'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
