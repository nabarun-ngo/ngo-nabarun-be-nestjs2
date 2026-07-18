import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { CoreModule, isProd } from '@ce/nestjs-shared-core';
import { DatabaseModule } from '@ce/nestjs-shared-persistence';
import { PersistenceModule } from './shared/persistence/persistence.module';
import { ObservabilityModule } from '@ce/nestjs-shared-observability';
import { DmsModule } from '@ce/nestjs-shared-dms';
import { CustomFormsModule } from '@ce/nestjs-shared-custom-forms';
import { QueueModule } from '@ce/nestjs-shared-queue';
import { CronModule } from '@ce/nestjs-shared-cron';
import { WorkflowModule } from '@ce/nestjs-shared-workflow';
import { PrismaClient } from './shared/persistence/prisma/client';
import { Configkey } from './shared/config-keys';
import { AuthModule } from '@ce/nestjs-shared-auth';
import { CommentModule } from '@ce/nestjs-shared-comment';
import { CorrespondenceModule } from '@ce/nestjs-shared-correspondence';
import { UserModule } from './modules/user/user.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ProjectModule } from './modules/project/project.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { LinksModule } from './modules/links/links.module';
import { WorkflowHostModule } from './modules/workflow/workflow-host.module';
import { IntegrationsModule } from './shared/integrations/integrations.module';
import { PublicSiteModule } from './modules/public-site/public-site.module';
import { DocumentGeneratorModule } from '@ce/nestjs-shared-document-generator';
import { join } from 'path';

const userModule = UserModule.forRootAsync({
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
const queueModule = QueueModule.forRootAsync({
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

const financeModule = FinanceModule.forRootAsync({
  imports: [ConfigModule, userModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    defaultDonationAmount: config.get<number>(Configkey.PROP_DONATION_AMOUNT) ?? 500,
  }),
});

const workflowModule = WorkflowModule.forRoot(
  { defaultTimezone: 'Asia/Kolkata' },
  { queueModule },
);

const meetingModule = MeetingModule.forRootAsync({
  imports: [ConfigModule, queueModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    timezone: 'Asia/Kolkata',
    mockAttendeesInNonProd: !(
      config.get<boolean>(Configkey.ENABLE_PROD_MODE) ?? isProd(config.getOrThrow<string>(Configkey.NODE_ENV))
    ),
    mockedAttendeeEmail: config.get<string>(Configkey.MOCKED_EMAIL_ADDRESS),
  }),
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    DocumentGeneratorModule.forRoot({
      watermarkPath: join(process.cwd(), 'src/assets/watermark.png'),
    }),
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
          userAccessTtlMs: 10 * 24 * 60 * 60 * 1000,
          emailVerificationTtlMs: 10 * 24 * 60 * 60 * 1000,
        },
      }),
    }),
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
        dedupeIntervalMs: 120_000,
      }),
    }),
    queueModule,
    IntegrationsModule.forRoot({ imports: [queueModule] }),
    DmsModule.forRootAsync({
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
    }),
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
        {
          entityType: 'announcement',
        },
      ],
      notifications: {
        mentionTemplateKey: 'COMMENT_MENTION',
        subscriberTemplateKey: 'COMMENT_ADDED',
        notifySubscribers: true,
      },
    }),
    CustomFormsModule.forRootAsync({
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
    }),
    workflowModule,
    WorkflowHostModule.forRoot({ imports: [workflowModule] }),
    CronModule.forRoot({
      timezone: 'Asia/Kolkata',
    }),
    userModule,
    financeModule,
    ReportingModule.forRoot({ imports: [workflowModule] }),
    ProjectModule.forRoot({ imports: [financeModule, queueModule] }),
    meetingModule,
    LinksModule.forRoot(),
    CorrespondenceModule.forRootAsync(
      {
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
            enableProdMode:
              config.get<boolean>(Configkey.ENABLE_PROD_MODE) ??
              isProd(config.getOrThrow<string>(Configkey.NODE_ENV)) ??
              false,
          },
          push: {
            oneSignal: {
              appId: config.getOrThrow<string>(Configkey.ONESIGNAL_APP_ID),
              apiKey: config.getOrThrow<string>(Configkey.ONESIGNAL_REST_API_KEY),
            },
          },
        }),
      },
      { queueModule },
    ),
    PublicSiteModule.forRoot({ imports: [workflowModule] }),
  ],
})
export class AppModule { }
