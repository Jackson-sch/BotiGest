import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { ROUTE_PERMISSIONS, getDefaultRouteForRole } from '@/lib/permissions';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Acceso Restringido · BotiGest',
  description: 'Módulo restringido por rol de usuario y normativa farmacéutica',
};

export default async function SinAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ ruta?: string }>;
}) {
  const { ruta } = await searchParams;
  const user = await getCurrentUser();

  const routeInfo = ruta ? ROUTE_PERMISSIONS[ruta] : null;
  const defaultRoute = getDefaultRouteForRole(user?.rol);

  const roleLabels: Record<string, string> = {
    propietario: 'Propietario de Botica',
    administrador: 'Administrador General',
    director_tecnico: 'Director Técnico (Químico Farmacéutico)',
    cajero: 'Cajero POS',
    almacenero: 'Responsable de Almacén',
    contador: 'Contador',
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-8 shadow-xl text-center space-y-6">
        {/* Icono de Seguridad / Restricción */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
            <Lock className="h-3 w-3" />
            <span>Permiso Insuficiente</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Módulo Restringido para su Perfil
          </h1>

          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {routeInfo?.motivo ||
              'No cuenta con las atribuciones o el rol farmacéutico necesario para ingresar a este módulo operativo.'}
          </p>
        </div>

        {/* Detalle del Usuario y Ruta */}
        <div className="rounded-xl border border-sidebar-border bg-sidebar/50 p-4 text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-sidebar-border/50">
            <span className="text-muted-foreground">Módulo solicitado:</span>
            <span className="font-semibold text-foreground">{routeInfo?.label || ruta || '/'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-sidebar-border/50">
            <span className="text-muted-foreground">Su rol actual:</span>
            <span className="font-semibold text-amber-400">
              {user ? roleLabels[user.rol] || user.rol : 'Sin sesión'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Usuario activo:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {user?.nombreCompleto || 'Desconocido'}
            </span>
          </div>
        </div>

        {/* Acciones de Navegación */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild className="w-full sm:w-auto h-9 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium gap-2">
            <Link href={defaultRoute}>
              <span>Ir a mi módulo principal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full sm:w-auto h-9 rounded-xl text-xs gap-1.5 border-sidebar-border hover:bg-sidebar">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al Inicio</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
