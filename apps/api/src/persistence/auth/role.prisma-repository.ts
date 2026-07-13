import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthRoleWhereInput,
  AuthRoleWhereUniqueInput,
  AuthRoleCreateInput,
  AuthRoleUncheckedCreateInput,
  AuthRoleUpdateInput,
  AuthRoleUncheckedUpdateInput,
  AuthRoleOrderByWithRelationInput,
} from '../prisma/models';
import { Role, RoleFilter } from '@ce/nestjs-shared-auth/domain/aggregates/role/role.aggregate';
import { IRoleRepository } from '@ce/nestjs-shared-auth/domain/repositories/role.repository';

type RoleRow = {
  id: string;
  key: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Array<{ permission: { key: string } }>;
};

@Injectable()
export class RolePrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authRole',
    Role,
    string,
    RoleFilter,
    RoleRow,
    AuthRoleWhereInput,
    AuthRoleWhereUniqueInput,
    ({} & AuthRoleUncheckedCreateInput) | ({} & AuthRoleCreateInput),
    ({} & AuthRoleUncheckedUpdateInput) | ({} & AuthRoleUpdateInput),
    AuthRoleOrderByWithRelationInput
  >
  implements IRoleRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authRole');
  }

  protected toDomain(row: RoleRow): Role {
    const role = new Role({
      id: row.id,
      key: row.key,
      description: row.description ?? undefined,
      deletedAt: row.deletedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    if (row.permissions) {
      role.withPermissionKeys(row.permissions.map((rp) => rp.permission.key));
    }
    return role;
  }

  protected toCreateInput(
    entity: Role,
  ): ({} & AuthRoleUncheckedCreateInput) | ({} & AuthRoleCreateInput) {
    return { id: entity.id, key: entity.key, description: entity.description ?? null };
  }

  protected toUpdateInput(
    _id: string,
    entity: Role,
  ): ({} & AuthRoleUncheckedUpdateInput) | ({} & AuthRoleUpdateInput) {
    return {
      description: entity.description ?? null,
      deletedAt: entity.deletedAt ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): AuthRoleWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: RoleFilter): AuthRoleWhereInput {
    return {
      ...(filter?.key ? { key: { contains: filter.key, mode: 'insensitive' } } : {}),
      ...(filter?.isActive === true ? { deletedAt: null } : {}),
    };
  }

  protected defaultOrderBy(): AuthRoleOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByKey(key: string): Promise<Role | null> {
    const row = await this.delegate.findUnique({ where: { key } });
    return row ? this.toDomain(row as RoleRow) : null;
  }

  async findWithPermissions(key: string): Promise<Role | null> {
    const row = await this.delegate.findUnique({
      where: { key },
      include: { permissions: { include: { permission: true } } },
    });
    return row ? this.toDomain(row as RoleRow) : null;
  }

  async findWithPermissionsById(id: string): Promise<Role | null> {
    const row = await this.delegate.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return row ? this.toDomain(row as RoleRow) : null;
  }

  async syncPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await (this.client).$transaction([
      (this.client).authRolePermission.deleteMany({ where: { roleId } }),
      (this.client).authRolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);
  }
}
