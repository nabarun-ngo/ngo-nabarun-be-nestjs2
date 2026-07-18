import { QueueModule } from "@ce/nestjs-shared-queue";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Configkey } from "../shared/config-keys";

export const QUEUE_MODULE = QueueModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        connection: {
            url: config.getOrThrow<string>(Configkey.REDIS_URL),
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        },
        concurrency: 1,
    }),
});