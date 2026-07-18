import { DynamicModule, Global, Module, ModuleMetadata } from '@nestjs/common';
import {
  IApiKeyRepository,
  IPermissionRepository,
  IRoleGroupRepository,
  IRoleRepository,
  IUserRoleGroupRepository,
  IUserRoleRepository,
} from '@nabarun-ngo/nestjs-shared-auth';
import { ICommentRepository } from '@nabarun-ngo/nestjs-shared-comment';
import {
  IFormRepository,
  IFormSubmissionRepository,
} from '@nabarun-ngo/nestjs-shared-custom-forms';
import {
  INotificationRepository,
  IResourceSubscriptionRepository,
  IUserNotificationRepository,
} from '@nabarun-ngo/nestjs-shared-correspondence';
import { IDocumentRepository } from '@nabarun-ngo/nestjs-shared-dms';
import { IJsonDocumentRepository } from '@nabarun-ngo/nestjs-shared-json-store';
import {
  IOAuthAccountRepository,
  IOAuthTokenRepository,
} from '@nabarun-ngo/nestjs-shared-token-vault';
import {
  IWorkflowEventLogRepository,
  IWorkflowIdempotencyRepository,
  IWorkflowInboxRepository,
  IWorkflowInstanceRepository,
  IWorkflowOutboxRepository,
  IWorkflowTokenRepository,
} from '@nabarun-ngo/nestjs-shared-workflow';
import { ApiKeyPrismaRepository } from './auth/api-key.prisma-repository';
import { PermissionPrismaRepository } from './auth/permission.prisma-repository';
import { RoleGroupPrismaRepository } from './auth/role-group.prisma-repository';
import { RolePrismaRepository } from './auth/role.prisma-repository';
import { UserRoleGroupPrismaRepository } from './auth/user-role-group.prisma-repository';
import { UserRolePrismaRepository } from './auth/user-role.prisma-repository';
import { PrismaCommentRepository } from './comment/comment.prisma-repository';
import { NotificationPrismaRepository } from './correspondence/notification.prisma-repository';
import { ResourceSubscriptionPrismaRepository } from './correspondence/resource-subscription.prisma-repository';
import { UserNotificationPrismaRepository } from './correspondence/user-notification.prisma-repository';
import { FormPrismaRepository } from './custom-forms/form.prisma-repository';
import { FormSubmissionPrismaRepository } from './custom-forms/form-submission.prisma-repository';
import { DocumentPrismaRepository } from './dms/document.prisma-repository';
import { JsonDocumentPrismaRepository } from './json-store/json-document.prisma-repository';
import { OAuthAccountPrismaRepository } from './token-vault/oauth-account.prisma-repository';
import { OAuthTokenPrismaRepository } from './token-vault/oauth-token.prisma-repository';
import { WorkflowEventLogPrismaRepository } from './workflow/workflow-event-log.prisma-repository';
import { WorkflowIdempotencyPrismaRepository } from './workflow/workflow-idempotency.prisma-repository';
import { WorkflowInboxPrismaRepository } from './workflow/workflow-inbox.prisma-repository';
import { WorkflowInstancePrismaRepository } from './workflow/workflow-instance.prisma-repository';
import { WorkflowOutboxPrismaRepository } from './workflow/workflow-outbox.prisma-repository';
import { WorkflowTokenPrismaRepository } from './workflow/workflow-token.prisma-repository';

export interface PersistenceModuleOptions {
  /** Pass the same QueueModule.forRoot/forRootAsync dynamic module used by the app. */
  imports?: ModuleMetadata['imports'];
}

const REPOSITORY_PROVIDERS = [
  { provide: IOAuthAccountRepository, useClass: OAuthAccountPrismaRepository },
  { provide: IOAuthTokenRepository, useClass: OAuthTokenPrismaRepository },
  { provide: ICommentRepository, useClass: PrismaCommentRepository },
  { provide: IFormRepository, useClass: FormPrismaRepository },
  { provide: IFormSubmissionRepository, useClass: FormSubmissionPrismaRepository },
  { provide: IDocumentRepository, useClass: DocumentPrismaRepository },
  { provide: IJsonDocumentRepository, useClass: JsonDocumentPrismaRepository },
  { provide: INotificationRepository, useClass: NotificationPrismaRepository },
  { provide: IUserNotificationRepository, useClass: UserNotificationPrismaRepository },
  { provide: IResourceSubscriptionRepository, useClass: ResourceSubscriptionPrismaRepository },
  { provide: IRoleRepository, useClass: RolePrismaRepository },
  { provide: IRoleGroupRepository, useClass: RoleGroupPrismaRepository },
  { provide: IPermissionRepository, useClass: PermissionPrismaRepository },
  { provide: IUserRoleRepository, useClass: UserRolePrismaRepository },
  { provide: IUserRoleGroupRepository, useClass: UserRoleGroupPrismaRepository },
  { provide: IApiKeyRepository, useClass: ApiKeyPrismaRepository },
  { provide: IWorkflowInstanceRepository, useClass: WorkflowInstancePrismaRepository },
  { provide: IWorkflowEventLogRepository, useClass: WorkflowEventLogPrismaRepository },
  { provide: IWorkflowInboxRepository, useClass: WorkflowInboxPrismaRepository },
  { provide: IWorkflowTokenRepository, useClass: WorkflowTokenPrismaRepository },
  { provide: IWorkflowOutboxRepository, useClass: WorkflowOutboxPrismaRepository },
  { provide: IWorkflowIdempotencyRepository, useClass: WorkflowIdempotencyPrismaRepository },
] as const;


@Global()
@Module({})
export class PersistenceModule {
  static forRoot(options: PersistenceModuleOptions = {}): DynamicModule {
    return {
      module: PersistenceModule,
      imports: [...(options.imports ?? [])],
      providers: [...REPOSITORY_PROVIDERS],
      exports: REPOSITORY_PROVIDERS.map(({ provide }) => provide),
    };
  }
}
