/**
 * Finance migration ETL: post-migration reconciliation
 * Run: npx ts-node scripts/migration/finance/reconciliation.ts
 */
import { closeEtlContext, countRows, createEtlContext, log, logWarn } from './etl-utils';

const TABLE_PAIRS: { source: string; target: string }[] = [
  { source: 'accounts', target: 'accounts' },
  { source: 'donations', target: 'donations' },
  { source: 'transactions', target: 'transactions' },
  { source: 'expenses', target: 'expenses' },
  { source: 'earnings', target: 'earnings' },
  { source: 'activities', target: 'activities' },
  { source: 'document_references', target: 'dms_document_reference' },
  { source: 'document_mappings', target: 'dms_document_mapping' },
];

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('reconciliation', 'starting');

  let failed = false;

  try {
    log('reconciliation', 'row count comparison');
    for (const { source, target } of TABLE_PAIRS) {
      const srcCount = await countRows(ctx.source, source);
      const tgtCount = await countRows(ctx.target, target);
      const match = srcCount === tgtCount;
      if (!match) {
        failed = true;
        logWarn('reconciliation', `${source} → ${target}: MISMATCH`, { srcCount, tgtCount });
      } else {
        log('reconciliation', `${source} → ${target}: ${tgtCount} OK`);
      }
    }

    log('reconciliation', 'account balance vs transaction ledger');
    const { rows: balanceRows } = await ctx.target.query<{
      accountId: string;
      accountBalance: string;
      txnNet: string;
    }>(`
      SELECT a.id AS "accountId",
             a.balance::text AS "accountBalance",
             COALESCE(SUM(
               CASE t.type
                 WHEN 'TRANSFER' THEN 0
                 WHEN 'DONATION' THEN t.amount
                 WHEN 'EARNING' THEN t.amount
                 WHEN 'EXPENSE' THEN -t.amount
                 ELSE t.amount
               END
             ), 0)::text AS "txnNet"
      FROM accounts a
      LEFT JOIN transactions t ON t."accountId" = a.id AND t.status = 'COMPLETED' AND t."deletedAt" IS NULL
      WHERE a."deletedAt" IS NULL
      GROUP BY a.id, a.balance
      HAVING ABS(a.balance - COALESCE(SUM(
        CASE t.type
          WHEN 'TRANSFER' THEN 0
          WHEN 'DONATION' THEN t.amount
          WHEN 'EARNING' THEN t.amount
          WHEN 'EXPENSE' THEN -t.amount
          ELSE t.amount
        END
      ), 0)) > 0.01
      LIMIT 20
    `);

    if (balanceRows.length > 0) {
      failed = true;
      logWarn('reconciliation', 'account balance discrepancies (sample)', {
        count: balanceRows.length,
        sample: balanceRows.slice(0, 5),
      });
    } else {
      log('reconciliation', 'account balances consistent with transactions');
    }

    log('reconciliation', 'donation status distribution');
    const { rows: statusRows } = await ctx.target.query<{ status: string; count: string }>(`
      SELECT status, COUNT(*)::text AS count FROM donations GROUP BY status ORDER BY count DESC
    `);
    for (const row of statusRows) {
      log('reconciliation', `  donations.${row.status}: ${row.count}`);
    }

    const { rows: spotCheck } = await ctx.target.query(`
      (SELECT 'account' AS entity, id FROM accounts ORDER BY "createdAt" DESC LIMIT 3)
      UNION ALL
      (SELECT 'donation' AS entity, id FROM donations ORDER BY "raisedOn" DESC LIMIT 3)
      UNION ALL
      (SELECT 'transaction' AS entity, id FROM transactions ORDER BY "transactionDate" DESC LIMIT 3)
      UNION ALL
      (SELECT 'expense' AS entity, id FROM expenses ORDER BY "createdAt" DESC LIMIT 3)
      UNION ALL
      (SELECT 'earning' AS entity, id FROM earnings ORDER BY "createdAt" DESC LIMIT 3)
    `);
    log('reconciliation', 'spot-check ids (latest per entity)', { spotCheck });

    if (failed) {
      logWarn('reconciliation', 'FAILED — review mismatches before cutover');
      process.exitCode = 1;
    } else {
      log('reconciliation', 'PASSED');
    }
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
