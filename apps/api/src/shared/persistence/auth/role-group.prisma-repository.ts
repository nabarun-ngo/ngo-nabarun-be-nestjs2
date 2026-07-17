import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthRoleGroupWhereInput,
  AuthRoleGroupWhereUniqueInput,
  AuthRoleGroupCreateInput,
  AuthRoleGroupUncheckedCreateInput,
  AuthRoleGroupUpdateInput,
  AuthRoleGroupUncheckedUpdateInput,
  AuthRoleGroupOrderByWithRelationInput,
} from '../prisma/models';
import { RoleGroup, RoleGroupFilter } from '@ce/nestjs-shared-auth/domain/aggregates/role-group/role-group.aggregate';
import { IRoleGroupRepository } from '@ce/nestjs-shared-auth/domain/repositories/role-group.repository';

type RoleGroupRow = {
  id: string;
  key: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: Array<{ role: { key: string } }>;
};

@Injectable()
export class RoleGroupPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authRoleGroup',
    RoleGroup,
    string,
    RoleGroupFilter,
    RoleGroupRow,
    AuthRoleGroupWhereInput,
    AuthRoleGroupWhereUniqueInput,
    ({} & AuthRoleGroupUncheckedCreateInput) | ({} & AuthRoleGroupCreateInput),
    ({} & AuthRoleGroupUncheckedUpdateInput) | ({} & AuthRoleGroupUpdateInput),
    AuthRoleGroupOrderByWithRelationInput
  >
  implements IRoleGroupRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authRoleGroup');
  }

  protected toDomain(row: RoleGroupRow): RoleGroup {
    const group = new RoleGroup({
      id: row.id,
      key: row.key,
      description: row.description ?? undefined,
      deletedAt: row.deletedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    if (row.roles) {
      group.withRoleKeys(row.roles.map((r) => r.role.key));
    }
    return group;
  }

  protected toCreateInput(
    entity: RoleGroup,
  ): ({} & AuthRoleGroupUncheckedCreateInput) | ({} & AuthRoleGroupCreateInput) {
    return { id: entity.id, key: entity.key, description: entity.description ?? null };
  }

  protected toUpdateInput(
    _id: string,
    entity: RoleGroup,
  ): ({} & AuthRoleGroupUncheckedUpdateInput) | ({} & AuthRoleGroupUpdateInput) {
    return {
      description: entity.description ?? null,
      deletedAt: entity.deletedAt ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): AuthRoleGroupWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: RoleGroupFilter): AuthRoleGroupWhereInput {
    return {
      ...(filter?.key ? { key: { contains: filter.key, mode: 'insensitive' } } : {}),
      ...(filter?.isActive === true ? { deletedAt: null } : {}),
    };
  }

  protected defaultOrderBy(): AuthRoleGroupOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByKey(key: string): Promise<RoleGroup | null> {
    const row = await this.delegate.findUnique({ where: { key } });
    return row ? this.toDomain(row as RoleGroupRow) : null;
  }

  async findWithRoles(key: string): Promise<RoleGroup | null> {
    const row = await this.delegate.findUnique({
      where: { key },
      include: { roles: { include: { role: true } } },
    });
    return row ? this.toDomain(row as RoleGroupRow) : null;
  }

  async findWithRolesById(id: string): Promise<RoleGroup | null> {
    const row = await this.delegate.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return row ? this.toDomain(row as RoleGroupRow) : null;
  }

  async syncRoles(groupId: string, roleIds: string[]): Promise<void> {
    await (this.client).$transaction([
      (this.client).authRoleGroupRole.deleteMany({ where: { groupId } }),
      (this.client).authRoleGroupRole.createMany({
        data: roleIds.map((roleId) => ({ groupId, roleId })),
      }),
    ]);
  }
}
