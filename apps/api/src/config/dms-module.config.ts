import { DmsModule } from "@ce/nestjs-shared-dms";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Configkey } from "../shared/config-keys";

export const DMS_MODULE = DmsModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        provider: 'firebase',
        maxFileSizeMb: config.get<number>(Configkey.MAX_FILE_SIZE_MB) ?? 10,
        firebase: {
            serviceAccount: config.getOrThrow<string>(Configkey.FIREBASE_CREDENTIAL),
            storageBucket: config.getOrThrow<string>(Configkey.FIREBASE_FILESTORAGE_BUCKET),
        },
        allowedEntityTypes: [
            {
                entityType: 'case',
                readPermissions: ['read:documents'],
                writePermissions: ['create:documents'],
                maxDocumentsPerEntity: 10,
            },
            {
                entityType: 'report',
                readPermissions: ['read:reports'],
                writePermissions: ['create:reports'],
                maxDocumentsPerEntity: 20,
            },
        ],
    }),
});