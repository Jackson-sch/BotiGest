import { Pool, type QueryResultRow } from 'pg';

// Singleton para el pool de conexiones en Next.js (evita agotar conexiones en recargas de desarrollo)
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'root'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5433'}/${process.env.POSTGRES_DB || 'botica_db'}`;

export const pool =
  global.__pgPool ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool = pool;
}

/**
 * Ejecuta una consulta SQL en la base de datos botica_db tipada con genéricos.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Ejecuta una consulta y devuelve una sola fila o null si no existe.
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
