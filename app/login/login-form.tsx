'use client';

import * as React from 'react';
import { useActionState } from 'react';
import {
  Pill,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';

interface DemoUser {
  rolName: string;
  nombre: string;
  dni: string;
  pin: string;
  cqfp?: string;
  badgeColor: string;
  icon: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    rolName: 'Administrador General',
    nombre: 'Admin General',
    dni: '40112233',
    pin: '1234',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: '👑',
  },
  {
    rolName: 'Director Técnico',
    nombre: 'Q.F. Alejandro Morales',
    dni: '45667788',
    pin: '1845',
    cqfp: 'CQFP 18452',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: '🩺',
  },
  {
    rolName: 'Cajero POS',
    nombre: 'Carlos Rodríguez',
    dni: '70889900',
    pin: '0000',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🛒',
  },
  {
    rolName: 'Almacén & FEFO',
    nombre: 'María García',
    dni: '48223344',
    pin: '1111',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '📦',
  },
];

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [dni, setDni] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);

  const handleSelectDemoUser = (user: DemoUser) => {
    setDni(user.dni);
    setPin(user.pin);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tarjeta de Inicio de Sesión Apple Glass */}
      <div className="rounded-2xl border border-sidebar-border/80 bg-[#121215] shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Cabecera de la Marca */}
        <div className="p-6 pb-4 text-center border-b border-sidebar-border/50">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0051a8] text-white flex items-center justify-center shadow-lg shadow-[#0071e3]/30">
            <Pill className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <span>BotiGest</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              Farmacia
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema de Gestión Farmacéutica & Control Sanitario
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sidebar-accent/80 border border-sidebar-border text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3 text-primary" />
            <span className="font-medium text-foreground">Botica San Martín</span>
            <span>· RUC 20123456789</span>
          </div>
        </div>

        {/* Acceso Rápido / Cuentas de Prueba */}
        <div className="px-6 pt-4 pb-2 bg-sidebar/40 border-b border-sidebar-border/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Acceso Rápido Demo
            </span>
            <span className="text-[10px] text-muted-foreground/60">1-clic para autocompletar</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_USERS.map((user) => (
              <button
                key={user.dni}
                type="button"
                onClick={() => handleSelectDemoUser(user)}
                className={`text-left p-2 rounded-xl border text-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  dni === user.dni
                    ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/40'
                    : 'border-sidebar-border/60 bg-sidebar/50 hover:bg-sidebar-accent'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{user.icon}</span>
                  <div className="truncate">
                    <div className="font-semibold text-foreground truncate text-[11px]">
                      {user.rolName}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">
                      DNI: {user.dni}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario de Acceso */}
        <form action={formAction} className="p-6 space-y-4">
          {/* Mensaje de error si falla la autenticación */}
          {state?.error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Campo DNI */}
          <div className="space-y-1.5">
            <label
              htmlFor="dni"
              className="text-xs font-medium text-foreground flex items-center justify-between"
            >
              <span>DNI de Usuario (8 dígitos)</span>
              <span className="text-[10px] text-muted-foreground">Documento Nacional</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="dni"
                name="dni"
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="40112233"
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-sidebar-border bg-sidebar/50 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Campo PIN / Clave */}
          <div className="space-y-1.5">
            <label
              htmlFor="pin"
              className="text-xs font-medium text-foreground flex items-center justify-between"
            >
              <span>PIN o Clave de Turno</span>
              <span className="text-[10px] text-muted-foreground">Seguridad Farmacéutica</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="pin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full pl-9 pr-10 py-2 rounded-xl border border-sidebar-border bg-sidebar/50 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Envío */}
          <Button
            type="submit"
            disabled={isPending || !dni || !pin}
            className="w-full h-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs tracking-wide shadow-md shadow-primary/20 apple-press-feedback flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <span>Iniciar Turno Farmacéutico</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Regulatorio */}
        <div className="px-6 py-3 bg-sidebar/60 border-t border-sidebar-border/40 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Acceso normado bajo Ley 29459 & D.S. 014-2011-SA (DIGEMID)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
