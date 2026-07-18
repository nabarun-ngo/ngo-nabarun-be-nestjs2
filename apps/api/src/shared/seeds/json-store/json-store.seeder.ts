import { join } from 'path';
import { loadJsonStoreSeedFromDir } from './json-store-seed.loader';
import { validateJsonStoreSeedData } from './validate-json-store-seed-data';
import { PrismaClient } from '../../persistence/prisma/client';
import { ZodJsonDocumentPayloadValidatorAdapter } from '../../integrations/json-store/json-document-payload-validator.adapter';

/** Ensures `Record<string, unknown>` satisfies Prisma's `InputJsonValue` constraint. */
function toInputJson(payload: Record<string, unknown>): any {
  return JSON.parse(JSON.stringify(payload));
}

export async function seedJsonStore(prisma: PrismaClient): Promise<void> {

  try {
    console.log("[json-store-seeder] Starting json-store seed...")
    const data = loadJsonStoreSeedFromDir(
      join(__dirname, 'data'),
    );
    validateJsonStoreSeedData(data, new ZodJsonDocumentPayloadValidatorAdapter());
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
  } catch (error) {
    console.log('[json-store-seeder] Failed.');

    console.error(error);
  }
}
