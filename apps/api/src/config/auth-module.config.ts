import { AuthModule } from "@ce/nestjs-shared-auth";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Configkey } from "../shared/config-keys";

export const AUTH_MODULE = AuthModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        jwt: {
            jwksUri: config.getOrThrow(Configkey.JWT_JWKS_URI),
            issuer: config.getOrThrow(Configkey.JWT_ISSUER),
            audience: config.getOrThrow(Configkey.JWT_AUDIENCE),
        },
        recaptcha: {
            secretKey: config.getOrThrow(Configkey.GOOGLE_RECAPTCHA_SECURITY_KEY),
            minScore: config.get<number>(Configkey.RECAPTCHA_MIN_SCORE) ?? 0.65,
        },
        apiKey: {
            headerName: 'X-API-KEY',
        },
        cache: {
            userAccessTtlMs: 10 * 24 * 60 * 60 * 1000,
            emailVerificationTtlMs: 10 * 24 * 60 * 60 * 1000,
        },
    }),
});