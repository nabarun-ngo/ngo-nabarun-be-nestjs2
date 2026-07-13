import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  IApiKeyRepository,
  IPermissionRepository,
  IRoleGroupRepository,
  IRoleRepository,
  IUserRoleGroupRepository,
  IUserRoleRepository,
} from '@ce/nestjs-shared-auth';
import { ICommentRepository } from '@ce/nestjs-shared-comment';
import {
  ICustomFieldDefinitionRepository,
  ICustomFieldValueRepository,
} from '@ce/nestjs-shared-custom-fields';
import {
  INotificationRepository,
  IResourceSubscriptionRepository,
  IUserNotificationRepository,
} from '@ce/nestjs-shared-correspondence';
import { IDocumentRepository } from '@ce/nestjs-shared-dms';
import { IJsonDocumentRepository } from '@ce/nestjs-shared-json-store';
import {
  IOAuthAccountRepository,
  IOAuthTokenRepository,
} from '@ce/nestjs-shared-token-vault';
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
import { CustomFieldDefinitionPrismaRepository } from './custom-fields/custom-field-definition.prisma-repository';
import { CustomFieldValuePrismaRepository } from './custom-fields/custom-field-value.prisma-repository';
import { DocumentPrismaRepository } from './dms/document.prisma-repository';
import { JsonDocumentPrismaRepository } from './json-store/json-document.prisma-repository';
import { OAuthAccountPrismaRepository } from './token-vault/oauth-account.prisma-repository';
import { OAuthTokenPrismaRepository } from './token-vault/oauth-token.prisma-repository';

const REPOSITORY_PROVIDERS = [
  { provide: IOAuthAccountRepository, useClass: OAuthAccountPrismaRepository },
  { provide: IOAuthTokenRepository, useClass: OAuthTokenPrismaRepository },
  { provide: ICommentRepository, useClass: PrismaCommentRepository },
  { provide: ICustomFieldDefinitionRepository, useClass: CustomFieldDefinitionPrismaRepository },
  { provide: ICustomFieldValueRepository, useClass: CustomFieldValuePrismaRepository },
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
] as const;

@Global()
@Module({})
export class PersistenceModule {
  static forRoot(): DynamicModule {
    return {
      module: PersistenceModule,
      providers: [...REPOSITORY_PROVIDERS],
      exports: REPOSITORY_PROVIDERS.map(({ provide }) => provide),
    };
  }
}
