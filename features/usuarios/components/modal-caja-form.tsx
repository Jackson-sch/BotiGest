'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  X,
  Receipt,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';

import { guardarCajaAction } from '../actions';
import type { SucursalItem } from '../types';

interface ModalCajaFormProps {
  sucursales: SucursalItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalCajaForm({
  sucursales,
  isOpen,
  onClose,
  onSuccess,
}: ModalCajaFormProps) {
  const [sucursalId, setSucursalId] = React.useState('');
  const [nombre, setNombre] = React.useState('');
  const [serieBoleta, setSerieBoleta] = React.useState('B002');
  const [serieFactura, setSerieFactura] = React.useState('F002');
  const [serieNota, setSerieNota] = React.useState('NV02');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSucursalId(sucursales[0]?.id || '');
      setNombre('Caja 2');
      setSerieBoleta('B002');
      setSerieFactura('F002');
      setSerieNota('NV02');
    }
  }, [isOpen, sucursales]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre de la caja es obligatorio');
      return;
    }
    if (!sucursalId) {
      toast.error('Seleccione una sucursal');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await guardarCajaAction({
        sucursal_id: sucursalId,
        nombre: nombre.trim(),
        serie_boleta: serieBoleta.trim().toUpperCase(),
        serie_factura: serieFactura.trim().toUpperCase(),
        serie_nota: serieNota.trim().toUpperCase(),
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo crear la caja.');
        return;
      }

      toast.success(`Terminal "${nombre}" y series SUNAT creadas con éxito.`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-md bg-white dark:bg-[#161618] border border-border shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Nuevo Terminal de Caja
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configuración de caja física y correlativos SUNAT
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Sucursal / Sede *
              </label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Seleccionar sucursal..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} ({s.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Nombre de la Caja *</label>
              <Input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Caja 2 - Mostrador"
                className="h-9 bg-background/60 text-xs font-semibold"
                required
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Series de Comprobantes SUNAT (4 caracteres)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Boleta</label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={serieBoleta}
                    onChange={(e) => setSerieBoleta(e.target.value.toUpperCase())}
                    className="h-8 bg-background font-mono text-xs font-bold uppercase text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Factura</label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={serieFactura}
                    onChange={(e) => setSerieFactura(e.target.value.toUpperCase())}
                    className="h-8 bg-background font-mono text-xs font-bold uppercase text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Nota Venta</label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={serieNota}
                    onChange={(e) => setSerieNota(e.target.value.toUpperCase())}
                    className="h-8 bg-background font-mono text-xs font-bold uppercase text-center"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="h-9 px-5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  'Creando...'
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Crear Terminal
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
