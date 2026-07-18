import { ObservabilityModule } from "@ce/nestjs-shared-observability";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { isProd } from "@ce/nestjs-shared-core";
import { Configkey } from "../shared/config-keys";

export const OBS_MODULE = ObservabilityModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        enabled: isProd(config.getOrThrow<string>(Configkey.NODE_ENV)),
        environment: config.getOrThrow<string>(Configkey.NODE_ENV),
        slack: {
            webhookUrl: config.getOrThrow<string>(Configkey.SLACK_WEBHOOK_URL),
        },
        mentionChannel: true,
        dedupeIntervalMs: 120_000,
    }),
});