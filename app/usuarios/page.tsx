import * as React from 'react';
import { Suspense } from 'react';
import { Users, Shield, Store, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getPersonalUsuarios, getSucursalesYCajas, UsuariosTabs } from '@/features/usuarios';

async function UsuariosContent() {
  const [usuarios, sucursales] = await Promise.all([
    getPersonalUsuarios(),
    getSucursalesYCajas(),
  ]);

  const totalUsuarios = usuarios.length;
  const activosCount = usuarios.filter((u) => u.activo).length;
  const qfCount = usuarios.filter((u) => u.rol === 'director_tecnico').length;
  const totalCajas = sucursales.reduce((acc, s) => acc + s.cajas.length, 0);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Personal Registrado</span>
            <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
              {totalUsuarios}
            </div>
            <span className="text-[11px] text-muted-foreground">{activosCount} cuentas activas</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Dirección Técnica</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {qfCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Químicos con colegiatura CQFP</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Sedes Operativas</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {sucursales.length}
            </div>
            <span className="text-[11px] text-muted-foreground">Locales comerciales activos</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Cajas de Cobro</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {totalCajas}
            </div>
            <span className="text-[11px] text-muted-foreground">Con series electrónicas SUNAT</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <UsuariosTabs usuarios={usuarios} sucursales={sucursales} />
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Personal, Sedes y Cajas
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#0071e3]/10 text-[#2997ff] border border-[#0071e3]/20">
            Administración & Seguridad
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de credenciales de acceso, colegiaturas farmacéuticas CQFP y configuración de terminales de venta.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-24 w-full bg-muted/20 animate-pulse rounded-2xl" />
            <div className="h-96 w-full bg-muted/10 animate-pulse rounded-2xl" />
          </div>
        }
      >
        <UsuariosContent />
      </Suspense>
    </main>
  );
}
