'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  X,
  CreditCard,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
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
import { guardarClienteAction } from '../actions';
import { toast } from 'sonner';
import type { Cliente } from '../types';
import type { ClienteFormValues } from '../schemas';

interface ClienteFormModalProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clienteId: string) => void;
}

export function ClienteFormModal({
  cliente,
  open,
  onOpenChange,
  onSuccess,
}: ClienteFormModalProps) {
  const isEditing = Boolean(cliente?.id);

  const [formData, setFormData] = React.useState<ClienteFormValues>({
    id: undefined,
    tipo_documento: 'dni',
    numero_documento: '',
    nombres: '',
    direccion: '',
    telefono: '',
    email: '',
    tiene_credito: false,
    limite_credito: 0,
    dias_credito: 30,
    alergias: '',
    condicion_medica: '',
    notas: '',
    consentimiento_datos: true,
    activo: true,
  });

  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'general' | 'credito' | 'clinico'>('general');

  // Inicializar o limpiar al cambiar cliente u open
  React.useEffect(() => {
    if (cliente) {
      const tipoValido = (['dni', 'ruc', 'ce', 'pasaporte'].includes(cliente.tipo_documento)
        ? cliente.tipo_documento
        : 'dni') as 'dni' | 'ruc' | 'ce' | 'pasaporte';

      setFormData({
        id: cliente.id,
        tipo_documento: tipoValido,
        numero_documento: cliente.numero_documento || '',
        nombres: cliente.nombres || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        tiene_credito: Boolean(cliente.tiene_credito),
        limite_credito: Number(cliente.limite_credito) || 0,
        dias_credito: cliente.dias_credito || 30,
        alergias: cliente.alergias || '',
        condicion_medica: cliente.condicion_medica || '',
        notas: cliente.notas || '',
        consentimiento_datos: cliente.consentimiento_datos ?? true,
        activo: cliente.activo ?? true,
      });
    } else {
      setFormData({
        id: undefined,
        tipo_documento: 'dni',
        numero_documento: '',
        nombres: '',
        direccion: '',
        telefono: '',
        email: '',
        tiene_credito: false,
        limite_credito: 0,
        dias_credito: 30,
        alergias: '',
        condicion_medica: '',
        notas: '',
        consentimiento_datos: true,
        activo: true,
      });
    }
    setActiveTab('general');
  }, [cliente, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await guardarClienteAction(formData);

      if (res.success && res.data) {
        toast.success(res.message);
        onSuccess?.(res.data.id);
        onOpenChange(false);
      } else {
        toast.error(res.message || 'Error al guardar cliente.');
        if (res.errors) {
          const firstErr = Object.values(res.errors)[0]?.[0];
          if (firstErr) toast.error(firstErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error inesperado al procesar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={appleSprings.sheet}
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-apple-title text-foreground">
                  {isEditing ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Información de identidad, línea de crédito y notas farmacéuticas
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Segmented Control Tabs */}
            <div className="grid grid-cols-3 w-full rounded-2xl p-1 bg-muted/40 border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'general'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Datos Generales</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credito')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'credito'
                    ? 'bg-background shadow-xs text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Cuenta Corriente</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'clinico'
                    ? 'bg-background shadow-xs text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Notas Clínicas</span>
              </button>
            </div>

            {/* TAB 1: DATOS GENERALES */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Tipo de Documento *
                    </label>
                    <Select
                      value={formData.tipo_documento}
                      onValueChange={(val: 'dni' | 'ruc' | 'ce' | 'pasaporte') =>
                        setFormData((prev) => ({ ...prev, tipo_documento: val }))
                      }
                    >
                      <SelectTrigger className="rounded-xl h-10 text-xs">
                        <SelectValue placeholder="Tipo Doc." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dni">DNI (8 dígitos)</SelectItem>
                        <SelectItem value="ruc">RUC (11 dígitos)</SelectItem>
                        <SelectItem value="ce">Carné de Extranjería</SelectItem>
                        <SelectItem value="pasaporte">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Número de Documento *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.numero_documento}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, numero_documento: e.target.value.trim() }))
                      }
                      placeholder={formData.tipo_documento === 'dni' ? '8 dígitos' : '11 dígitos'}
                      className="rounded-xl h-10 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {formData.tipo_documento === 'ruc' ? 'Razón Social *' : 'Nombres y Apellidos *'}
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nombres: e.target.value.toUpperCase() }))
                    }
                    placeholder="Ej. JUAN PÉREZ QUISPE / CLÍNICA DEL NORTE S.A.C."
                    className="rounded-xl h-10 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Teléfono / WhatsApp
                    </label>
                    <Input
                      type="tel"
                      value={formData.telefono || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                      }
                      placeholder="Ej. 987654321"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Correo Electrónico
                    </label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="cliente@ejemplo.com"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Dirección Domiciliaria / Fiscal
                  </label>
                  <Input
                    type="text"
                    value={formData.direccion || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, direccion: e.target.value }))
                    }
                    placeholder="Av. Grau 123, Piura"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                {/* Protección de Datos */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentimiento_datos"
                    checked={formData.consentimiento_datos}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        consentimiento_datos: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="consentimiento_datos" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    <span className="font-semibold text-foreground">
                      Consentimiento de Datos Personales (Ley N° 29733):
                    </span>{' '}
                    El cliente autoriza el tratamiento de sus datos de contacto para emisión de comprobantes SUNAT, seguimiento farmacéutico y notificaciones de saldo.
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: CUENTA CORRIENTE & CRÉDITO */}
            {activeTab === 'credito' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Habilitar Línea de Crédito / Fiado
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Permite despachar ventas al crédito y generar cargos a cuenta corriente
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tiene_credito}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, tiene_credito: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {formData.tiene_credito && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Límite de Crédito (S/.) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-xs">
                            S/.
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.limite_credito || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                limite_credito: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="Ej. 1000.00"
                            className="pl-9 rounded-xl h-10 font-mono text-xs font-bold"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Monto máximo acumulable en deuda antes de bloquear nuevas ventas al crédito
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Plazo de Crédito (Días) *
                        </label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          max="365"
                          required
                          value={formData.dias_credito || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              dias_credito: parseInt(e.target.value, 10) || 30,
                            }))
                          }
                          placeholder="30"
                          className="rounded-xl h-10 text-xs font-medium"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Días otorgados para el vencimiento y cobro del comprobante
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>
                        El cajero recibirá una alerta en el POS si el cliente intenta superar el límite de S/ {Number(formData.limite_credito).toFixed(2)}.
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB 3: NOTAS CLÍNICAS */}
            {activeTab === 'clinico' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4 text-rose-500" />
                    Alergias a Medicamentos (Farmacovigilancia)
                  </label>
                  <Input
                    type="text"
                    value={formData.alergias || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, alergias: e.target.value }))
                    }
                    placeholder="Ej. Alérgico a Penicilina, AINEs (Ibuprofeno), Sulfas..."
                    className="rounded-xl h-10 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Esta alerta se mostrará en pantalla al cajero al despachar estos fármacos en el POS.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Condiciones Médicas Crónicas
                  </label>
                  <Input
                    type="text"
                    value={formData.condicion_medica || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, condicion_medica: e.target.value }))
                    }
                    placeholder="Ej. Hipertensión arterial, Diabetes Tipo 2, Insuficiencia Renal..."
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Notas Farmacéuticas y de Atención
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notas || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notas: e.target.value }))
                    }
                    placeholder="Instrucciones especiales de despacho, horario preferido de llamada, etc."
                    className="w-full rounded-2xl border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                {/* Toggle de Cliente Activo */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Estado del Cliente
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Los clientes inactivos no aparecen en las búsquedas rápidas del POS
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, activo: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold shadow-sm apple-press-feedback"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
