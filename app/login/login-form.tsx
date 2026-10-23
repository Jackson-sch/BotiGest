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
  AlertCircle,
  Loader2,
  KeyRound,
  Zap,
  Stethoscope,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { loginAction, loginDirectAction } from './actions';
import { Button } from '@/components/ui/button';

interface DemoUser {
  rolName: string;
  nombre: string;
  dni: string;
  pin: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_USERS: DemoUser[] = [
  {
    rolName: 'Administrador General',
    nombre: 'Admin General',
    dni: '40112233',
    pin: '1234',
    tag: 'Control Total',
    icon: ShieldCheck,
  },
  {
    rolName: 'Director Técnico (Q.F.)',
    nombre: 'Q.F. Alejandro Morales',
    dni: '45667788',
    pin: '1845',
    tag: 'Regulatorio',
    icon: Stethoscope,
  },
  {
    rolName: 'Cajero POS',
    nombre: 'Carlos Rodríguez',
    dni: '70889900',
    pin: '0000',
    tag: 'Ventas & Caja',
    icon: ShoppingCart,
  },
  {
    rolName: 'Almacén & FEFO',
    nombre: 'María García',
    dni: '48223344',
    pin: '1111',
    tag: 'Inventario',
    icon: Package,
  },
];

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [activeTab, setActiveTab] = React.useState<'demo' | 'manual'>('demo');
  const [dni, setDni] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [submittingDni, setSubmittingDni] = React.useState<string | null>(null);

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* ── Tarjeta de Material Translúcido Estilo Apple (Translucent Depth) ── */}
      <div className="relative rounded-3xl border border-white/10 border-t-white/20 bg-[rgba(20,20,22,0.85)] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300">
        
        {/* Cabecera de la Marca */}
        <div className="p-7 pb-5 text-center relative border-b border-white/[0.06]">
          {/* Luz focal interna sutil */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#0071e3]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Icono de Marca */}
          <div className="relative mx-auto mb-3.5 h-13 w-13 rounded-2xl bg-gradient-to-b from-[#0071e3] to-[#0051a8] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,113,227,0.35)] border border-white/20">
            <Pill className="h-6 w-6" />
          </div>

          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#f5f5f7] flex items-center justify-center gap-2">
            <span>BotiGest</span>
            <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-white/[0.08] text-[#a1a1a6] border border-white/[0.08]">
              Farmacia
            </span>
          </h1>
          <p className="text-xs text-[#86868b] mt-1 font-normal">
            Sistema de Gestión Farmacéutica & Control Sanitario
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#a1a1a6] backdrop-blur-md">
            <Building2 className="h-3.5 w-3.5 text-[#2997ff]" />
            <span className="font-medium text-[#f5f5f7]">Botica San Martín</span>
            <span className="text-white/10">·</span>
            <span className="font-mono text-[10px] text-[#86868b]">RUC 20123456789</span>
          </div>
        </div>

        {/* Segmented Control Estilo Apple */}
        <div className="px-7 pt-5 pb-3">
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] grid grid-cols-2 gap-1 backdrop-blur-lg">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-white/10 text-[#f5f5f7] border border-white/10 shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.02]'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-[#2997ff]" />
              <span>Acceso Rápido</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white/10 text-[#f5f5f7] border border-white/10 shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.02]'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 text-[#2997ff]" />
              <span>Ingreso con PIN</span>
            </button>
          </div>
        </div>

        {/* Contenido según Tab */}
        {activeTab === 'demo' ? (
          /* TAB 1: ACCESO RÁPIDO DEMO DIRECTO (1-CLIC) */
          <div className="px-7 pb-6 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between text-xs px-1 text-[#86868b]">
              <span className="text-[11px] font-normal">
                Selecciona tu rol para ingresar directamente:
              </span>
              <span className="text-[10px] text-[#2997ff] font-medium">1-Clic Activo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_USERS.map((user) => (
                <form
                  key={user.dni}
                  action={loginDirectAction}
                  onSubmit={() => setSubmittingDni(user.dni)}
                  className="w-full"
                >
                  <input type="hidden" name="dni" value={user.dni} />
                  <input type="hidden" name="pin" value={user.pin} />
                  <button
                    type="submit"
                    disabled={submittingDni !== null}
                    className="w-full text-left p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 active:scale-[0.98] transition-all duration-150 group cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#2997ff]">
                          <user.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#f5f5f7] text-xs group-hover:text-white transition-colors whitespace-nowrap">
                            {user.rolName}
                          </div>
                          <div className="text-[11px] text-[#86868b] truncate mt-0.5">
                            {user.nombre}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {submittingDni === user.dni ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#2997ff]" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/[0.04] group-hover:bg-[#0071e3] text-[#86868b] group-hover:text-white flex items-center justify-center transition-all">
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 w-full border-t border-white/[0.04] flex items-center justify-between text-[10px] text-[#86868b] font-mono">
                      <span>DNI: {user.dni}</span>
                      <span className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] text-[#a1a1a6] border border-white/[0.08]">
                        {user.tag}
                      </span>
                    </div>
                  </button>
                </form>
              ))}
            </div>

            <p className="text-[11px] text-center text-[#86868b]/70 pt-1">
              Acceso seguro normado con datos de prueba sincronizados.
            </p>
          </div>
        ) : (
          /* TAB 2: INGRESO MANUAL CON CREDENCIALES */
          <form action={formAction} className="px-7 pb-6 space-y-4 animate-in fade-in-50 duration-200">
            {/* Mensaje de error si falla la autenticación */}
            {state?.error && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-[#ff453a] text-xs animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Campo DNI */}
            <div className="space-y-1.5">
              <label
                htmlFor="dni"
                className="text-xs font-medium text-[#f5f5f7] flex items-center justify-between"
              >
                <span>DNI de Usuario (8 dígitos)</span>
                <span className="text-[10px] text-[#86868b] font-normal">Identidad</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#86868b] pointer-events-none" />
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-[#f5f5f7] text-sm font-mono placeholder:text-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#2997ff]/40 focus:border-[#2997ff] transition-all"
                />
              </div>
            </div>

            {/* Campo PIN / Clave */}
            <div className="space-y-1.5">
              <label
                htmlFor="pin"
                className="text-xs font-medium text-[#f5f5f7] flex items-center justify-between"
              >
                <span>PIN o Clave de Turno</span>
                <span className="text-[10px] text-[#86868b] font-normal">Seguridad</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868b] pointer-events-none" />
                <input
                  id="pin"
                  name="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-[#f5f5f7] text-sm font-mono placeholder:text-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#2997ff]/40 focus:border-[#2997ff] transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-3 text-[#86868b] hover:text-[#f5f5f7] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Envío Apple System Blue */}
            <Button
              type="submit"
              variant="default"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0064c8] text-white font-medium text-xs tracking-tight shadow-[0_1px_2px_rgba(0,113,227,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
        )}

        {/* Footer Regulatorio */}
        <div className="px-7 py-3.5 bg-black/30 border-t border-white/[0.06] text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#86868b]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#30d158] shrink-0" />
            <span>Acceso normado bajo Ley 29459 & D.S. 014-2011-SA (DIGEMID)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
