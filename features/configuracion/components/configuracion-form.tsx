'use client';

import * as React from 'react';
import {
  Building2,
  ShieldCheck,
  CalendarClock,
  Printer,
  CheckCircle2,
  Loader2,
  Search,
  Store,
  FileText,
  AlertTriangle,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  actualizarConfiguracionBoticaAction,
  consultarRucEmpresaAction,
} from '../actions';
import type { BoticaConfiguracion } from '../types';
import type { FarmaceuticoOption } from '../queries';

interface ConfiguracionFormProps {
  initialConfig: BoticaConfiguracion;
  farmaceuticos: FarmaceuticoOption[];
}

export function ConfiguracionForm({
  initialConfig,
  farmaceuticos,
}: ConfiguracionFormProps) {
  const [formData, setFormData] = React.useState<BoticaConfiguracion>(initialConfig);
  const [activeTab, setActiveTab] = React.useState<'empresa' | 'digemid' | 'alertas' | 'ticket'>('empresa');
  const [isSearchingRuc, setIsSearchingRuc] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleConsultarSunat = async () => {
    const rucClean = formData.ruc.trim();
    if (rucClean.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos.');
      return;
    }

    setIsSearchingRuc(true);
    try {
      const res = await consultarRucEmpresaAction(rucClean);
      const anyRes = res as any;
      if (anyRes.success && anyRes.razonSocial) {
        setFormData((prev) => ({
          ...prev,
          razon_social: anyRes.razonSocial || prev.razon_social,
          direccion_fiscal: anyRes.direccion || prev.direccion_fiscal,
          ubigeo: anyRes.ubigeo || prev.ubigeo,
        }));
        toast.success(`Datos fiscales verificados con SUNAT: ${anyRes.razonSocial}`);
      } else {
        toast.warning(anyRes.error || 'No se pudo obtener información automática de SUNAT.');
      }
    } catch {
      toast.error('Error al conectarse con el servicio de SUNAT.');
    } finally {
      setIsSearchingRuc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await actualizarConfiguracionBoticaAction({
        tenant_id: formData.tenant_id,
        sucursal_id: formData.sucursal_id,
        ruc: formData.ruc.trim(),
        razon_social: formData.razon_social.trim(),
        nombre_comercial: formData.nombre_comercial.trim(),
        telefono_contacto: formData.telefono_contacto.trim(),
        email_contacto: formData.email_contacto.trim(),
        direccion_fiscal: formData.direccion_fiscal.trim(),
        ubigeo: formData.ubigeo.trim(),

        autorizacion_digemid: formData.autorizacion_digemid.trim(),
        director_tecnico_id: formData.director_tecnico_id || null,
        modo_fefo_estricto: formData.modo_fefo_estricto,

        dias_alerta_preventiva: Number(formData.dias_alerta_preventiva),
        dias_alerta_critica: Number(formData.dias_alerta_critica),

        formato_ticket_termico: formData.formato_ticket_termico,
        mensaje_pie_ticket: formData.mensaje_pie_ticket.trim(),
        max_descuento_cajero_pct: Number(formData.max_descuento_cajero_pct),
        imprimir_qr_sunat: formData.imprimir_qr_sunat,
        igv_pct: Number(formData.igv_pct),
        codigo_establecimiento_sunat: formData.codigo_establecimiento_sunat.trim(),
      });

      if (res.success) {
        toast.success(res.message || 'Configuración guardada exitosamente.');
      } else {
        toast.error(res.error || 'Error al guardar la configuración.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Encabezado con Botón Guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
            Configuración de la Botica
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
            Datos fiscales SUNAT, autorizaciones sanitarias DIGEMID, políticas FEFO y parámetros de emisión.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm gap-1.5 self-start sm:self-auto"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>Guardar Configuración</span>
        </Button>
      </div>

      {/* Tabs de Navegación Estilo Apple */}
      <div className="flex items-center gap-1 p-0.5 h-9 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'empresa'
              ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Datos de la Botica</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('digemid')}
          className={`h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'digemid'
              ? 'bg-white dark:bg-white/10 text-purple-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Normativa DIGEMID</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alertas')}
          className={`h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'alertas'
              ? 'bg-white dark:bg-white/10 text-amber-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Alertas FEFO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ticket')}
          className={`h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'ticket'
              ? 'bg-white dark:bg-white/10 text-emerald-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Tickets & Caja POS</span>
        </button>
      </div>

      {/* Contenido según Pestaña */}
      {/* 1. Datos de Empresa & Fiscal */}
      {activeTab === 'empresa' && (
        <Card className="p-6 apple-glass space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Building2 className="h-5 w-5 text-[#0071e3]" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Identificación Fiscal y Comercial</h2>
              <p className="text-xs text-muted-foreground">Datos que figuran en comprobantes de pago electrónicos y guías SUNAT.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* RUC con consulta SUNAT */}
            <div className="sm:col-span-1 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">RUC del Establecimiento (11 dígitos) *</label>
              <div className="flex gap-2">
                <Input
                  value={formData.ruc}
                  maxLength={11}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ruc: e.target.value.replace(/\D/g, '') }))
                  }
                  className="font-mono text-sm h-9 rounded-xl bg-background border-border/60"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConsultarSunat}
                  disabled={isSearchingRuc || formData.ruc.length !== 11}
                  className="h-9 px-3 text-xs rounded-xl border-border/60 gap-1.5 shrink-0 hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
                >
                  {isSearchingRuc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Validar</span>
                </Button>
              </div>
            </div>

            {/* Razón Social */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Razón Social Registrada en SUNAT *</label>
              <Input
                value={formData.razon_social}
                onChange={(e) => setFormData((prev) => ({ ...prev, razon_social: e.target.value }))}
                className="text-sm h-9 rounded-xl bg-background border-border/60"
                required
              />
            </div>

            {/* Nombre Comercial */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nombre Comercial (Marca Botica) *</label>
              <Input
                value={formData.nombre_comercial}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre_comercial: e.target.value }))}
                className="text-sm h-9 rounded-xl bg-background border-border/60"
                required
              />
            </div>

            {/* Teléfono Comercial */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>Teléfono de Atención / WhatsApp</span>
              </label>
              <Input
                placeholder="Ej. 073-324567 / 987654321"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefono_contacto: e.target.value }))}
                className="text-xs h-9 rounded-xl bg-background border-border/60"
              />
            </div>

            {/* Email Comercial */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>Correo Electrónico de Contacto</span>
              </label>
              <Input
                type="email"
                placeholder="contacto@boticasanmartin.pe"
                value={formData.email_contacto}
                onChange={(e) => setFormData((prev) => ({ ...prev, email_contacto: e.target.value }))}
                className="text-xs h-9 rounded-xl bg-background border-border/60"
              />
            </div>

            {/* Dirección Fiscal Sede Principal */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>Dirección Fiscal del Local Principal *</span>
              </label>
              <Input
                value={formData.direccion_fiscal}
                onChange={(e) => setFormData((prev) => ({ ...prev, direccion_fiscal: e.target.value }))}
                className="text-xs h-9 rounded-xl bg-background border-border/60"
                required
              />
            </div>

            {/* Ubigeo y Código Anexo SUNAT */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Ubigeo (6 dígitos)</label>
                <Input
                  value={formData.ubigeo}
                  maxLength={6}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ubigeo: e.target.value.replace(/\D/g, '') }))}
                  className="font-mono text-xs h-9 rounded-xl bg-background border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Código Anexo SUNAT</label>
                <Input
                  value={formData.codigo_establecimiento_sunat}
                  maxLength={4}
                  onChange={(e) => setFormData((prev) => ({ ...prev, codigo_establecimiento_sunat: e.target.value.replace(/\D/g, '') }))}
                  className="font-mono text-xs h-9 rounded-xl bg-background border-border/60"
                  title="0000 para casa matriz o código asignado por SUNAT"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Regulación Sanitaria DIGEMID */}
      {activeTab === 'digemid' && (
        <Card className="p-6 apple-glass space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <ShieldCheck className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Regulación Sanitaria DIGEMID / DIRIS</h2>
              <p className="text-xs text-muted-foreground">Requisitos de Buenas Prácticas de Dispensación y Almacenamiento (D.S. 014-2011-SA).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Autorización DIGEMID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Código de Autorización Sanitaria de Funcionamiento</label>
              <Input
                placeholder="Ej. AUT-DIRIS-2024-9981 / R.D. 1420-2024"
                value={formData.autorizacion_digemid}
                onChange={(e) => setFormData((prev) => ({ ...prev, autorizacion_digemid: e.target.value }))}
                className="font-mono text-sm h-9 rounded-xl bg-background border-border/60"
              />
              <span className="text-[11px] text-muted-foreground block">
                Emitido por la Autoridad Regional de Medicamentos (DIRIS / DIRESA / GERESA).
              </span>
            </div>

            {/* Director Técnico Asignado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Director Técnico Titular (Químico Farmacéutico)</label>
              <Select
                value={formData.director_tecnico_id || 'ninguno'}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, director_tecnico_id: val === 'ninguno' ? null : val }))
                }
              >
                <SelectTrigger className="h-9 rounded-xl bg-background border-border/60 text-xs">
                  <SelectValue placeholder="Seleccione un Químico Farmacéutico..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ninguno" className="text-xs">
                    Sin Director Técnico asignado
                  </SelectItem>
                  {farmaceuticos.map((qf) => (
                    <SelectItem key={qf.id} value={qf.id} className="text-xs py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{qf.nombre_completo}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                          CQFP: {qf.cqfp}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground block">
                Profesional responsable legalmente de la custodia del Libro de Psicotrópicos y Balances.
              </span>
            </div>

            {/* Política FEFO Estricta */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-3">
              <Checkbox
                id="fefo-estricto"
                checked={formData.modo_fefo_estricto}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, modo_fefo_estricto: checked === true }))
                }
                className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 focus-visible:ring-purple-500"
              />
              <div className="space-y-0.5 select-none">
                <label htmlFor="fefo-estricto" className="text-xs font-semibold text-foreground cursor-pointer">
                  Dispensación FEFO Estricta (First Expire, First Out)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Al activarse, el sistema fuerza al personal a dispensar únicamente el lote más próximo a vencer, impidiendo que el operador elija lotes posteriores sin autorización formal de Dirección Técnica.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Parámetros de Alerta FEFO */}
      {activeTab === 'alertas' && (
        <Card className="p-6 apple-glass space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <CalendarClock className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Alertas Preventivas de Vencimiento Farmacéutico</h2>
              <p className="text-xs text-muted-foreground">Control de semaforización de caducidad para canjes con laboratorios y prevención de mermas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Alerta Preventiva (Amarillo) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Alerta Preventiva (Riesgo Próximo a Vencer)
                </span>
                <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                  {Math.round(formData.dias_alerta_preventiva / 30)} meses
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Días de anticipación para marcar un lote en semáforo amarillo y gestionar rotación prioritaria o canje con la droguería proveedora:
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={30}
                  max={365}
                  value={formData.dias_alerta_preventiva}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dias_alerta_preventiva: Number(e.target.value) }))}
                  className="font-mono text-sm h-9 w-32 rounded-xl bg-background border-border/60"
                  required
                />
                <span className="text-xs text-muted-foreground">días antes de la caducidad (default: 180 días)</span>
              </div>
            </div>

            {/* Alerta Crítica (Rojo) */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Alerta Crítica / Retiro Preventivo
                </span>
                <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-[10px]">
                  {Math.round(formData.dias_alerta_critica / 30)} meses
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Días de anticipación para bloquear o sugerir el pase automático del lote al área de Cuarentena:
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={15}
                  max={180}
                  value={formData.dias_alerta_critica}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dias_alerta_critica: Number(e.target.value) }))}
                  className="font-mono text-sm h-9 w-32 rounded-xl bg-background border-border/60"
                  required
                />
                <span className="text-xs text-muted-foreground">días antes de la caducidad (default: 60 días)</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Ticket Térmico & Caja POS */}
      {activeTab === 'ticket' && (
        <Card className="p-6 apple-glass space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Printer className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Impresión de Tickets Térmicos & Terminal POS</h2>
              <p className="text-xs text-muted-foreground">Ajustes visuales de impresión física en rollo térmico y políticas de cobro en caja.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Formato del Rollo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ancho del Papel Térmico</label>
              <Select
                value={formData.formato_ticket_termico}
                onValueChange={(val: any) => setFormData((prev) => ({ ...prev, formato_ticket_termico: val }))}
              >
                <SelectTrigger className="h-9 rounded-xl bg-background border-border/60 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="80mm" className="text-xs">
                    80 mm (Estándar Punto de Venta / Mayor detalle)
                  </SelectItem>
                  <SelectItem value="58mm" className="text-xs">
                    58 mm (Mini impresora portátil bluetooth / compacto)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descuento máximo a cajeros */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Descuento Máximo Permitido al Cajero (%)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.max_descuento_cajero_pct}
                  onChange={(e) => setFormData((prev) => ({ ...prev, max_descuento_cajero_pct: Number(e.target.value) }))}
                  className="font-mono text-sm h-9 w-28 rounded-xl bg-background border-border/60"
                />
                <span className="text-xs text-muted-foreground">% sin requerir autorización con clave de supervisor</span>
              </div>
            </div>

            {/* Mensaje pie de página */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mensaje al Pie del Ticket Térmico</label>
              <Input
                placeholder="Ej. ¡Gracias por su compra! Revise su vuelto antes de retirarse de caja."
                value={formData.mensaje_pie_ticket}
                onChange={(e) => setFormData((prev) => ({ ...prev, mensaje_pie_ticket: e.target.value }))}
                className="text-xs h-9 rounded-xl bg-background border-border/60"
              />
            </div>

            {/* Imprimir QR SUNAT */}
            <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
              <Checkbox
                id="ticket-qr"
                checked={formData.imprimir_qr_sunat}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, imprimir_qr_sunat: checked === true }))
                }
              />
              <label htmlFor="ticket-qr" className="text-xs text-foreground cursor-pointer select-none">
                Imprimir Código QR de validación SUNAT en comprobantes electrónicos (Boletas y Facturas)
              </label>
            </div>
          </div>
        </Card>
      )}
    </form>
  );
}
