import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserModule } from "../modules/user/user.module";
import { Configkey } from "../shared/config-keys";

export const USER_MODULE = UserModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        idp: {
            domain: config.getOrThrow(Configkey.AUTH0_DOMAIN),
            clientId: config.getOrThrow(Configkey.AUTH0_MANAGEMENT_CLIENT_ID),
            clientSecret: config.getOrThrow(Configkey.AUTH0_MANAGEMENT_CLIENT_SECRET),
            connections: {
                default: { name: 'Username-Password-Authentication', type: 'password' },
                passwordless: { name: 'email', type: 'passwordless' },
            },
        },
        defaultRoleKeys: ['MEMBER'],
        passwordExpiresInDays: 90,
    }),
});