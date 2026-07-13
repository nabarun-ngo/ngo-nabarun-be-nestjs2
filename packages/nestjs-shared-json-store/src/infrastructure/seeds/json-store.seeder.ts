import { JsonStoreSeedData } from './json-store-seed.types';

/** Ensures `Record<string, unknown>` satisfies Prisma's `InputJsonValue` constraint. */
function toInputJson(payload: Record<string, unknown>): any {
  return JSON.parse(JSON.stringify(payload));
}

/**
 * Idempotent seeder for json-store reference data.
 *
 * Safe to call on every deploy. Each document is upserted using the
 * `(key, namespace)` unique constraint. The `onConflict` field on each
 * document entry controls what happens when the document already exists:
 *
 * - `'upsert'` *(default)* — overwrites the payload with the seed value.
 *   The seed file is always the source of truth.
 * - `'skip-if-exists'` — inserts on the first deploy, then leaves the
 *   document untouched. API/manual edits made after the first deploy are
 *   preserved across subsequent deployments.
 *
 * Usage (in the consuming app's seed / migration script):
 *
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { seedJsonStore } from '@ce/nestjs-shared-json-store';
 *
 * const prisma = new PrismaClient();
 * await seedJsonStore(prisma, {
 *   documents: [
 *     // Code is source of truth — always overwritten on deploy
 *     {
 *       namespace: 'correspondence',
 *       key: 'welcome-email',
 *       payload: { subject: 'Welcome!', htmlTemplate: '<p>Hi {{name}}</p>' },
 *       onConflict: 'upsert',
 *     },
 *     // Seeded once — API edits are preserved
 *     {
 *       namespace: 'config',
 *       key: 'feature-flags',
 *       payload: { newDashboard: false },
 *       onConflict: 'skip-if-exists',
 *     },
 *   ],
 * });
 * await prisma.$disconnect();
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedJsonStore(prismaRaw: any, data: JsonStoreSeedData): Promise<void> {
  const prisma = prismaRaw as any;
  console.log(`[json-store-seeder] Seeding ${data.documents.length} document(s)...`);

  for (const doc of data.documents) {
    const strategy = doc.onConflict ?? 'upsert';
    console.log(`[json-store-seeder]   [${strategy}] ${doc.namespace}/${doc.key}`);

    await prisma.jsonStoreDocument.upsert({
      where: {
        json_store_key_namespace_unique: { key: doc.key, namespace: doc.namespace },
      },
      // 'skip-if-exists': empty update object — record is found, nothing is changed.
      // 'upsert': payload is always replaced with the seed value.
      update: strategy === 'upsert' ? { payload: toInputJson(doc.payload) } : {},
      create: { key: doc.key, namespace: doc.namespace, payload: toInputJson(doc.payload) },
    });
  }

  console.log('[json-store-seeder] Done.');
}
