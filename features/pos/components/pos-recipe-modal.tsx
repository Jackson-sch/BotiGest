'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, FileCheck, Stethoscope, User, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { appleSprings } from '@/lib/utils';
import { usePosStore, type RecetaData } from '@/stores/use-pos-store';
import { toast } from 'sonner';

export function PosRecipeModal() {
  const { isRecetaModalOpen, setRecetaModalOpen, receta, setReceta } = usePosStore();

  const [formData, setFormData] = React.useState<RecetaData>({
    medico_cmp: receta?.medico_cmp || '',
    medico_nombre: receta?.medico_nombre || '',
    paciente_nombre: receta?.paciente_nombre || '',
    paciente_documento: receta?.paciente_documento || '',
    numero_receta: receta?.numero_receta || '',
    fecha_emision: receta?.fecha_emision || '',
    retenida: receta?.retenida || false,
    diagnostico_cie10: receta?.diagnostico_cie10 || '',
  });

  React.useEffect(() => {
    if (receta) {
      setFormData(receta);
    } else {
      setFormData((prev) => ({
        ...prev,
        fecha_emision: prev.fecha_emision || new Date().toISOString().split('T')[0],
      }));
    }
  }, [receta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medico_cmp || !formData.paciente_nombre) {
      toast.error('Complete los campos obligatorios: CMP del Médico y Nombre del Paciente.');
      return;
    }
    setReceta(formData);
    toast.success('Receta médica adjuntada al pedido.');
    setRecetaModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isRecetaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con Blur progresivo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setRecetaModalOpen(false)}
          />

          {/* Modal Card con Resorte Apple Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={appleSprings.sheet}
            className="relative w-full max-w-lg bg-white dark:bg-[#161618] rounded-3xl p-6 border border-border shadow-2xl z-10"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#af52de]/15 text-[#af52de] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base tracking-apple-title text-foreground">
                    Registro de Receta Médica
                  </h3>
                  <p className="text-xs text-muted-foreground tracking-apple-body">
                    Normativa Sanitaria DIGEMID (Ley N° 29459)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecetaModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulario de Receta */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>N° CMP del Médico *</span>
                  </label>
                  <Input
                    placeholder="Ej. 65432"
                    value={formData.medico_cmp}
                    onChange={(e) => setFormData({ ...formData, medico_cmp: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nombre del Médico
                  </label>
                  <Input
                    placeholder="Ej. Dr. Juan Mendoza"
                    value={formData.medico_nombre}
                    onChange={(e) => setFormData({ ...formData, medico_nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Nombre del Paciente *</span>
                  </label>
                  <Input
                    placeholder="Nombre y apellido"
                    value={formData.paciente_nombre}
                    onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    DNI / Documento del Paciente
                  </label>
                  <Input
                    placeholder="8 dígitos"
                    maxLength={12}
                    value={formData.paciente_documento}
                    onChange={(e) => setFormData({ ...formData, paciente_documento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>N° de Receta</span>
                  </label>
                  <Input
                    placeholder="Ej. R-2026-0045"
                    value={formData.numero_receta}
                    onChange={(e) => setFormData({ ...formData, numero_receta: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Fecha de Emisión</span>
                  </label>
                  <DatePicker
                    value={formData.fecha_emision}
                    onChange={(val) => setFormData({ ...formData, fecha_emision: val })}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              {/* Checkbox de Receta Retenida */}
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Retener Receta en Establecimiento
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Obligatorio para antibióticos o psicotrópicos sujetos a fiscalización
                  </span>
                </div>
                <Checkbox
                  id="chk-receta-retenida"
                  checked={formData.retenida}
                  onCheckedChange={(checked) => setFormData({ ...formData, retenida: !!checked })}
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRecetaModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl gap-2 font-medium">
                  <FileCheck className="h-4 w-4" />
                  <span>Guardar Receta</span>
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
