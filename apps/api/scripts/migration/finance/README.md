# Finance production ETL

Migrates finance data from legacy `be-nestjs-stage` PostgreSQL into the monorepo `apps/api` database.

## Prerequisites

1. Target DB has migrations applied (`npm run migrate:deploy`)
2. `user_profile` rows exist with same IDs as legacy `user_profiles` (user module migration)
3. Set env vars in `.env`:

```env
DATABASE_URL=postgresql://...        # target monorepo DB
SOURCE_DATABASE_URL=postgresql://... # legacy stage DB
```

## Pipeline

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `preflight.ts` | Row counts, orphan FK checks |
| 2 | `user.ts` | Sync `donationAmount`, pause dates to `user_profile` |
| 3 | `activity.ts` | Copy `activities` (stub columns) |
| 4 | `finance.ts` | Copy accounts, donations, transactions, expenses, earnings |
| 5 | `dms.ts` | Copy `document_references` → `dms_document_reference`, mappings |
| 6 | `reconciliation.ts` | Row counts, balance checks, spot samples |

## Usage

```bash
# Dry run (no writes)
ETL_DRY_RUN=true npm run etl:finance

# Full migration
npm run etl:finance

# Individual step
npm run etl:finance:preflight
npx ts-node scripts/migration/finance/finance.ts
```

## Cutover

1. Put stage API in read-only mode
2. Run `npm run etl:finance`
3. Smoke-test finance endpoints (`/api/donation`, `/api/account`, etc.)
4. Switch traffic to monorepo API
