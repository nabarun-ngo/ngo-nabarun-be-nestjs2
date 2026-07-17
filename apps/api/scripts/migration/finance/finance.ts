/**
 * Finance migration ETL: copy accounts, donations, transactions, expenses, earnings
 * Run: npx ts-node scripts/migration/finance/finance.ts
 *
 * Table/column names match between stage and monorepo (@@map preserved).
 */
import { batchUpsert, closeEtlContext, createEtlContext, log } from './etl-utils';

const FINANCE_TABLES: { table: string; columns: string[] }[] = [
  {
    table: 'accounts',
    columns: [
      'id', 'name', 'type', 'currency', 'status', 'description', 'balance',
      'accountHolderName', 'accountHolderId', 'activatedOn', 'bankDetail', 'upiDetail',
      'createdById', 'createdAt', 'updatedAt', 'version', 'deletedAt',
    ],
  },
  {
    table: 'donations',
    columns: [
      'id', 'type', 'amount', 'currency', 'status', 'donorId', 'donorName', 'donorEmail',
      'donorPhone', 'isGuest', 'startDate', 'endDate', 'raisedOn', 'paidOn',
      'confirmedById', 'confirmedOn', 'paymentMethod', 'paidToAccountId', 'forEventId',
      'paidUsingUPI', 'isPaymentNotified', 'transactionRef', 'remarks', 'cancelletionReason',
      'laterPaymentReason', 'paymentFailureDetail', 'additionalFields',
      'createdAt', 'updatedAt', 'version', 'deletedAt',
    ],
  },
  {
    table: 'transactions',
    columns: [
      'id', 'transactionRef', 'type', 'amount', 'currency', 'status',
      'referenceId', 'referenceType', 'description', 'metadata', 'transactionDate',
      'particulars', 'createdById', 'createdAt', 'updatedAt', 'version', 'deletedAt',
      'refAccountId', 'accountId',
    ],
  },
  {
    table: 'expenses',
    columns: [
      'id', 'title', 'items', 'amount', 'currency', 'status', 'description',
      'referenceId', 'referenceType', 'isDelegated', 'createdById', 'paidById',
      'expenseDate', 'submittedById', 'submittedOn', 'finalizedById', 'finalizedOn',
      'settledById', 'settledOn', 'rejectedById', 'rejectedOn', 'updatedById', 'updatedOn',
      'accountId', 'accountName', 'transactionRef', 'remarks', 'createdAt', 'updatedAt',
      'version', 'deletedAt', 'userProfileId',
    ],
  },
  {
    table: 'earnings',
    columns: [
      'id', 'category', 'amount', 'currency', 'status', 'description', 'source',
      'referenceId', 'referenceType', 'accountId', 'transactionId', 'earningDate',
      'createdById', 'receivedById', 'createdAt', 'updatedAt', 'version', 'deletedAt',
    ],
  },
];

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('finance', 'starting', { dryRun: ctx.dryRun });

  try {
    for (const { table, columns } of FINANCE_TABLES) {
      const colSelect = columns.map((c) => `"${c}"`).join(', ');
      const { rows } = await ctx.source.query<Record<string, unknown>>(
        `SELECT ${colSelect} FROM "${table}"`,
      );
      const upserted = await batchUpsert(ctx, table, columns, rows);
      log('finance', `${table}: ${upserted} rows`, { dryRun: ctx.dryRun });
    }

    log('finance', 'complete');
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
