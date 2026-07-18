import { ConfigModule, ConfigService } from "@nestjs/config";
import { QUEUE_MODULE } from "./queue-module.config";
import { isProd } from "@nabarun-ngo/nestjs-shared-core";
import { MeetingModule } from "../modules/meeting/meeting.module";
import { Configkey } from "../shared/config-keys";

export const MEETING_MODULE = MeetingModule.forRootAsync({
    imports: [ConfigModule, QUEUE_MODULE],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        timezone: 'Asia/Kolkata',
        mockAttendeesInNonProd: !(
            config.get<boolean>(Configkey.ENABLE_PROD_MODE) ?? isProd(config.getOrThrow<string>(Configkey.NODE_ENV))
        ),
        mockedAttendeeEmail: config.get<string>(Configkey.MOCKED_EMAIL_ADDRESS),
    }),
});