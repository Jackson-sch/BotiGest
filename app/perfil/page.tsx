import * as React from 'react';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { PerfilQfView } from '@/features/usuarios/components';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Perfil & Matrícula Q.F. | BotiGest',
  description: 'Acreditación profesional CQFP, Dirección Técnica y credenciales farmacéuticas.',
};

function PerfilSkeleton() {
  return (
    <div className="w-full space-y-6 pb-12 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-60 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <Card className="p-6 rounded-2xl flex items-center justify-between apple-glass">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-xl" />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

async function PerfilContent() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return <PerfilQfView initialUser={user} />;
}

export default function PerfilPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <Suspense fallback={<PerfilSkeleton />}>
        <PerfilContent />
      </Suspense>
    </main>
  );
}
