/**
 * Finance migration ETL: copy donation fields from legacy user_profiles → user_profile
 * Run: npx ts-node scripts/migration/finance/user.ts
 *
 * Prerequisite: user_profile rows exist with matching ids (from user module migration).
 */
import { closeEtlContext, createEtlContext, log } from './etl-utils';

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('user', 'starting donation field sync', { dryRun: ctx.dryRun });

  try {
    const { rows: sourceRows } = await ctx.source.query<{
      id: string;
      donationAmount: string | null;
      donationPauseStart: Date | null;
      donationPauseEnd: Date | null;
    }>(`
      SELECT id, "donationAmount", "donationPauseStart", "donationPauseEnd"
      FROM user_profiles
      WHERE "donationAmount" IS NOT NULL
         OR "donationPauseStart" IS NOT NULL
         OR "donationPauseEnd" IS NOT NULL
    `);

    log('user', `found ${sourceRows.length} users with donation fields in source`);

    let updated = 0;
    let skipped = 0;

    for (const row of sourceRows) {
      const { rows: exists } = await ctx.target.query<{ id: string }>(
        `SELECT id FROM user_profile WHERE id = $1`,
        [row.id],
      );

      if (exists.length === 0) {
        skipped++;
        continue;
      }

      if (!ctx.dryRun) {
        await ctx.target.query(
          `UPDATE user_profile
           SET "donationAmount" = $2,
               "donationPauseStart" = $3,
               "donationPauseEnd" = $4,
               "updatedAt" = NOW()
           WHERE id = $1`,
          [row.id, row.donationAmount, row.donationPauseStart, row.donationPauseEnd],
        );
      }
      updated++;
    }

    log('user', 'complete', { updated, skipped, dryRun: ctx.dryRun });
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
