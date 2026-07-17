/**
 * Finance migration ETL: copy activities (minimal stub columns)
 * Run: npx ts-node scripts/migration/finance/activity.ts
 */
import { batchUpsert, closeEtlContext, createEtlContext, log } from './etl-utils';

const ACTIVITY_COLUMNS = [
  'id',
  'projectId',
  'name',
  'description',
  'scale',
  'type',
  'status',
  'priority',
  'startDate',
  'endDate',
  'deletedAt',
  'createdAt',
  'updatedAt',
] as const;

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('activity', 'starting', { dryRun: ctx.dryRun });

  try {
    const colSelect = ACTIVITY_COLUMNS.map((c) => `"${c}"`).join(', ');
    const { rows } = await ctx.source.query<Record<string, unknown>>(
      `SELECT ${colSelect} FROM activities`,
    );

    const upserted = await batchUpsert(ctx, 'activities', [...ACTIVITY_COLUMNS], rows);
    log('activity', 'complete', { upserted, dryRun: ctx.dryRun });
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
