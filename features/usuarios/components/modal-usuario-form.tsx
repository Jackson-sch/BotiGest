'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  Shield,
  KeyRound,
  Building,
  CheckCircle2,
  Award,
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

import { guardarUsuarioAction } from '../actions';
import type { PerfilUsuarioItem, SucursalItem } from '../types';
import type { UserRole } from '@/lib/permissions';

interface ModalUsuarioFormProps {
  usuario: PerfilUsuarioItem | null;
  sucursales: SucursalItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ROLES_INFO: { id: UserRole; label: string; desc: string }[] = [
  { id: 'cajero', label: 'Cajero / Despachador', desc: 'Atención en POS, cobros y cuadre de caja' },
  { id: 'director_tecnico', label: 'Director Técnico (Q.F.)', desc: 'Firma de controlados, recetas, mermas (exige CQFP)' },
  { id: 'almacenero', label: 'Encargado de Almacén', desc: 'Recepción de compras, control de lotes y kardex' },
  { id: 'administrador', label: 'Administrador General', desc: 'Gestión total del negocio y supervisión de ventas' },
  { id: 'contador', label: 'Contador / Auditor', desc: 'Acceso a ventas, compras y reportes fiscales' },
];

export function ModalUsuarioForm({
  usuario,
  sucursales,
  isOpen,
  onClose,
  onSuccess,
}: ModalUsuarioFormProps) {
  const isEditing = !!usuario;

  const [nombres, setNombres] = React.useState('');
  const [apellidos, setApellidos] = React.useState('');
  const [dni, setDni] = React.useState('');
  const [cqfp, setCqfp] = React.useState('');
  const [rol, setRol] = React.useState<UserRole>('cajero');
  const [pin, setPin] = React.useState('');
  const [sucursalId, setSucursalId] = React.useState('');
  const [activo, setActivo] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setNombres(usuario.nombres);
        setApellidos(usuario.apellidos);
        setDni(usuario.dni);
        setCqfp(usuario.cqfp || '');
        setRol(usuario.rol);
        setPin(''); // Vacío si no se desea cambiar
        setSucursalId(usuario.sucursal_id || sucursales[0]?.id || '');
        setActivo(usuario.activo);
      } else {
        setNombres('');
        setApellidos('');
        setDni('');
        setCqfp('');
        setRol('cajero');
        setPin('1234');
        setSucursalId(sucursales[0]?.id || '');
        setActivo(true);
      }
    }
  }, [isOpen, usuario, sucursales]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) {
      toast.error('Nombres y apellidos son requeridos');
      return;
    }
    if (dni.trim().length !== 8) {
      toast.error('El DNI debe tener exactamente 8 dígitos');
      return;
    }
    if (rol === 'director_tecnico' && (!cqfp || cqfp.trim().length === 0)) {
      toast.error('El número de Colegiatura CQFP es obligatorio para el Director Técnico');
      return;
    }
    if (!isEditing && (!pin || pin.trim().length < 4)) {
      toast.error('Debe asignar un PIN numérico de acceso (mínimo 4 dígitos)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await guardarUsuarioAction({
        id: usuario?.id,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        dni: dni.trim(),
        cqfp: cqfp.trim() || null,
        rol,
        pin: pin.trim() ? pin.trim() : null,
        sucursal_id: sucursalId || null,
        activo,
      });

      if (!res.success) {
        toast.error(res.error || 'No se pudo guardar el usuario.');
        return;
      }

      toast.success(
        isEditing
          ? `Usuario ${nombres} ${apellidos} actualizado.`
          : `Usuario ${nombres} ${apellidos} creado exitosamente.`
      );
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
          className="relative w-full max-w-lg bg-white dark:bg-[#161618] border border-border shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/15 border border-[#0071e3]/30 flex items-center justify-center text-[#2997ff]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isEditing ? 'Editar Perfil de Personal' : 'Nuevo Colaborador'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Credenciales, rol farmacéutico y asignación de sede
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Nombres *</label>
                <Input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan Carlos"
                  className="h-9 bg-background/60 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Apellidos *</label>
                <Input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Morales Pérez"
                  className="h-9 bg-background/60 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">DNI (8 dígitos) *</label>
                <Input
                  type="text"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="40112233"
                  className="h-9 bg-background/60 font-mono text-xs font-semibold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-amber-400" />
                  PIN {isEditing ? '(Dejar vacío para mantener)' : '*'}
                </label>
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={isEditing ? '••••' : 'Ej. 1234'}
                  className="h-9 bg-background/60 font-mono text-xs"
                  required={!isEditing}
                />
              </div>
            </div>

            {/* Rol Farmacéutico */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#2997ff]" />
                Rol y Nivel de Acceso:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES_INFO.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRol(r.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      rol === r.id
                        ? 'bg-[#0071e3]/15 border-[#0071e3]/50 text-[#2997ff] ring-1 ring-[#0071e3]/30'
                        : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span className="font-semibold block text-[11px] text-foreground">{r.label}</span>
                    <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CQFP (Visible y obligatorio si es Director Técnico) */}
            {rol === 'director_tecnico' && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                <label className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-purple-400" />
                  Colegio Químico Farmacéutico del Perú (CQFP) *
                </label>
                <Input
                  type="text"
                  value={cqfp}
                  onChange={(e) => setCqfp(e.target.value)}
                  placeholder="Ej. CQFP 18452"
                  className="h-9 bg-background/80 font-mono text-xs font-semibold uppercase text-purple-200 border-purple-500/40"
                  required
                />
                <p className="text-[10px] text-purple-300/80">
                  Obligatorio por Ley N° 29459 para firmar y validar el Libro Oficial de Controlados DIGEMID.
                </p>
              </div>
            )}

            {/* Sede Asignada */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Sede / Sucursal Principal:
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
                className="h-9 px-5 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-lg shadow-[#0071e3]/25"
              >
                {isSubmitting ? (
                  'Guardando...'
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {isEditing ? 'Guardar Cambios' : 'Registrar Colaborador'}
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
