'use server';

import { getSessionUser } from '@/lib/auth';
import {
  createDatabaseBackup,
  listDatabaseBackups,
  deleteDatabaseBackup,
  restoreDatabaseBackup,
  saveUploadedBackup,
  type BackupItem,
} from '@/lib/backup/backup-service';
import { revalidatePath } from 'next/cache';

export interface BackupActionResult {
  success: boolean;
  message?: string;
  error?: string;
  filename?: string;
  preRestoreBackup?: string;
  backups?: BackupItem[];
}

/**
 * Server Action para generar una copia de seguridad inmediata de la base de datos.
 */
export async function generarBackupAction(
  tipo: 'sql' | 'dump' = 'sql'
): Promise<BackupActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
  }

  if (!['propietario', 'administrador'].includes(user.rol)) {
    return {
      success: false,
      error: 'Solo el Propietario o Administrador tienen permisos para generar respaldos.',
    };
  }

  const res = await createDatabaseBackup(tipo);
  if (!res.success) {
    return { success: false, error: res.error || 'Error al crear la copia de seguridad.' };
  }

  revalidatePath('/configuracion');

  return {
    success: true,
    message: `Copia de seguridad ${res.filename} generada exitosamente.`,
    filename: res.filename,
  };
}

/**
 * Server Action para obtener la lista actualizada de respaldos.
 */
export async function listarBackupsAction(): Promise<BackupItem[]> {
  const user = await getSessionUser();
  if (!user || !['propietario', 'administrador'].includes(user.rol)) {
    return [];
  }

  return await listDatabaseBackups();
}

/**
 * Server Action para eliminar una copia de seguridad específica.
 */
export async function eliminarBackupAction(filename: string): Promise<BackupActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
  }

  if (!['propietario', 'administrador'].includes(user.rol)) {
    return {
      success: false,
      error: 'Solo el Propietario o Administrador tienen permisos para eliminar respaldos.',
    };
  }

  const res = await deleteDatabaseBackup(filename);
  if (!res.success) {
    return { success: false, error: res.error || 'No se pudo eliminar el archivo de respaldo.' };
  }

  revalidatePath('/configuracion');

  return {
    success: true,
    message: `Copia de seguridad ${filename} eliminada correctamente.`,
  };
}

/**
 * Server Action para restablecer la base de datos a partir de una copia de seguridad existente.
 * Requiere rol administrativo y confirmación explícita con la palabra "RESTABLECER".
 */
export async function restablecerBackupAction(
  filename: string,
  confirmacionTexto: string
): Promise<BackupActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
  }

  if (!['propietario', 'administrador'].includes(user.rol)) {
    return {
      success: false,
      error: 'Acceso denegado: Solo el Propietario o Administrador pueden restaurar la base de datos.',
    };
  }

  if (confirmacionTexto.trim() !== 'RESTABLECER') {
    return {
      success: false,
      error: 'Debe escribir exactamente la palabra "RESTABLECER" para confirmar esta operación crítica.',
    };
  }

  const res = await restoreDatabaseBackup(filename);
  if (!res.success) {
    return {
      success: false,
      error: res.error || 'Ocurrió un error al intentar restaurar la base de datos.',
    };
  }

  // Revalidar todas las rutas del sistema para reflejar los datos restaurados
  revalidatePath('/', 'layout');
  revalidatePath('/configuracion');
  revalidatePath('/inventario');
  revalidatePath('/pos');
  revalidatePath('/compras');
  revalidatePath('/ventas');
  revalidatePath('/clientes');
  revalidatePath('/usuarios');

  return {
    success: true,
    message: `Base de datos restablecida satisfactoriamente desde ${filename}.`,
    preRestoreBackup: res.preRestoreBackup,
  };
}

/**
 * Server Action para subir un archivo de respaldo desde la computadora local.
 */
export async function subirBackupAction(formData: FormData): Promise<BackupActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para realizar esta operación.' };
  }

  if (!['propietario', 'administrador'].includes(user.rol)) {
    return {
      success: false,
      error: 'Solo el Propietario o Administrador tienen permisos para subir respaldos.',
    };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No se adjuntó ningún archivo de respaldo.' };
  }

  if (!file.name.endsWith('.sql') && !file.name.endsWith('.dump')) {
    return { success: false, error: 'Formato no válido. Solo se admiten archivos .sql o .dump.' };
  }

  // Límite de 100MB
  if (file.size > 100 * 1024 * 1024) {
    return { success: false, error: 'El archivo excede el tamaño máximo permitido (100 MB).' };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const res = await saveUploadedBackup(buffer, file.name);
  if (!res.success) {
    return { success: false, error: res.error || 'No se pudo guardar el archivo subido.' };
  }

  revalidatePath('/configuracion');

  return {
    success: true,
    message: `Archivo ${res.filename} subido y listo para restablecer o almacenar.`,
    filename: res.filename,
  };
}
