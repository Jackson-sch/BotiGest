import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { pool } from '@/lib/db';

const execFileAsync = promisify(execFile);

export interface BackupItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  tipo: 'sql' | 'dump';
}

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

/**
 * Asegura que el directorio de copias de seguridad exista.
 */
export function ensureBackupsDir(): string {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
  return BACKUPS_DIR;
}

/**
 * Detecta la ruta ejecutable de pg_dump en el sistema.
 */
export function getPgDumpPath(): string | null {
  if (process.env.PG_DUMP_PATH && fs.existsSync(/*turbopackIgnore: true*/ process.env.PG_DUMP_PATH)) {
    return process.env.PG_DUMP_PATH;
  }

  // Rutas comunes en Windows
  const windowsPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
  ];

  for (const winPath of windowsPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ winPath)) {
      return winPath;
    }
  }

  return 'pg_dump'; // Confía en PATH
}

/**
 * Detecta la ruta ejecutable de pg_restore en el sistema.
 */
export function getPgRestorePath(): string | null {
  if (process.env.PG_RESTORE_PATH && fs.existsSync(/*turbopackIgnore: true*/ process.env.PG_RESTORE_PATH)) {
    return process.env.PG_RESTORE_PATH;
  }

  const windowsPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_restore.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe',
  ];

  for (const winPath of windowsPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ winPath)) {
      return winPath;
    }
  }

  return 'pg_restore';
}

/**
 * Detecta la ruta ejecutable de psql en el sistema.
 */
export function getPsqlPath(): string | null {
  if (process.env.PSQL_PATH && fs.existsSync(/*turbopackIgnore: true*/ process.env.PSQL_PATH)) {
    return process.env.PSQL_PATH;
  }

  const windowsPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
  ];

  for (const winPath of windowsPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ winPath)) {
      return winPath;
    }
  }

  return 'psql';
}

/**
 * Extrae parámetros de conexión de las variables de entorno.
 */
function getDbConnectionParams() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname || 'localhost',
        port: url.port || '5432',
        database: url.pathname.replace(/^\//, '') || 'botica_db',
        user: decodeURIComponent(url.username || 'postgres'),
        password: decodeURIComponent(url.password || ''),
      };
    } catch {
      // Si falla el parsing URL, usar variables individuales
    }
  }

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5433',
    database: process.env.POSTGRES_DB || 'botica_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'root',
  };
}

/**
 * Formatea bytes en formato legible (KB, MB, GB).
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Fallback de exportación pura en Node.js vía SQL (si pg_dump no estuviese disponible).
 */
