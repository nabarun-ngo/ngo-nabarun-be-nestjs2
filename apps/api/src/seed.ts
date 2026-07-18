import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./shared/persistence/prisma/client";
import { seedAuth } from "./shared/seeds/auth/auth.seeder";
import { seedJsonStore } from "./shared/seeds/json-store/json-store.seeder";

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

async function main() {
    // Auth2 seeding
    await seedAuth(prisma);
    // JsonStore seeding
    await seedJsonStore(prisma);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());