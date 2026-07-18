import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@ce/nestjs-shared-persistence';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../shared/persistence/prisma/client';
import { Configkey } from '../shared/config-keys';
import { PersistenceModule } from '../shared/persistence/persistence.module';

const DATABASE_MODULE = DatabaseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        postgresUrl: config.getOrThrow<string>(Configkey.DATABASE_URL),
        redisUrl: config.getOrThrow<string>(Configkey.REDIS_URL),
        prismaClientFactory: (url: string) =>
            new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }),
        enableAuditExtension: config.get<boolean>(Configkey.ENABLE_DB_AUDIT) ?? false,
        auditedModels: config.get<string>(Configkey.DB_AUDIT_MODELS)?.split(',') ?? [],
        cacheStoreTtl: config.get<number>(Configkey.REDIS_CACHE_TTL) ?? 600_000,
        failOnAuditError: config.get<boolean>(Configkey.FAIL_ON_AUDIT_ERROR) ?? false,
    }),
});

export const PERSISTANCE_MODULE = PersistenceModule.forRoot({
    imports: [DATABASE_MODULE]
});