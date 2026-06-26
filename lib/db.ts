import { AuroraDSQLPool, type AuroraDSQLPoolConfig } from '@aws/aurora-dsql-node-postgres-connector';

/** Module-level singleton pool — reused across all connections. */
let pool: AuroraDSQLPool | null = null;

/**
 * Resolves the Aurora DSQL cluster endpoint for the given region.
 *
 * Architecture note: Currently only `us` is required. Adding `eu` later
 * requires only setting `DSQL_ENDPOINT_EU` in the environment — no code changes.
 *
 * @param region - The region key (`'us'` or `'eu'`).
 * @returns The cluster endpoint string.
 */
function resolveEndpoint(region: string): string {
  if (region === 'eu' && process.env.DSQL_ENDPOINT_EU) {
    return process.env.DSQL_ENDPOINT_EU;
  }
  if (!process.env.DSQL_ENDPOINT_US) {
    throw new Error(
      'DSQL_ENDPOINT_US environment variable is not set. ' +
        'Please configure it in your .env.local file.',
    );
  }
  return process.env.DSQL_ENDPOINT_US;
}

/**
 * Returns a singleton AuroraDSQLPool for the given region.
 *
 * The pool is cached globally so that on cold starts the connection is reused
 * across API route invocations. This prevents exhausting DSQL connections.
 *
 * @param region - The region key from the `x-dsql-region` header (`'us'` | `'eu'`).
 * @param log - Optional logger (defaults to `console`).
 * @returns An `AuroraDSQLPool` instance.
 */
export function getDbPool(
  region: string = 'us',
  log: Pick<Console, 'debug' | 'warn' | 'error'> = console,
): AuroraDSQLPool {
  if (pool) {
    return pool;
  }

  const endpoint = resolveEndpoint(region);
  const config: AuroraDSQLPoolConfig = {
    host: endpoint,
    port: 5432,
    database: process.env.DSQL_DATABASE ?? 'postgres',
    ssl: { rejectUnauthorized: true },
    region: process.env.AWS_REGION ?? 'us-east-1',
    // Token duration for IAM auth — defaults to 900s (15 min)
    tokenDurationSecs: Number(process.env.DSQL_TOKEN_DURATION_SECS) || 900,
    // Optimistic concurrency control retry config
    // NOTE: DSQL connector enforces maxDelayMs ≤ 100
    retry: {
      maxRetries: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
      jitterFactor: 0.2,
    },
    logger: log,
    // Pool sizing: min 1 idle, max 10 connections
    min: 1,
    max: 10,
  };

  pool = new AuroraDSQLPool(config);
  return pool;
}

/**
 * Execute a single SQL query with parameters.
 *
 * This is the primary helper for read-heavy API routes (GET). For transactional
 * writes (POST / PATCH / DELETE) prefer `pool.transaction()` directly to get
 * automatic OCC retry handling from the Aurora DSQL connector.
 *
 * @param sql    - The SQL query string with `$1`, `$2`, … placeholders.
 * @param params - The parameter values to bind.
 * @param region - The DSQL region key (defaults to `'us'`).
 * @returns The query result rows.
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  region: string = 'us',
): Promise<T[]> {
  const dbPool = getDbPool(region);
  const client = await dbPool.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Drain the singleton pool and reset it. Useful for testing and graceful shutdowns.
 */
export async function drainPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}