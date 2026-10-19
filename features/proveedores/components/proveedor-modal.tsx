'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { appleSprings } from '@/lib/utils';
import { toast } from 'sonner';
import {
  guardarProveedorAction,
  consultarRucProveedorAction,
} from '../actions';
import type { ProveedorItem, ProveedorFormData } from '../types';

interface ProveedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: ProveedorItem | null;
  onSuccess: (proveedor: any) => void;
}

export function ProveedorModal({
  open,
  onOpenChange,
  proveedor,
  onSuccess,
}: ProveedorModalProps) {
  const isEditing = Boolean(proveedor?.id);

  const [formData, setFormData] = React.useState<ProveedorFormData>({
    ruc: '',
    razon_social: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
  });

  const [isSearchingRuc, setIsSearchingRuc] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sunatStatus, setSunatStatus] = React.useState<{
    estado?: string;
    condicion?: string;
  } | null>(null);

  // Inicializar o limpiar formulario al abrir/cambiar proveedor
  React.useEffect(() => {
    if (proveedor) {
      setFormData({
        id: proveedor.id,
        ruc: proveedor.ruc,
        razon_social: proveedor.razon_social,
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        activo: proveedor.activo,
      });
      setSunatStatus(null);
    } else {
      setFormData({
        ruc: '',
        razon_social: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true,
      });
      setSunatStatus(null);
    }
  }, [proveedor, open]);

  const handleConsultarSunat = async () => {
    const rucClean = formData.ruc.trim();
    if (rucClean.length !== 11 || !/^\d+$/.test(rucClean)) {
      toast.error('El RUC debe tener 11 dígitos numéricos.');
      return;
    }

    setIsSearchingRuc(true);
    try {
      const res = await consultarRucProveedorAction(rucClean);
      const anyRes = res as any;
      if (anyRes.success && anyRes.razonSocial) {
        setFormData((prev) => ({
          ...prev,
          razon_social: anyRes.razonSocial || prev.razon_social,
          direccion: anyRes.direccion || prev.direccion,
        }));
        setSunatStatus({
          estado: anyRes.estado,
          condicion: anyRes.condicion,
        });
        toast.success(`Datos obtenidos de SUNAT: ${anyRes.razonSocial}`);
      } else {
        toast.warning(
          anyRes.error || 'No se obtuvieron datos automáticos. Ingrese la razón social manualmente.'
        );
      }
    } catch {
      toast.error('Error al conectarse con el servicio de SUNAT.');
    } finally {
      setIsSearchingRuc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ruc || formData.ruc.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos.');
      return;
    }

    if (!formData.razon_social.trim()) {
      toast.error('La razón social es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await guardarProveedorAction({
        id: formData.id,
        ruc: formData.ruc.trim(),
        razon_social: formData.razon_social.trim(),
        contacto: formData.contacto?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        email: formData.email?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        activo: formData.activo ?? true,
      });

      if (res.success) {
        toast.success(res.message || 'Proveedor guardado correctamente');
        onSuccess(res.data);
        onOpenChange(false);
      } else {
        toast.error(res.error || 'Error al guardar proveedor');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al guardar proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop translúcido Apple */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={appleSprings.snappy}
          className="relative w-full max-w-lg rounded-3xl p-6 border border-border shadow-2xl z-10 bg-white dark:bg-[#161618] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-apple-title text-foreground">
                  {isEditing ? 'Editar Proveedor / Droguería' : 'Nuevo Proveedor Farmacéutico'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registro de distribuidora o droguería autorizada por DIGEMID.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* RUC + Consulta SUNAT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>RUC del Proveedor (SUNAT) *</span>
                {sunatStatus?.estado && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      sunatStatus.estado.toUpperCase() === 'ACTIVO'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {sunatStatus.estado} · {sunatStatus.condicion || 'HABIDO'}
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="20XXXXXXXXX"
                  value={formData.ruc}
                  maxLength={11}
                  disabled={isEditing}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ruc: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConsultarSunat();
                    }
                  }}
                  className="font-mono text-sm h-9 rounded-xl bg-background/80 border-border/60"
                  required
                />
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConsultarSunat}
                    disabled={isSearchingRuc || formData.ruc.length !== 11}
                    className="h-9 px-3 text-xs rounded-xl border-border/60 hover:bg-[#0071e3]/10 hover:border-[#0071e3]/30 hover:text-[#0071e3] gap-1.5 shrink-0 apple-press-feedback"
                  >
                    {isSearchingRuc ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span>Buscar SUNAT</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Razón Social */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Razón Social / Nombre Comercial *
              </label>
              <Input
                placeholder="Ej. Droguería Suiza S.A.C."
                value={formData.razon_social}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, razon_social: e.target.value }))
                }
                className="text-sm h-9 rounded-xl bg-background/80 border-border/60"
                required
              />
            </div>

            {/* Contacto / Vendedor y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>Contacto / Asesor</span>
                </label>
                <Input
                  placeholder="Ej. Lic. Carlos Venta"
                  value={formData.contacto || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contacto: e.target.value }))
                  }
                  className="text-xs h-9 rounded-xl bg-background/80 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <Input
                  placeholder="Ej. 987654321 / 01-4458920"
                  value={formData.telefono || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                  }
                  className="font-mono text-xs h-9 rounded-xl bg-background/80 border-border/60"
                />
              </div>
            </div>

            {/* Email y Dirección */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>Correo de Pedidos</span>
                </label>
                <Input
                  type="email"
                  placeholder="pedidos@drogueria.com"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="text-xs h-9 rounded-xl bg-background/80 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>Dirección Fiscal / Almacén</span>
                </label>
                <Input
                  placeholder="Av. Industrial 123, Lima"
                  value={formData.direccion || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, direccion: e.target.value }))
                  }
                  className="text-xs h-9 rounded-xl bg-background/80 border-border/60"
                />
              </div>
            </div>

            {/* Checkbox Activo */}
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="prov-activo"
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, activo: !!checked }))
                }
              />
              <label htmlFor="prov-activo" className="text-xs text-foreground cursor-pointer select-none">
                Proveedor habilitado para emitir y registrar compras de mercadería
              </label>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 px-3 text-xs rounded-xl border-border/60"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
