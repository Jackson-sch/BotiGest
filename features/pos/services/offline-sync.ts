'use client';

import { offlineDB, type OfflineVentaQueue } from '@/lib/offline-db';
import { toast } from 'sonner';

/**
 * Encola una venta en IndexedDB (Dexie) cuando el navegador está sin conexión.
 */
export async function encolarVentaOffline(ventaData: Omit<OfflineVentaQueue, 'id' | 'estado_sync' | 'created_at'>) {
  try {
    const id = await offlineDB.ventasQueue.add({
      ...ventaData,
      estado_sync: 'pendiente',
      created_at: Date.now(),
    });
    console.log(`[Offline Sync] Venta guardada localmente en Dexie. ID: ${id}`);
    return { success: true, localId: id };
  } catch (error: any) {
    console.error('[Offline Sync] Error al guardar venta en IndexedDB:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Procesa todas las ventas en cola cuando se restablece la conexión.
 */
export async function sincronizarVentasPendientes() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const pendientes = await offlineDB.ventasQueue
    .where('estado_sync')
    .equals('pendiente')
    .toArray();

  if (pendientes.length === 0) return;

  console.log(`[Offline Sync] Sincronizando ${pendientes.length} ventas locales con el servidor...`);
  toast.info(`Sincronizando ${pendientes.length} venta(s) guardadas sin conexión...`);

  for (const venta of pendientes) {
    try {
      await offlineDB.ventasQueue.update(venta.id!, { estado_sync: 'sincronizando' });

      // Llamada al endpoint o server action de sincronización
      const response = await fetch('/api/pos/sync-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta),
      });

      const res = await response.json();
      if (res.success) {
        await offlineDB.ventasQueue.update(venta.id!, { estado_sync: 'sincronizado' });
        // Opcional: limpiar registros sincronizados después de un tiempo
        await offlineDB.ventasQueue.delete(venta.id!);
      } else {
        await offlineDB.ventasQueue.update(venta.id!, {
          estado_sync: 'error',
          error_mensaje: res.error || 'Error en servidor',
        });
      }
    } catch (err: any) {
      await offlineDB.ventasQueue.update(venta.id!, {
        estado_sync: 'error',
        error_mensaje: err.message || 'Error de red',
      });
    }
  }

  const restantes = await offlineDB.ventasQueue.where('estado_sync').equals('pendiente').count();
  if (restantes === 0) {
    toast.success('Todas las ventas offline se sincronizaron con éxito.');
  }
}
