/**
 * Finance migration ETL: run all steps in order
 * Run: npx ts-node scripts/migration/finance/run-all.ts
 *
 * Env:
 *   SOURCE_DATABASE_URL — legacy stage DB
 *   DATABASE_URL        — target monorepo DB
 *   ETL_DRY_RUN=true    — optional dry run (no writes)
 */
import { execSync } from 'child_process';
import path from 'path';

const STEPS = [
  'preflight.ts',
  'user.ts',
  'activity.ts',
  'finance.ts',
  'dms.ts',
  'reconciliation.ts',
] as const;

const scriptDir = __dirname;

function runStep(script: string): void {
  const fullPath = path.join(scriptDir, script);
  console.log(`\n========== ${script} ==========\n`);
  execSync(`npx ts-node "${fullPath}"`, {
    stdio: 'inherit',
    cwd: path.resolve(scriptDir, '../..'),
    env: process.env,
  });
}

async function main(): Promise<void> {
  console.log('[finance-etl] Starting full migration pipeline');
  console.log('[finance-etl] ETL_DRY_RUN =', process.env.ETL_DRY_RUN ?? 'false');

  for (const step of STEPS) {
    runStep(step);
  }

  console.log('\n[finance-etl] Pipeline complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
