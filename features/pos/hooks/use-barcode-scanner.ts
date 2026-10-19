'use client';

import * as React from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

export function playScannerBeep(isSuccess: boolean = true) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isSuccess) {
      // Bip agudo y limpio estilo lector farmacéutico Zebra/Honeywell (1200Hz -> 1800Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else {
      // Tono grave de error (fármaco no encontrado o lote bloqueado)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Si el navegador bloquea AudioContext por interacción previa
  }
}

/**
 * Hook para interceptar lecturas continuas desde pistolas lectoras de código de barras USB/Bluetooth (HID Wedge).
 * Detecta ráfagas de caracteres a velocidad no humana (<45ms entre pulsaciones) que finalizan con 'Enter'.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxIntervalMs = 50,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = React.useRef<string>('');
  const lastTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar teclas modificadoras
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = performance.now();
      const interval = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        // Si el buffer tiene la longitud adecuada y el último carácter llegó rápido, es un escáner
        const scanned = bufferRef.current.trim();
        bufferRef.current = '';

        if (scanned.length >= minChars && interval <= maxIntervalMs * 2.5) {
          e.preventDefault();
          e.stopPropagation();
          onScan(scanned);
        }
        return;
      }

      // Si el intervalo entre pulsaciones es muy largo, era un humano escribiendo manualmente
      if (interval > maxIntervalMs) {
        bufferRef.current = '';
      }

      // Solo acumular caracteres imprimibles simples
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onScan, minChars, maxIntervalMs, enabled]);
}
