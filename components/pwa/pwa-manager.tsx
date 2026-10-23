'use client';

import * as React from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BotiGestIcon } from '@/components/ui/botigest-logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);

  // 1. Registro del Service Worker
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar el service worker en la raíz
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Detectar nuevas versiones del service worker
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.info('Nueva versión de BotiGest disponible. Actualizando en segundo plano...');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });
    }

    // 2. Control de estado Online / Offline
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Conexión a internet restablecida.');
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('Sin conexión. Trabajando en modo local (PWA Offline).');
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // 3. Captura del evento de instalación PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // No mostrar inmediatamente si ya fue descartado en esta sesión
      const dismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowInstallBanner(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('¡BotiGest se ha instalado correctamente!');
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  return (
    <>
      {/* Banner de Estado Offline */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/90 text-black shadow-lg backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Modo Offline: Consulta y caja operando con datos locales</span>
        </aside>
      )}

      {/* Banner flotante elegante para instalar PWA */}
      {showInstallBanner && (
        <aside
          role="region"
          aria-label="Instalación de aplicación BotiGest"
          className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-3xl apple-glass border border-white/[0.12] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3.5"
        >
          <BotiGestIcon size={40} className="shadow-md" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-foreground tracking-tight">
              Instalar BotiGest
            </h2>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Acceso rápido desde el escritorio o tablet, con soporte sin conexión.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="h-8 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium cursor-pointer"
            >
              Instalar
            </Button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
