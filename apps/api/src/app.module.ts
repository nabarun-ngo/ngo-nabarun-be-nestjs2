import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { CoreModule, isProd } from '@ce/nestjs-shared-core';
import { DatabaseModule } from '@ce/nestjs-shared-persistence';
import { PersistenceModule } from './persistence/persistence.module';
import { ObservabilityModule } from '@ce/nestjs-shared-observability';
import { GOOGLE_SCOPES, TokenVaultModule } from '@ce/nestjs-shared-token-vault';
import { DmsModule } from '@ce/nestjs-shared-dms';
import { CustomFieldsModule, CustomFieldType } from '@ce/nestjs-shared-custom-fields';
import { JsonStoreModule } from '@ce/nestjs-shared-json-store';
import { QueueModule } from '@ce/nestjs-shared-queue';
import { CronModule } from '@ce/nestjs-shared-cron';
import { PrismaClient } from './persistence/prisma/client';
import { Configkey } from './shared/config-keys';
import { AuthModule } from '@ce/nestjs-shared-auth';
import { CommentModule } from '@ce/nestjs-shared-comment';
import { CorrespondenceModule } from '@ce/nestjs-shared-correspondence';
import { UserModule } from './modules/user/user.module';


@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),
    // ── Core — global exception filter, timing interceptor ───────────────────
    CoreModule,
    // ── Database — Prisma 7 + Redis + Cache ──────────────────────────────────
    DatabaseModule.forRootAsync({
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
    }),
    PersistenceModule.forRoot(),
    // ── Auth2 — JWT / Auth0 + RBAC ───────────────────────────────────────────
    AuthModule.forRootAsync({
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
          userAccessTtlMs: 10 * 24 * 60 * 60 * 1000,//10 day
          emailVerificationTtlMs: 10 * 24 * 60 * 60 * 1000,//10 days
        }
      }),
    }),
    // ── Observability — Slack alerts on AppTechnicalError ────────────────────
    ObservabilityModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: isProd(config.getOrThrow<string>(Configkey.NODE_ENV)),
        environment: config.getOrThrow<string>(Configkey.NODE_ENV),
        slack: {
          webhookUrl: config.getOrThrow<string>(Configkey.SLACK_WEBHOOK_URL),
        },
        mentionChannel: true,
        dedupeIntervalMs: 120_000,  // 2 minutes between identical alerts
      }),
    }),
    // ── Token Vault — Google / Microsoft OAuth ───────────────────────────────
    TokenVaultModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        encryption: {
          secret: cfg.getOrThrow<string>(Configkey.APP_SECRET),
        },
        googleOAuth: {
          clientId: cfg.getOrThrow<string>(Configkey.GOOGLE_CLIENT_ID),
          clientSecret: cfg.getOrThrow<string>(Configkey.GOOGLE_CLIENT_SECRET),
          callbackUrl: `${cfg.getOrThrow<string>(Configkey.APP_BE_URL).replace(/\/$/, '')}/auth/oauth/google/callback`,
          allowedScopes: [
            GOOGLE_SCOPES.gmailSend,
            GOOGLE_SCOPES.driveFile,
            GOOGLE_SCOPES.calendarEvents,
          ],
        },
      })
    }),
    // ── DMS — document management (Firebase Storage) ─────────────────────────
    DmsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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
        ],
      }),
    }),

    // ── Comment — threaded comments with @mentions ───────────────────────────
    CommentModule.forRoot({
      allowedEntityTypes: [
        {
          entityType: 'donation',
          readPermissions: ['donations:read'],
          writePermissions: ['donations:comment'],
        },
        {
          entityType: 'task',
          readPermissions: ['tasks:read'],
          writePermissions: ['tasks:write'],
        },
        // An entity type with no permission gates (anyone authenticated can comment):
        {
          entityType: 'announcement',
        },
      ],
      notifications: {
        mentionTemplateKey: 'COMMENT_MENTION',       // optional, this is the default
        subscriberTemplateKey: 'COMMENT_ADDED',       // optional, this is the default
        notifySubscribers: true,                      // optional, defaults to true
      },
    }),

    // ── Custom Fields — admin-configurable EAV fields ────────────────────────
    CustomFieldsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        entityTypes: [
          {
            entityType: 'donation',
            managePermissions: ['admin:donations'],
            writePermissions: ['write:donations'],
            readPermissions: ['read:donations'],
            maxFields: 25,
          },
        ],
        encryptionKey: config.get<string>(Configkey.APP_SECRET),
        globalAllowedFieldTypes: [
          CustomFieldType.Boolean,
          CustomFieldType.Date,
          CustomFieldType.Number,
          CustomFieldType.Text,
          CustomFieldType.Select,
          CustomFieldType.Multiselect,
        ],
        globalMaxFieldsPerEntityType: 25,
      }),
    }),
    // ── JSON Store — typed per-entity JSON documents ─────────────────────────
    JsonStoreModule.forRoot({ exposeController: true }),
    // ── Queue + Cron — BullMQ job processing and scheduled jobs ──────────────
    QueueModule.forRootAsync({
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
    }),
    // ── Cron — scheduled jobs ───────────────────────────────────────────────
    CronModule.forRoot({
      timezone: 'Asia/Kolkata',
    }),
    // ── User — profile management, Auth0 provisioning, JWT enrichment ─────────
    // Must be registered AFTER AuthModule so IJwtVerifierPort override wins.
    UserModule.forRootAsync({
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
            // staff: { name: 'staff-internal-db', type: 'password' },
          },
        },
        defaultRoleKeys: ['MEMBER'],
        passwordExpiresInDays: 90,
      }),
    }),
    // ── Correspondence — email, SMS, and push notifications ──────────────────
    CorrespondenceModule.forRootAsync({
      imports: [ConfigModule, UserModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        appName: config.get(Configkey.APP_NAME),
        environment: config.getOrThrow<string>(Configkey.NODE_ENV),
        email: {
          fromName: config.getOrThrow(Configkey.APP_NAME),
          fromAddress: config.get(Configkey.EMAIL_SENDER),
          enableMocking: config.getOrThrow(Configkey.ENABLE_EMAIL_MOCKING),
          mockedAddress: config.getOrThrow(Configkey.MOCKED_EMAIL_ADDRESS),
          enableProdMode: config.get<boolean>(Configkey.ENABLE_PROD_MODE) ?? isProd(config.getOrThrow<string>(Configkey.NODE_ENV)) ?? false,
        },
        push: {
          oneSignal: {
            appId: config.getOrThrow<string>(Configkey.ONESIGNAL_APP_ID),
            apiKey: config.getOrThrow<string>(Configkey.ONESIGNAL_REST_API_KEY),
          },
        },
        queue: {
          concurrency: 1,
          connection: {
            url: config.getOrThrow<string>(Configkey.REDIS_URL),
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        },
      }),
    }),
  ],
})
export class AppModule { }
