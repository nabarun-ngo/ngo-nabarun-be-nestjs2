import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthApiKeyWhereInput,
  AuthApiKeyWhereUniqueInput,
  AuthApiKeyCreateInput,
  AuthApiKeyUncheckedCreateInput,
  AuthApiKeyUpdateInput,
  AuthApiKeyUncheckedUpdateInput,
  AuthApiKeyOrderByWithRelationInput,
} from '../prisma/models';
import { ApiKey, ApiKeyFilter } from '@ce/nestjs-shared-auth/domain/aggregates/api-key/api-key.aggregate';
import { IApiKeyRepository } from '@ce/nestjs-shared-auth/domain/repositories/api-key.repository';

type ApiKeyRow = {
  id: string;
  name: string;
  apiKey: string;
  apiKeyId: string;
  permissions: string[];
  createdBy: string | null;
  ownerId: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ApiKeyPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authApiKey',
    ApiKey,
    string,
    ApiKeyFilter,
    ApiKeyRow,
    AuthApiKeyWhereInput,
    AuthApiKeyWhereUniqueInput,
    ({} & AuthApiKeyUncheckedCreateInput) | ({} & AuthApiKeyCreateInput),
    ({} & AuthApiKeyUncheckedUpdateInput) | ({} & AuthApiKeyUpdateInput),
    AuthApiKeyOrderByWithRelationInput
  >
  implements IApiKeyRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authApiKey');
  }

  protected toDomain(row: ApiKeyRow): ApiKey {
    return new ApiKey({
      id: row.id,
      name: row.name,
      key: row.apiKey,
      keyId: row.apiKeyId,
      permissions: row.permissions,
      createdBy: row.createdBy ?? undefined,
      ownerId: row.ownerId ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
      lastUsedAt: row.lastUsedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  protected toCreateInput(
    entity: ApiKey,
  ): ({} & AuthApiKeyUncheckedCreateInput) | ({} & AuthApiKeyCreateInput) {
    return {
      id: entity.id,
      name: entity.name,
      apiKey: entity.key,
      apiKeyId: entity.keyId,
      permissions: entity.permissions,
      createdBy: entity.createdBy ?? null,
      ownerId: entity.ownerId ?? null,
      expiresAt: entity.expiresAt ?? null,
      lastUsedAt: entity.lastUsedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUpdateInput(
    _id: string,
    entity: ApiKey,
  ): ({} & AuthApiKeyUncheckedUpdateInput) | ({} & AuthApiKeyUpdateInput) {
    return {
      name: entity.name,
      permissions: entity.permissions,
      expiresAt: entity.expiresAt ?? null,
      lastUsedAt: entity.lastUsedAt ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): AuthApiKeyWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: ApiKeyFilter): AuthApiKeyWhereInput {
    return {
      ...(filter?.name ? { name: { contains: filter.name, mode: 'insensitive' } } : {}),
      ...(filter?.permissions ? { permissions: { hasSome: filter.permissions } } : {}),
      ...(filter?.ownerId ? { ownerId: filter.ownerId } : {}),
    };
  }

  protected defaultOrderBy(): AuthApiKeyOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  async findByKeyId(keyId: string): Promise<ApiKey | null> {
    const row = await this.delegate.findUnique({ where: { apiKeyId: keyId } });
    return row ? this.toDomain(row as ApiKeyRow) : null;
  }
}
