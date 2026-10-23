'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Award,
  ShieldCheck,
  Lock,
  Building2,
  CheckCircle2,
  Save,
  Loader2,
  FileBadge,
  Sparkles,
  Info,
  ArrowLeft,
  KeyRound,
  Fingerprint,
  FileText,
  BadgeCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { actualizarPerfilQFAction } from '@/features/usuarios/actions';
import type { UserSession } from '@/lib/permissions';

const ROLES_INFO: Record<
  string,
  { label: string; badgeClass: string; descripcion: string }
> = {
  propietario: {
    label: 'Propietario / Titular',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    descripcion: 'Control y supervisión integral de sedes, finanzas, inventarios y cumplimiento general.',
  },
  administrador: {
    label: 'Administrador General',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    descripcion: 'Gestión operacional, compras, usuarios, sedes, cajas y reportes contables.',
  },
  director_tecnico: {
    label: 'Director Técnico · Químico Farmacéutico',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    descripcion: 'Custodia reglamentaria, Libro Oficial de Controlados DIGEMID, recetas médicas y farmacovigilancia.',
  },
  cajero: {
    label: 'Cajero / Operador POS',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    descripcion: 'Emisión de comprobantes SUNAT, cobro multimoneda y arqueo de turnos de caja chica.',
  },
  almacenero: {
    label: 'Responsable de Almacén & Lotes',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    descripcion: 'Recepción de mercadería, control de lotes y fechas de vencimiento FEFO, y transferencias.',
  },
  contador: {
    label: 'Contador / Auditor',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    descripcion: 'Auditoría tributaria, reportes electrónicos SUNAT y liquidaciones contables.',
  },
};

interface PerfilQfViewProps {
  initialUser: UserSession;
}

