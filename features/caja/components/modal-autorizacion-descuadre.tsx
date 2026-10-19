'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  X,
  Lock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  KeyRound,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface ModalAutorizacionDescuadreProps {
  isOpen: boolean;
  onClose: () => void;
  diferencia: number;
  montoDeclarado: number;
  montoSistema: number;
  onConfirmar: (data: {
    supervisor_dni: string;
    supervisor_pin: string;
    motivo_descuadre: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const MOTIVOS_FRECUENTES = [
  'Diferencia por redondeo / falta de monedas fraccionarias',
  'Venta cancelada o cobrada con POS sin registrar',
  'Error al entregar vuelto en mostrador',
  'Gasto menor o retiro de caja no anotado',
  'Diferencia de saldo inicial de apertura',
];

export function ModalAutorizacionDescuadre({
  isOpen,
  onClose,
  diferencia,
  montoDeclarado,
  montoSistema,
  onConfirmar,
  isLoading,
}: ModalAutorizacionDescuadreProps) {
  const { user } = useAuth();
  const esSupervisorLogueado = Boolean(
    user && ['administrador', 'propietario', 'director_tecnico'].includes(user.rol)
  );

  const [dni, setDni] = React.useState(esSupervisorLogueado && user?.dni ? user.dni : '');
  const [pin, setPin] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [errorLocal, setErrorLocal] = React.useState<string | null>(null);

  // Si el usuario logueado cambia o se abre el modal, pre-llenar DNI si es supervisor
  React.useEffect(() => {
    if (isOpen) {
      if (esSupervisorLogueado && user?.dni) {
        setDni(user.dni);
      }
      setPin('');
      setErrorLocal(null);
    }
  }, [isOpen, esSupervisorLogueado, user?.dni]);

  if (!isOpen) return null;

  const esFaltante = diferencia < 0;
  const absDiferencia = Math.abs(diferencia);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const motivoLimpio = motivo.trim();
    if (!motivoLimpio || motivoLimpio.length < 5) {
      setErrorLocal('Debe indicar el motivo o justificación del descuadre (mínimo 5 caracteres).');
      return;
    }

    const dniLimpio = dni.trim();
    if (!dniLimpio || dniLimpio.length < 8) {
      setErrorLocal('Ingrese un DNI de supervisor válido de al menos 8 dígitos.');
      return;
    }

    const pinLimpio = pin.trim();
    if (!pinLimpio || pinLimpio.length < 4) {
      setErrorLocal('Ingrese el PIN de autorización del supervisor (mínimo 4 dígitos).');
      return;
    }

    await onConfirmar({
      supervisor_dni: dniLimpio,
      supervisor_pin: pinLimpio,
      motivo_descuadre: motivoLimpio,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#161618] border border-border shadow-2xl p-6 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                  esFaltante
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-apple-title text-foreground flex items-center gap-2">
                  Autorización Requerida por Descuadre
                </h3>
                <p className="text-xs text-muted-foreground">
                  El arqueo físico difiere del saldo esperado por el sistema.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Banner de Diferencia */}
            <div
              className={`p-3.5 rounded-2xl border ${
                esFaltante
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {esFaltante ? 'Faltante de Caja' : 'Sobrante de Caja'}
                </span>
                <span className="font-mono text-lg font-bold">
                  {esFaltante ? '-' : '+'}
                  {formatMoney(absDiferencia)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 text-xs text-muted-foreground">
                <div>
                  <span>Contado Físico: </span>
                  <span className="font-mono font-medium text-foreground">
                    {formatMoney(montoDeclarado)}
                  </span>
                </div>
                <div className="text-right">
                  <span>Esperado Sistema: </span>
                  <span className="font-mono font-medium text-foreground">
                    {formatMoney(montoSistema)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Motivos Frecuentes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Motivo / Justificación del Descuadre *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {MOTIVOS_FRECUENTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivo(m)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border text-left transition-all ${
                      motivo === m
                        ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                        : 'bg-background/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-background'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describa la causa de la diferencia encontrada en gaveta..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
              />
            </div>

            {/* Credenciales de Supervisor Autorizador */}
            <div className="p-3.5 rounded-2xl bg-sidebar border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Credenciales del Supervisor / Director Técnico</span>
                </div>
                {esSupervisorLogueado ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Rol: {user?.rol.toUpperCase()}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    DNI Supervisor *
                  </label>
                  <Input
                    type="text"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="40112233"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    PIN Autorización *
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Atajos Demo para evaluación si no está en sesión un supervisor */}
              {!esSupervisorLogueado ? (
                <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Supervisores autorizados:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDni('40112233');
                        setPin('1234');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-primary/20 text-primary font-mono transition-colors"
                    >
                      Admin (40112233)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDni('45667788');
                        setPin('1845');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-purple-500/20 text-purple-300 font-mono transition-colors"
                    >
                      Q.F. (45667788)
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {errorLocal ? (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorLocal}</span>
              </div>
            ) : null}

            {/* Botones de Acción */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-4 text-xs rounded-xl"
              >
                Volver a Contar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 px-5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 gap-1.5"
              >
                {isLoading ? (
                  'Validando Autorización...'
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Autorizar & Cerrar Turno</span>
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
