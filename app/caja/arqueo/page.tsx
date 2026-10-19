import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { obtenerTurnoActivo } from '@/features/caja';
import { ArqueoCajaPageView } from '@/features/caja/components/arqueo-caja-page-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { CajaSkeleton } from '@/components/shared/module-skeletons';

async function ArqueoContent() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!['cajero', 'administrador', 'propietario'].includes(user.rol)) {
    redirect('/sin-acceso?ruta=%2Fcaja%2Farqueo');
  }

  const turnoActivo = await obtenerTurnoActivo();

  if (!turnoActivo) {
    return (
      <div className="flex-1 mx-auto max-w-2xl w-full p-6 sm:p-12 space-y-6">
        <Button asChild variant="ghost" size="sm" className="rounded-xl gap-2 text-xs">
          <Link href="/caja">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Caja</span>
          </Link>
        </Button>

        <Card className="p-8 text-center space-y-5 apple-glass rounded-3xl border border-border shadow-xl">
          <div className="inline-flex h-16 w-16 rounded-full bg-[#ff9500]/15 text-[#ff9500] items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-apple-title text-foreground">
              Sin Turno de Caja Abierto
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No tienes un turno de caja activo en este momento para realizar arqueo o cierre. Debes aperturar un turno primero con saldo inicial.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button asChild className="rounded-xl gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white">
              <Link href="/caja">
                <KeyRound className="h-4 w-4" />
                <span>Ir al Panel de Apertura</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ArqueoCajaPageView
      turno={turnoActivo}
      userName={`${user.nombres} ${user.apellidos}`}
    />
  );
}

export default function ArqueoCajaPage() {
  return (
    <Suspense fallback={<CajaSkeleton />}>
      <ArqueoContent />
    </Suspense>
  );
}