export function PerfilQfView({ initialUser }: PerfilQfViewProps) {
  const router = useRouter();
  const { user: authUser, refresh } = useAuth();
  const currentUser = authUser || initialUser;

  const [nombres, setNombres] = React.useState(currentUser.nombres || '');
  const [apellidos, setApellidos] = React.useState(currentUser.apellidos || '');
  const [dni, setDni] = React.useState(currentUser.dni || '');
  const [cqfp, setCqfp] = React.useState(currentUser.cqfp || '');

  // Manejo de PIN
  const [cambiarPin, setCambiarPin] = React.useState(false);
  const [nuevoPin, setNuevoPin] = React.useState('');
  const [confirmarPin, setConfirmarPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);

  const [isSaving, setIsSaving] = React.useState(false);

  // Sincronizar si cambia el authUser
  React.useEffect(() => {
    if (authUser) {
      setNombres(authUser.nombres || '');
      setApellidos(authUser.apellidos || '');
      setDni(authUser.dni || '');
      setCqfp(authUser.cqfp || '');
    }
  }, [authUser]);

  const initials = nombres
    ? `${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()
    : 'QF';

  const isDirectorTecnico = currentUser.rol === 'director_tecnico';
  const roleConfig = ROLES_INFO[currentUser.rol] || {
    label: currentUser.rol,
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    descripcion: 'Usuario del sistema farmacéutico.',
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombres.trim() || !apellidos.trim()) {
      toast.error('Nombres y apellidos son requeridos.');
      return;
    }

    if (!dni.trim() || dni.trim().length !== 8) {
      toast.error('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    if (isDirectorTecnico && (!cqfp || cqfp.trim().length < 3)) {
      toast.error('La matrícula de Colegiatura CQFP es obligatoria para el Director Técnico.');
      return;
    }

    if (cambiarPin) {
      if (!nuevoPin || nuevoPin.length < 4 || nuevoPin.length > 6) {
        toast.error('El nuevo PIN debe tener entre 4 y 6 dígitos numéricos.');
        return;
      }
      if (nuevoPin !== confirmarPin) {
        toast.error('El PIN de confirmación no coincide.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await actualizarPerfilQFAction({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        dni: dni.trim(),
        cqfp: cqfp.trim() || null,
        nuevoPin: cambiarPin ? nuevoPin : null,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al actualizar el perfil.');
        return;
      }

      toast.success('¡Perfil profesional y matrícula Q.F. guardados exitosamente!');
      setCambiarPin(false);
      setNuevoPin('');
      setConfirmarPin('');
      await refresh();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Barra de Navegación Superior / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 rounded-xl border border-border/60 hover:bg-muted"
          >
            <Link href="/" title="Volver al Panel">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Perfil & Matrícula Q.F.</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Acreditación profesional CQFP, Dirección Técnica y credenciales de acceso farmacéutico.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving}
            className="rounded-xl text-xs gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hero Banner: Identidad Farmacéutica */}
      <div className="bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-xl sm:text-2xl flex items-center justify-center shadow-inner">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-emerald-500 border-2 border-white dark:border-[#161618] flex items-center justify-center text-white shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-foreground">
                {nombres || 'Químico'} {apellidos || 'Farmacéutico'}
              </span>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${roleConfig.badgeClass}`}
              >
                {roleConfig.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>DNI: <strong className="font-mono text-foreground">{dni || '---'}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {currentUser.sucursalNombre || 'Sede Principal'}
              </span>
              <span>·</span>
              <span className="font-medium text-foreground">{currentUser.tenantNombre}</span>
            </p>
          </div>
        </div>

        {/* Badges de Validación Regulatoria */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Award className="h-3.5 w-3.5" />
            <span>{cqfp ? `CQFP ${cqfp}` : 'Colegiatura en Trámite'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>DIGEMID Habilitado</span>
          </div>
        </div>
      </div>

      {/* Formulario Principal de 2 Columnas */}
      <form onSubmit={handleGuardar} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Matrícula CQFP & Sello Regulatorio (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Matrícula & Dirección Técnica */}
          <div className="bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileBadge className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Matrícula Profesional Farmacéutica CQFP
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Acreditación obligatoria según D.S. 014-2011-SA y Ley N° 29459
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                D.S. 014-SA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Número de Colegiatura CQFP</span>
                  {isDirectorTecnico && <span className="text-destructive font-bold">*</span>}
                </label>
                <Input
                  type="text"
                  placeholder="Ej: 14209 o 18452"
                  value={cqfp}
                  onChange={(e) => setCqfp(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono uppercase bg-background border-border/80"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Número de registro en el Colegio Químico Farmacéutico del Perú.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Condición Sanitaria / Regencia
                </label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={
                    isDirectorTecnico
                      ? 'Director Técnico Titular'
                      : currentUser.rol === 'administrador'
                      ? 'Administrador General'
                      : 'Personal Farmacéutico Asistencial'
                  }
                  className="h-10 text-xs rounded-xl bg-muted/40 border-border/60 text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Condición declarada ante la DIRIS / GERESA / DIREMID.
                </span>
              </div>
            </div>

            {/* Sello Oficial Farmacéutico DIGEMID Live Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2.5">
                <span className="flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  <span>Sello Reglamentario Oficial (Vista Previa en Documentos)</span>
                </span>
                <span className="text-[10px] uppercase font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                  DIGEMID VÁLIDO
                </span>
              </div>

              <div className="border-2 border-dashed border-purple-300 dark:border-purple-800/60 rounded-xl p-5 text-center space-y-1 select-none bg-purple-50/30 dark:bg-purple-950/10 relative overflow-hidden">
                <div className="absolute top-2 right-2 text-purple-400/20">
                  <Award className="h-12 w-12" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Colegio Químico Farmacéutico del Perú
                </p>
                <p className="font-extrabold text-sm text-foreground uppercase tracking-wider">
                  Q.F. {nombres || '---'} {apellidos || '---'}
                </p>
                <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  C.Q.F.P. N° {cqfp || 'PENDIENTE'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">
                  Director Técnico · {currentUser.tenantNombre || 'Botica Farmacéutica'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                    Firma Electrónica Autorizada
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                    Libro Controlados DIGEMID
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Este membrete se estampa automáticamente en las hojas del <strong>Libro Oficial de Controlados</strong>, en las copias de recetas médicas retenidas y en los balances psicotrópicos trimestrales.
              </p>
            </div>
          </div>

          {/* Card: Seguridad & PIN de Acceso */}
          <div className="bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    PIN de Seguridad & Despacho
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Código numérico de 4 a 6 dígitos para firmas y autorizaciones rápidas
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCambiarPin(!cambiarPin)}
                className="text-xs rounded-xl font-medium"
              >
                {cambiarPin ? 'Cancelar' : 'Cambiar PIN'}
              </Button>
            </div>

            {cambiarPin ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nuevo PIN Numérico (4 a 6 dígitos)
                    </label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="••••"
                        value={nuevoPin}
                        onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                        className="h-10 text-sm font-mono tracking-widest rounded-xl bg-background border-border/80 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Confirmar Nuevo PIN
                    </label>
                    <Input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      placeholder="••••"
                      value={confirmarPin}
                      onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
                      className="h-10 text-sm font-mono tracking-widest rounded-xl bg-background border-border/80"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <KeyRound className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    El PIN se almacena cifrado con bcrypt (SHA-256). Asegúrese de memorizarlo para no interrumpir el acceso a su terminal de venta ni a las auditorías de caja.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1d] border border-border/60 text-xs text-muted-foreground">
                <Fingerprint className="h-5 w-5 text-primary shrink-0" />
                <p>
                  Su PIN de acceso está actualmente <strong>activo y protegido</strong>. Se utiliza para el inicio de sesión rápido en POS, desbloqueo de pantalla y firma de salidas en el Libro de Psicotrópicos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Datos Personales & Resumen de Cuenta (5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Datos Personales */}
          <div className="bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Datos de Identidad Personal
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Información registrada en planillas y registros de usuario
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nombres <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                  placeholder="Nombres completos"
                  className="h-10 text-xs rounded-xl bg-background border-border/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Apellidos <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                  placeholder="Apellidos completos"
                  className="h-10 text-xs rounded-xl bg-background border-border/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  DNI (Documento Nacional de Identidad) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="8 dígitos numéricos"
                  className="h-10 text-xs rounded-xl font-mono bg-background border-border/80"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Identificador primario para inicio de sesión en BotiGest.
                </span>
              </div>
            </div>
          </div>

          {/* Card: Rol & Privilegios en la Botica */}
          <div className="bg-white dark:bg-[#161618] border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Rol & Atribuciones en el Sistema
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Nivel de acceso configurado por el Administrador
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1f] border border-border/60 space-y-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {roleConfig.label}
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {roleConfig.descripcion}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Establecimiento:</span>
                  <span className="font-semibold text-foreground">{currentUser.tenantNombre}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Sucursal Asignada:</span>
                  <span className="font-semibold text-foreground">{currentUser.sucursalNombre || 'Sede Principal'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Estado de Cuenta:</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activo & Autorizado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Cumplimiento Normativo DIGEMID */}
          <div className="bg-gradient-to-br from-purple-500/5 to-primary/5 dark:from-purple-950/20 dark:to-primary/10 border border-purple-500/20 rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Garantía Regulatoria DIGEMID</span>
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Toda modificación de nombres, matrícula CQFP o DNI queda registrada con firma criptográfica en los logs de auditoría sanitaria conforme a la <strong>Ley General de Salud N° 26842</strong>.
            </p>
          </div>
        </div>

        {/* Barra Inferior de Acción */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-[#161618] border border-border/80 rounded-2xl shadow-sm">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>Al guardar, los cambios se sincronizan en tiempo real con su sesión y sus comprobantes.</span>
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl text-xs"
            >
              <Link href="/">Volver al Panel</Link>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="rounded-xl text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
