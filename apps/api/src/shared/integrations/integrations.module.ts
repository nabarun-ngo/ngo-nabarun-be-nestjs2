import { DynamicModule, Global, Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JsonStoreModule } from '@ce/nestjs-shared-json-store';
import { GOOGLE_SCOPES, TokenVaultModule } from '@ce/nestjs-shared-token-vault';
import { Configkey } from '../config-keys';
import { CACHE_PORT_PROVIDER } from './cache/cache-port.adapter';
import { CRON_JOB_STORE_PROVIDER } from './cron/json-store-cron-job.adapter';
import { CRON_JOB_QUEUE_PROVIDER } from './cron/queue-cron-job.adapter';
import { DISPATCH_QUEUE_PORT_PROVIDER } from './correspondence/queue-dispatch.adapter';
import { TEMPLATE_PORT_PROVIDER } from './correspondence/json-store-template.adapter';
import { ZodJsonDocumentPayloadValidatorAdapter } from './json-store/json-document-payload-validator.adapter';
import { OAUTH_ACCESS_TOKEN_PROVIDER } from './oauth/token-vault-oauth-access-token.adapter';
import { WORKFLOW_DEFINITION_PROVIDER } from './workflow/json-store-workflow-definition.adapter';
import { WORKFLOW_QUEUE_PROVIDER } from './workflow/queue-workflow-job.adapter';
import { WORKFLOW_FORM_DATA_PROVIDER } from './workflow/workflow-form-data.adapter';
import { WORKFLOW_USER_RESOLUTION_PROVIDER } from './workflow/workflow-user-resolution.adapter';
import { WORKFLOW_FORM_ACCESS_PROVIDER } from './workflow/workflow-form-access.adapter';
import { IUserReferenceDataPort } from '../../internal/user/application/ports/user-reference-data.port';
import { UserReferenceDataAdapter } from '../../internal/user/infrastructure/adapters/user-reference-data.adapter';
import { IFinanceReferenceDataPort } from '../../internal/finance/application/ports/finance-reference-data.port';
import { FinanceReferenceDataAdapter } from './finance/finance-reference-data.adapter';
import { IProjectReferenceDataPort } from '../../internal/project/application/ports/project-reference-data.port';
import { ProjectReferenceDataAdapter } from './project/project-reference-data.adapter';
import { IMeetingCalendarPort } from '../../internal/meeting/application/ports/meeting-calendar.port';
import { GoogleCalendarMeetingAdapter } from './meeting/google-calendar-meeting.adapter';

const PORT_PROVIDERS = [
  CACHE_PORT_PROVIDER,
  CRON_JOB_STORE_PROVIDER,
  CRON_JOB_QUEUE_PROVIDER,
  TEMPLATE_PORT_PROVIDER,
  DISPATCH_QUEUE_PORT_PROVIDER,
  OAUTH_ACCESS_TOKEN_PROVIDER,
  WORKFLOW_DEFINITION_PROVIDER,
  WORKFLOW_QUEUE_PROVIDER,
  WORKFLOW_FORM_DATA_PROVIDER,
  WORKFLOW_USER_RESOLUTION_PROVIDER,
  WORKFLOW_FORM_ACCESS_PROVIDER,
  { provide: IUserReferenceDataPort, useClass: UserReferenceDataAdapter },
  { provide: IFinanceReferenceDataPort, useClass: FinanceReferenceDataAdapter },
  { provide: IProjectReferenceDataPort, useClass: ProjectReferenceDataAdapter },
  { provide: IMeetingCalendarPort, useClass: GoogleCalendarMeetingAdapter },
];

const PORT_EXPORTS = PORT_PROVIDERS.map((p) => p.provide);

export interface IntegrationsModuleOptions {
  /** Pass the same QueueModule.forRoot/forRootAsync dynamic module used by the app. */
  imports?: ModuleMetadata['imports'];
}

/**
 * Global host wiring hub: binds cross-package port adapters and registers
 * JsonStore + TokenVault (non-global) for adapter consumption.
 */
@Global()
@Module({})
export class IntegrationsModule {
  static forRoot(options: IntegrationsModuleOptions = {}): DynamicModule {
    const jsonStoreModule = JsonStoreModule.forRoot({
      exposeController: true,
      payloadValidator: ZodJsonDocumentPayloadValidatorAdapter,
    });

    return {
      module: IntegrationsModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        CqrsModule,
        jsonStoreModule,
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
          }),
        }),
      ],
      providers: [...PORT_PROVIDERS],
      exports: [...PORT_EXPORTS, jsonStoreModule],
    };
  }
}
