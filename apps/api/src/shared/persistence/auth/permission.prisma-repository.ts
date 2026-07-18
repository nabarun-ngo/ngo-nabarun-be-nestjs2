import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@nabarun-ngo/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthPermissionWhereInput,
  AuthPermissionWhereUniqueInput,
  AuthPermissionCreateInput,
  AuthPermissionUncheckedCreateInput,
  AuthPermissionUpdateInput,
  AuthPermissionUncheckedUpdateInput,
  AuthPermissionOrderByWithRelationInput,
} from '../prisma/models';
import { Permission, PermissionFilter } from '@nabarun-ngo/nestjs-shared-auth/domain/aggregates/permission/permission.aggregate';
import { IPermissionRepository } from '@nabarun-ngo/nestjs-shared-auth/domain/repositories/permission.repository';

type PermissionRow = {
  id: string;
  key: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PermissionPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authPermission',
    Permission,
    string,
    PermissionFilter,
    PermissionRow,
    AuthPermissionWhereInput,
    AuthPermissionWhereUniqueInput,
    ({} & AuthPermissionUncheckedCreateInput) | ({} & AuthPermissionCreateInput),
    ({} & AuthPermissionUncheckedUpdateInput) | ({} & AuthPermissionUpdateInput),
    AuthPermissionOrderByWithRelationInput
  >
  implements IPermissionRepository {
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authPermission');
  }

  protected toDomain(row: PermissionRow): Permission {
    return new Permission({
      id: row.id,
      key: row.key,
      description: row.description ?? undefined,
      deletedAt: row.deletedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  protected toCreateInput(
    entity: Permission,
  ): ({} & AuthPermissionUncheckedCreateInput) | ({} & AuthPermissionCreateInput) {
    return { id: entity.id, key: entity.key, description: entity.description ?? null };
  }

  protected toUpdateInput(
    _id: string,
    entity: Permission,
  ): ({} & AuthPermissionUncheckedUpdateInput) | ({} & AuthPermissionUpdateInput) {
    return {
      description: entity.description ?? null,
      deletedAt: entity.deletedAt ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): AuthPermissionWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: PermissionFilter): AuthPermissionWhereInput {
    return {
      ...(filter?.key ? { key: { contains: filter.key, mode: 'insensitive' } } : {}),
      ...(filter?.isActive === true ? { deletedAt: null } : {}),
    };
  }

  protected defaultOrderBy(): AuthPermissionOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByKey(key: string): Promise<Permission | null> {
    const row = await this.delegate.findUnique({ where: { key } });
    return row ? this.toDomain(row as PermissionRow) : null;
  }
}
