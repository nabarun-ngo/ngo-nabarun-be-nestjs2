/**
 * Shared utilities for finance production ETL (stage → monorepo).
 *
 * Env:
 *   SOURCE_DATABASE_URL — legacy be-nestjs-stage PostgreSQL
 *   DATABASE_URL        — target monorepo PostgreSQL
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export type PgPool = pg.Pool;

export interface EtlContext {
  source: PgPool;
  target: PgPool;
  dryRun: boolean;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function isDryRun(): boolean {
  return process.env.ETL_DRY_RUN === 'true' || process.env.ETL_DRY_RUN === '1';
}

export async function createEtlContext(): Promise<EtlContext> {
  return {
    source: new Pool({ connectionString: requireEnv('SOURCE_DATABASE_URL') }),
    target: new Pool({ connectionString: requireEnv('DATABASE_URL') }),
    dryRun: isDryRun(),
  };
}

export async function closeEtlContext(ctx: EtlContext): Promise<void> {
  await ctx.source.end();
  await ctx.target.end();
}

export async function countRows(pool: PgPool, table: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "${table}"`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function countRowsWhere(
  pool: PgPool,
  table: string,
  where: string,
): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "${table}" WHERE ${where}`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function batchUpsert(
  ctx: EtlContext,
  targetTable: string,
  columns: string[],
  rows: Record<string, unknown>[],
  batchSize = 500,
): Promise<number> {
  if (rows.length === 0) return 0;

  const colList = columns.map((c) => `"${c}"`).join(', ');
  const placeholders = (offset: number) =>
    columns.map((_, i) => `$${offset + i + 1}`).join(', ');
  const updates = columns
    .filter((c) => c !== 'id')
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');

  let upserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    if (ctx.dryRun) {
      upserted += batch.length;
      continue;
    }

    const values: unknown[] = [];
    const valueGroups = batch
      .map((row, rowIdx) => {
        const base = rowIdx * columns.length;
        columns.forEach((col) => values.push(row[col] ?? null));
        return `(${placeholders(base)})`;
      })
      .join(', ');

    const sql = `
      INSERT INTO "${targetTable}" (${colList})
      VALUES ${valueGroups}
      ON CONFLICT ("id") DO UPDATE SET ${updates}
    `;
    await ctx.target.query(sql, values);
    upserted += batch.length;
  }

  return upserted;
}

export function log(step: string, message: string, data?: Record<string, unknown>): void {
  const prefix = `[finance-etl:${step}]`;
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export function logWarn(step: string, message: string, data?: Record<string, unknown>): void {
  const prefix = `[finance-etl:${step}] WARN`;
  if (data) {
    console.warn(prefix, message, data);
  } else {
    console.warn(prefix, message);
  }
}
