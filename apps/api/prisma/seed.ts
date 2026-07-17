import { join } from 'path';
import { PrismaClient } from './../generated/prisma/client';
import { seedAuth2 } from '@ce/nestjs-shared-auth';
import {
  seedJsonStore,
  loadJsonStoreSeedFromDir,
  validateJsonStoreSeedData,
} from '@ce/nestjs-shared-json-store';
import { ZodJsonDocumentPayloadValidatorAdapter } from '../src/integrations/json-store/json-document-payload-validator.adapter';
import { AUTH2_SEED } from './seeds/auth.seed';
import { seedWorkflowForms } from './seeds/workflow-forms.seed';
import { seedPublicSiteForms } from './seeds/public-site-forms.seed';
import { seedPublicSiteApiKey } from './seeds/public-site-api-key.seed';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Auth2 seeding
  try {
    await seedAuth2(prisma, AUTH2_SEED);
  } catch (error) {
    console.error(error);
  }
  try {
    await seedWorkflowForms(prisma);
  } catch (error) {
    console.error(error);
  }
  try {
    await seedPublicSiteApiKey(prisma);
  } catch (error) {
    console.error(error);
  }
  try {
    await seedPublicSiteForms(prisma);
  } catch (error) {
    console.error(error);
  }
  try {
    const jsonStoreData = loadJsonStoreSeedFromDir(
      join(__dirname, 'seeds/json-store'),
    );
    validateJsonStoreSeedData(jsonStoreData, new ZodJsonDocumentPayloadValidatorAdapter());
    await seedJsonStore(prisma, jsonStoreData);
  } catch (error) {
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
