'use client';

import * as React from 'react';
import { WifiOff, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BotiGestIcon } from '@/components/ui/botigest-logo';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md p-8 rounded-3xl apple-glass border border-white/[0.08] shadow-2xl flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <BotiGestIcon size={44} className="shadow-md" />
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <WifiOff className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Modo sin conexión
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No se pudo establecer conexión con el servidor. Las funciones locales de caja y consulta en caché siguen disponibles.
          </p>
        </div>

        <div className="w-full pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 rounded-2xl h-11 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium gap-2 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Reintentar conexión</span>
          </Button>
          <Link href="/pos" className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-2xl h-11 border-white/[0.1] text-xs font-medium gap-2"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Ir al POS</span>
            </Button>
          </Link>
        </div>

        <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-2 border-t border-border/40 w-full justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>BotiGest PWA Offline Ready</span>
        </div>
      </div>
    </div>
  );
}
