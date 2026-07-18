import { CustomFormsModule } from "@nabarun-ngo/nestjs-shared-custom-forms";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Configkey } from "../shared/config-keys";

export const CUSTOM_FORM_MODULE = CustomFormsModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        entityTypes: [
            { entityType: 'donation' },
            { entityType: 'workflow', displayName: 'Workflow' },
            { entityType: 'public_site', displayName: 'Public Site' },
        ],
        encryptionKey: config.get<string>(Configkey.APP_SECRET),
    }),
})