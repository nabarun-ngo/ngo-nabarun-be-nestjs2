/**
 * Finance migration ETL: preflight validation
 * Run: npx ts-node scripts/migration/finance/preflight.ts
 */
import {
  closeEtlContext,
  countRows,
  createEtlContext,
  log,
  logWarn,
} from './etl-utils';

interface OrphanCheck {
  label: string;
  sql: string;
}

const ORPHAN_CHECKS: OrphanCheck[] = [
  {
    label: 'donations with missing donor (member)',
    sql: `SELECT COUNT(*)::text AS count FROM donations d
      WHERE d."donorId" IS NOT NULL AND d."isGuest" IS NOT TRUE
      AND NOT EXISTS (SELECT 1 FROM user_profiles u WHERE u.id = d."donorId")`,
  },
  {
    label: 'donations with missing paidToAccount',
    sql: `SELECT COUNT(*)::text AS count FROM donations d
      WHERE d."paidToAccountId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = d."paidToAccountId")`,
  },
  {
    label: 'transactions with missing account',
    sql: `SELECT COUNT(*)::text AS count FROM transactions t
      WHERE t."accountId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = t."accountId")`,
  },
  {
    label: 'expenses with missing createdBy user',
    sql: `SELECT COUNT(*)::text AS count FROM expenses e
      WHERE NOT EXISTS (SELECT 1 FROM user_profiles u WHERE u.id = e."createdById")`,
  },
  {
    label: 'donations with missing activity',
    sql: `SELECT COUNT(*)::text AS count FROM donations d
      WHERE d."forEventId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.id = d."forEventId")`,
  },
];

const SOURCE_TABLES = [
  'user_profiles',
  'accounts',
  'donations',
  'transactions',
  'expenses',
  'earnings',
  'activities',
  'document_references',
  'document_mappings',
] as const;

const TARGET_TABLES = [
  'user_profile',
  'accounts',
  'donations',
  'transactions',
  'expenses',
  'earnings',
  'activities',
  'dms_document_reference',
  'dms_document_mapping',
] as const;

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('preflight', 'starting validation', { dryRun: ctx.dryRun });

  try {
    log('preflight', 'source row counts');
    for (const table of SOURCE_TABLES) {
      const count = await countRows(ctx.source, table);
      log('preflight', `  ${table}: ${count}`);
    }

    log('preflight', 'target row counts (before migration)');
    for (const table of TARGET_TABLES) {
      try {
        const count = await countRows(ctx.target, table);
        log('preflight', `  ${table}: ${count}`);
      } catch {
        logWarn('preflight', `  ${table}: table not found or inaccessible`);
      }
    }

    log('preflight', 'orphan FK checks on source');
    let hasOrphans = false;
    for (const check of ORPHAN_CHECKS) {
      const { rows } = await ctx.source.query<{ count: string }>(check.sql);
      const count = Number(rows[0]?.count ?? 0);
      if (count > 0) {
        hasOrphans = true;
        logWarn('preflight', `${check.label}: ${count}`);
      } else {
        log('preflight', `${check.label}: OK`);
      }
    }

    const targetUsers = await countRows(ctx.target, 'user_profile');
    const sourceUsers = await countRows(ctx.source, 'user_profiles');
    if (targetUsers === 0 && sourceUsers > 0) {
      logWarn(
        'preflight',
        'target user_profile is empty — run user migration before finance ETL',
        { sourceUsers },
      );
    }

    const { rows: srcDonationUsers } = await ctx.source.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count FROM user_profiles
      WHERE "donationAmount" IS NOT NULL OR "donationPauseStart" IS NOT NULL
    `);
    const sourceDonationUserCount = Number(srcDonationUsers[0]?.count ?? 0);
    if (sourceDonationUserCount > 0 && targetUsers > 0) {
      const { rows: tgtSynced } = await ctx.target.query<{ count: string }>(`
        SELECT COUNT(*)::text AS count FROM user_profile
        WHERE "donationAmount" IS NOT NULL OR "donationPauseStart" IS NOT NULL
      `);
      const targetSynced = Number(tgtSynced[0]?.count ?? 0);
      if (targetSynced < sourceDonationUserCount) {
        logWarn('preflight', 'donation fields not yet synced to user_profile', {
          sourceWithFields: sourceDonationUserCount,
          targetWithFields: targetSynced,
        });
      }
    }

    if (hasOrphans) {
      logWarn('preflight', 'orphan records detected — review before cutover');
      process.exitCode = 1;
    } else {
      log('preflight', 'all checks passed');
    }
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
