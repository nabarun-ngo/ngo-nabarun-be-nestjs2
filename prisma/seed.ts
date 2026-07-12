import { join } from 'path';
import { PrismaClient } from './../generated/prisma/client';
import { seedAuth2 } from 'nestjs-shared/auth';
import { seedJsonStore, loadJsonStoreSeedFromDir } from 'nestjs-shared/json-store';
import { AUTH2_SEED } from './seeds/auth2.seed';
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
    const jsonStoreData = loadJsonStoreSeedFromDir(
      join(__dirname, 'seeds/json-store'),
    );
    await seedJsonStore(prisma, jsonStoreData);
  } catch (error) {
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
