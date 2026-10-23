import { Metadata } from 'next';
import {
  ShieldCheck,
  ThermometerSnowflake,
  Receipt,
  Boxes,
  Lock,
} from 'lucide-react';
import { LoginForm } from './login-form';
import { BotiGestLogo } from '@/components/ui/botigest-logo';

export const metadata: Metadata = {
  title: 'Iniciar Sesión · BotiGest',
  description: 'Acceso seguro al sistema farmacéutico BotiGest',
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-[#f5f5f7] flex flex-col justify-between overflow-hidden selection:bg-[#0071e3]/30 selection:text-white">
      {/* ── Apple Ambient Illumination (Restrained, Monochromatic & Depth-Focused) ── */}
      {/* Foco de luz cenital sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,113,227,0.12),transparent_75%)] pointer-events-none" />
      
      {/* Difuminado de profundidad inferior */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(41,151,255,0.06),transparent_70%)] pointer-events-none" />

      {/* ── Barra Superior Ambiental Estilo Apple ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <BotiGestLogo size="md" showTagline={true} />

        {/* Badges de Estado Regulatorio Oficial */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#a1a1a6] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[#30d158] shadow-[0_0_8px_rgba(48,209,88,0.6)]" />
            <span className="text-[#f5f5f7] font-medium">SUNAT OSE</span>
            <span className="text-[#86868b]">· En Línea</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#a1a1a6] backdrop-blur-xl">
            <ShieldCheck className="h-3.5 w-3.5 text-[#30d158]" />
            <span className="text-[#f5f5f7] font-medium hidden sm:inline">DIGEMID</span>
            <span className="font-mono text-[10px] text-[#86868b]">D.S. 014-2011-SA</span>
          </div>
        </div>
      </header>

      {/* ── Escenario Principal: Hero + Apple Glass Login ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 lg:py-10 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Columna Izquierda: Tipografía Apple & Pilares Sanitarios */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-7 text-left hidden lg:block">
            {/* Pill de Categoría */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#a1a1a6] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2997ff]" />
              <span className="tracking-tight">Plataforma Farmacéutica Integral</span>
            </div>

            {/* Titular Estilo Apple (Contraste Blanco / Gris) */}
            <div className="space-y-3.5">
              <h2 className="text-4xl xl:text-5xl font-semibold tracking-[-0.03em] text-[#f5f5f7] leading-[1.12]">
                Control farmacéutico integral,{' '}
                <span className="text-[#86868b] font-normal">
                  en tiempo real.
                </span>
              </h2>
              <p className="text-sm xl:text-[15px] text-[#a1a1a6] leading-relaxed max-w-xl">
                Diseñado exclusivamente para el sector farmacéutico. Despacho automatizado bajo algoritmo FEFO, libro de recetas controladas DIGEMID y facturación electrónica instantánea.
              </p>
            </div>

            {/* 3 Bloques de Pilares (Material Translúcido Neutro) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-2 hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors">
                <div className="h-8 w-8 rounded-xl bg-white/[0.06] text-[#2997ff] flex items-center justify-center">
                  <Boxes className="h-4 w-4" />
                </div>
                <div className="font-medium text-xs text-[#f5f5f7]">Algoritmo FEFO</div>
                <p className="text-[11px] text-[#86868b] leading-snug">
                  Priorización automática de lotes según fecha de vencimiento.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-2 hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors">
                <div className="h-8 w-8 rounded-xl bg-white/[0.06] text-[#30d158] flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="font-medium text-xs text-[#f5f5f7]">Facturación SUNAT</div>
                <p className="text-[11px] text-[#86868b] leading-snug">
                  Emisión en 2 segundos de Boletas, Facturas y Notas electrónicas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-2 hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors">
                <div className="h-8 w-8 rounded-xl bg-white/[0.06] text-[#2997ff] flex items-center justify-center">
                  <ThermometerSnowflake className="h-4 w-4" />
                </div>
                <div className="font-medium text-xs text-[#f5f5f7]">Cadena de Frío</div>
                <p className="text-[11px] text-[#86868b] leading-snug">
                  Sensor permanente para termolábiles (óptimo 2°C a 8°C).
                </p>
              </div>
            </div>

            {/* Metadatos de la Sede Activa */}
            <div className="pt-2 flex items-center gap-4 text-xs text-[#86868b]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
                <span className="font-medium text-[#f5f5f7]">Botica San Martín</span>
                <span>(Sede Principal · Av. Grau)</span>
              </div>
              <span className="text-white/10">·</span>
              <div className="font-mono text-[11px] text-[#86868b]">
                Turno: <span className="text-[#f5f5f7]">Continuo</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Acceso Farmacéutico */}
          <div className="lg:col-span-6 xl:col-span-5 w-full flex justify-center">
            <LoginForm />
          </div>

        </div>
      </main>

      {/* ── Pie de Página (Sobrio & Minimalista) ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 pb-12 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86868b] border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span>© 2026 BotiGest</span>
          <span>·</span>
          <span>Sistema de Gestión Farmacéutica</span>
        </div>

        <div className="flex items-center gap-3 text-[#86868b]">
          <span>Normativa Sanitaria Ley 29459</span>
          <span>·</span>
          <span className="font-mono text-[#a1a1a6]">Cifrado HMAC SHA-256</span>
        </div>
      </footer>
    </div>
  );
}
