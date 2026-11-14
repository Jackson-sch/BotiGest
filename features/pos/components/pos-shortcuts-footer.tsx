'use client';

import * as React from 'react';
import { Keyboard } from 'lucide-react';
import { ShortcutsModal } from '@/components/shared/shortcuts-modal';

export function PosShortcutsFooter() {
  const [helpOpen, setHelpOpen] = React.useState(false);

  return (
    <>
      <footer className="h-9 px-4 sm:px-6 apple-glass border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-muted-foreground z-20 shrink-0 print:hidden select-none">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-foreground font-mono font-bold text-[10px] shadow-2xs">
              F2
            </kbd>
            <span>Buscar / Escanear</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-foreground font-mono font-bold text-[10px] shadow-2xs">
              ↑ ↓ ← →
            </kbd>
            <span>Navegar</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-foreground font-mono font-bold text-[10px] shadow-2xs">
              1..9
            </kbd>
            <span>Presentación</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-foreground font-mono font-bold text-[10px] shadow-2xs">
              Enter
            </kbd>
            <span>Agregar</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-foreground font-mono font-bold text-[10px] shadow-2xs">
              F3
            </kbd>
            <span>Comprobante</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[#0071e3] dark:text-[#2997ff]">
            <kbd className="px-1.5 py-0.5 rounded bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/25 font-mono font-bold text-[10px] shadow-2xs">
              F4
            </kbd>
            <span className="font-semibold">Cobrar</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap text-amber-600 dark:text-amber-400">
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-mono font-bold text-[10px] shadow-2xs">
              F6
            </kbd>
            <span>Pausar</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap cursor-pointer shrink-0 ml-2 apple-press-feedback"
          title="Ver todos los atajos de teclado [F1]"
        >
          <Keyboard className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline font-medium">Guía de Atajos</span>
          <kbd className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold text-[10px]">
            F1
          </kbd>
        </button>
      </footer>

      <ShortcutsModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