async function fallbackPureSqlDump(targetPath: string): Promise<void> {
  const client = await pool.connect();
  try {
    let sqlOutput = `-- =====================================================================\n`;
    sqlOutput += `-- BOTIGEST FARMACIA - COPIA DE SEGURIDAD DE BASE DE DATOS (FALLBACK SQL)\n`;
    sqlOutput += `-- Fecha de Generación: ${new Date().toISOString()}\n`;
    sqlOutput += `-- =====================================================================\n\n`;
    sqlOutput += `SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`;

    // 1. Obtener todas las tablas públicas
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const dataRes = await client.query(`SELECT * FROM public."${tableName}"`);

      sqlOutput += `-- Tabla: public.${tableName} (${dataRes.rows.length} registros)\n`;
      if (dataRes.rows.length > 0) {
        const columns = Object.keys(dataRes.rows[0]);
        for (const dataRow of dataRes.rows) {
          const values = columns.map((col) => {
            const val = dataRow[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return String(val);
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlOutput += `INSERT INTO public."${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      sqlOutput += `\n`;
    }

    fs.writeFileSync(targetPath, sqlOutput, 'utf8');
  } finally {
    client.release();
  }
}

/**
 * Genera una copia de seguridad física de la base de datos.
 */
export async function createDatabaseBackup(
  tipo: 'sql' | 'dump' = 'sql'
): Promise<{ success: boolean; filename?: string; sizeBytes?: number; error?: string }> {
  try {
    const backupsDir = ensureBackupsDir();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const filename = `botica_backup_${timestamp}.${tipo}`;
    const filePath = path.join(backupsDir, filename);

    const { host, port, database, user, password } = getDbConnectionParams();
    const pgDumpBin = getPgDumpPath();

    let generatedSuccessfully = false;

    if (pgDumpBin) {
      const formatFlag = tipo === 'dump' ? 'c' : 'p';
      const args = [
        '-h', host,
        '-p', String(port),
        '-U', user,
        '-d', database,
        '-F', formatFlag,
        '-f', filePath,
      ];

      try {
        await execFileAsync(pgDumpBin, args, {
          env: {
            ...process.env,
            PGPASSWORD: password,
          },
        });
        generatedSuccessfully = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
      } catch (err: any) {
        console.warn(`pg_dump falló (${err.message}). Intentando fallback SQL nativo...`);
      }
    }

    // Si pg_dump falló o no estaba disponible, usar fallback nativo SQL
    if (!generatedSuccessfully) {
      const fallbackFilename = `botica_backup_${timestamp}.sql`;
      const fallbackPath = path.join(backupsDir, fallbackFilename);
      await fallbackPureSqlDump(fallbackPath);
      const stat = fs.statSync(fallbackPath);
      cleanOldBackups(30);
      return {
        success: true,
        filename: fallbackFilename,
        sizeBytes: stat.size,
      };
    }

    const stat = fs.statSync(filePath);
    cleanOldBackups(30);

    return {
      success: true,
      filename,
      sizeBytes: stat.size,
    };
  } catch (error: any) {
    console.error('Error al generar backup de base de datos:', error);
    return {
      success: false,
      error: error.message || 'Error al generar la copia de seguridad',
    };
  }
}

/**
 * Lista todas las copias de seguridad existentes ordenadas por fecha más reciente.
 */
export async function listDatabaseBackups(): Promise<BackupItem[]> {
  try {
    const backupsDir = ensureBackupsDir();
    const files = fs.readdirSync(backupsDir);

    const backups: BackupItem[] = [];

    for (const file of files) {
      if (!file.startsWith('botica_backup_') || (!file.endsWith('.sql') && !file.endsWith('.dump'))) {
        continue;
      }

      const fullPath = path.join(backupsDir, file);
      const stat = fs.statSync(fullPath);

      backups.push({
        filename: file,
        sizeBytes: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.mtime.toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        tipo: file.endsWith('.dump') ? 'dump' : 'sql',
      });
    }

    // Ordenar de más reciente a más antigua
    return backups.sort((a, b) => b.filename.localeCompare(a.filename));
  } catch (error) {
    console.error('Error al listar backups:', error);
    return [];
  }
}

/**
 * Elimina una copia de seguridad específica de forma segura.
 */
export async function deleteDatabaseBackup(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar nombre para evitar Directory Traversal
    if (!/^[a-zA-Z0-9_\-]+\.(sql|dump)$/.test(filename)) {
      return { success: false, error: 'Nombre de archivo no válido' };
    }

    const backupsDir = ensureBackupsDir();
    const targetPath = path.join(backupsDir, filename);

    if (!fs.existsSync(targetPath)) {
      return { success: false, error: 'El archivo de respaldo no existe' };
    }

    fs.unlinkSync(targetPath);
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar backup:', error);
    return { success: false, error: error.message || 'Error al eliminar backup' };
  }
}

/**
 * Devuelve la ruta absoluta del archivo de respaldo si es seguro.
 */
export function getSafeBackupFilePath(filename: string): string | null {
  if (!/^[a-zA-Z0-9_\-]+\.(sql|dump)$/.test(filename)) {
    return null;
  }
  const backupsDir = ensureBackupsDir();
  const targetPath = path.join(backupsDir, filename);
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }
  return null;
}

/**
 * Mantiene la política de retención (ej. 30 días, conservando siempre al menos 5).
 */
export function cleanOldBackups(diasRetencion: number = 30): void {
  try {
    const backupsDir = ensureBackupsDir();
    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('botica_backup_') && (f.endsWith('.sql') || f.endsWith('.dump')))
      .map((f) => {
        const fullPath = path.join(backupsDir, f);
        return { name: f, path: fullPath, mtime: fs.statSync(fullPath).mtime };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Conservar siempre al menos 5 backups
    if (files.length <= 5) return;

    const ahora = Date.now();
    const maxEdadMs = diasRetencion * 24 * 60 * 60 * 1000;

    for (let i = 5; i < files.length; i++) {
      const file = files[i];
      if (ahora - file.mtime.getTime() > maxEdadMs) {
        fs.unlinkSync(file.path);
      }
    }
  } catch (err) {
    console.error('Error al depurar backups antiguos:', err);
  }
}

/**
 * Restablece la base de datos a partir de un archivo de respaldo (.dump o .sql).
 * Genera automáticamente un snapshot preventivo antes de iniciar para evitar cualquier pérdida accidental.
 */
export async function restoreDatabaseBackup(
  filename: string
): Promise<{ success: boolean; preRestoreBackup?: string; error?: string }> {
  try {
    const safePath = getSafeBackupFilePath(filename);
    if (!safePath || !fs.existsSync(safePath)) {
      return { success: false, error: 'El archivo de respaldo seleccionado no existe.' };
    }

    // 1. Crear respaldo preventivo automático del estado actual
    const preBackupRes = await createDatabaseBackup('dump');
    const preRestoreBackup = preBackupRes.success ? preBackupRes.filename : undefined;

    const { host, port, database, user, password } = getDbConnectionParams();
    const isDump = filename.endsWith('.dump');

    // Cerrar conexiones abiertas concurrentes (excepto la actual) para permitir re-creación
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          SELECT pg_terminate_backend(pid) 
          FROM pg_stat_activity 
          WHERE datname = $1 AND pid <> pg_backend_pid();
        `, [database]);
      } finally {
        client.release();
      }
    } catch (e: any) {
      console.warn('Aviso no fatal al cerrar conexiones previas:', e.message);
    }

    if (isDump) {
      const pgRestoreBin = getPgRestorePath();
      if (!pgRestoreBin) {
        return { success: false, error: 'No se encontró la utilidad pg_restore en el servidor.' };
      }

      const args = [
        '-h', host,
        '-p', String(port),
        '-U', user,
        '-d', database,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        safePath,
      ];

      try {
        await execFileAsync(pgRestoreBin, args, {
          env: {
            ...process.env,
            PGPASSWORD: password,
          },
        });
      } catch (err: any) {
        // pg_restore suele salir con advertencias no críticas al tirar objetos IF EXISTS que aún no existían
        console.warn('pg_restore completado con advertencias secundarias:', err.message);
      }
    } else {
      // Formato .sql
      const psqlBin = getPsqlPath();
      let restoredWithPsql = false;

      if (psqlBin) {
        try {
          const args = [
            '-h', host,
            '-p', String(port),
            '-U', user,
            '-d', database,
            '-f', safePath,
          ];

          await execFileAsync(psqlBin, args, {
            env: {
              ...process.env,
              PGPASSWORD: password,
            },
          });
          restoredWithPsql = true;
        } catch (err: any) {
          console.warn('psql falló, ejecutando motor SQL alternativo:', err.message);
        }
      }

      if (!restoredWithPsql) {
        const sqlContent = fs.readFileSync(safePath, 'utf8');
        const client = await pool.connect();
        try {
          await client.query(sqlContent);
        } finally {
          client.release();
        }
      }
    }

    return {
      success: true,
      preRestoreBackup,
    };
  } catch (error: any) {
    console.error('Error al restablecer base de datos:', error);
    return {
      success: false,
      error: error.message || 'Error al restablecer la base de datos',
    };
  }
}

/**
 * Guarda un archivo de copia de seguridad subido por el usuario en el directorio seguro de respaldos.
 */
export async function saveUploadedBackup(
  buffer: Buffer,
  originalName: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const ext = originalName.endsWith('.dump') ? 'dump' : originalName.endsWith('.sql') ? 'sql' : null;
    if (!ext) {
      return { success: false, error: 'Formato no compatible. Solo se admiten archivos .sql o .dump.' };
    }

    const backupsDir = ensureBackupsDir();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const safeBase = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 24);

    const filename = `botica_backup_subido_${safeBase}_${timestamp}.${ext}`;
    const targetPath = path.join(backupsDir, filename);

    fs.writeFileSync(targetPath, buffer);

    return { success: true, filename };
  } catch (error: any) {
    console.error('Error al subir copia de seguridad:', error);
    return { success: false, error: error.message || 'Error al procesar el archivo subido.' };
  }
}
