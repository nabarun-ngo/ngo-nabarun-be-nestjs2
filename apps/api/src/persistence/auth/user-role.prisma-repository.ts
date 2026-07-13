import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthUserRoleWhereInput,
  AuthUserRoleWhereUniqueInput,
  AuthUserRoleCreateInput,
  AuthUserRoleUncheckedCreateInput,
  AuthUserRoleUpdateInput,
  AuthUserRoleUncheckedUpdateInput,
  AuthUserRoleOrderByWithRelationInput,
} from '../prisma/models';
import { UserRole, UserRoleFilter } from '@ce/nestjs-shared-auth/domain/aggregates/user-role/user-role.aggregate';
import { DirectRolePermissionView, IUserRoleRepository } from '@ce/nestjs-shared-auth/domain/repositories/user-role.repository';

type UserRoleRow = {
  id: string;
  idpSub: string;
  ownerId: string | null;
  entityId: string | null;
  entityType: string | null;
  roleId: string;
  sourceGroupId: string | null;
  grantedAt: Date;
  revokedAt: Date | null;
  grantedBy: string | null;
  revokedBy: string | null;
  note: string | null;
};

@Injectable()
export class UserRolePrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authUserRole',
    UserRole,
    string,
    UserRoleFilter,
    UserRoleRow,
    AuthUserRoleWhereInput,
    AuthUserRoleWhereUniqueInput,
    ({} & AuthUserRoleUncheckedCreateInput) | ({} & AuthUserRoleCreateInput),
    ({} & AuthUserRoleUncheckedUpdateInput) | ({} & AuthUserRoleUpdateInput),
    AuthUserRoleOrderByWithRelationInput
  >
  implements IUserRoleRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authUserRole');
  }

  protected toDomain(row: UserRoleRow): UserRole {
    return new UserRole({
      id: row.id,
      idpSub: row.idpSub,
      ownerId: row.ownerId ?? undefined,
      entityId: row.entityId ?? undefined,
      entityType: row.entityType ?? undefined,
      roleId: row.roleId,
      sourceGroupId: row.sourceGroupId ?? undefined,
      grantedAt: row.grantedAt,
      revokedAt: row.revokedAt ?? undefined,
      grantedBy: row.grantedBy ?? undefined,
      revokedBy: row.revokedBy ?? undefined,
      note: row.note ?? undefined,
    });
  }

  protected toCreateInput(
    entity: UserRole,
  ): ({} & AuthUserRoleUncheckedCreateInput) | ({} & AuthUserRoleCreateInput) {
    return {
      id: entity.id,
      idpSub: entity.idpSub,
      ownerId: entity.ownerId ?? null,
      entityId: entity.entityId ?? null,
      entityType: entity.entityType ?? null,
      roleId: entity.roleId,
      sourceGroupId: entity.sourceGroupId ?? null,
      grantedAt: entity.grantedAt,
      grantedBy: entity.grantedBy ?? null,
      note: entity.note ?? null,
    };
  }

  protected toUpdateInput(
    _id: string,
    entity: UserRole,
  ): ({} & AuthUserRoleUncheckedUpdateInput) | ({} & AuthUserRoleUpdateInput) {
    return {
      revokedAt: entity.revokedAt ?? null,
      revokedBy: entity.revokedBy ?? null,
      note: entity.note ?? null,
    };
  }

  protected toUniqueWhere(id: string): AuthUserRoleWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: UserRoleFilter): AuthUserRoleWhereInput {
    return {
      ...(filter?.idpSub ? { idpSub: filter.idpSub } : {}),
      ...(filter?.roleId ? { roleId: filter.roleId } : {}),
      ...(filter?.ownerId ? { ownerId: filter.ownerId } : {}),
      ...(filter?.entityId ? { entityId: filter.entityId } : {}),
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.sourceGroupId ? { sourceGroupId: filter.sourceGroupId } : {}),
      ...(filter?.isActive === true ? { revokedAt: null } : {}),
    };
  }

  protected defaultOrderBy(): AuthUserRoleOrderByWithRelationInput {
    return { grantedAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  async findActiveByIdPSub(idpSub: string): Promise<UserRole[]> {
    const rows = await this.delegate.findMany({ where: { idpSub, revokedAt: null } });
    return (rows as UserRoleRow[]).map((r) => this.toDomain(r));
  }

  async resolveDirectPermissions(idpSub: string): Promise<DirectRolePermissionView[]> {
    const rows = await this.delegate.findMany({
      where: { idpSub, revokedAt: null, sourceGroupId: null },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    return (rows)
      .filter((r) => !r.role.deletedAt)
      .map((r) => ({
        roleKey: r.role.key as string,
        permissionKeys: r.role.permissions.map((rp) => rp.permission.key as string),
        ownerId: r.ownerId ?? undefined,
        entityId: (r).entityId ?? undefined,
        entityType: (r).entityType ?? undefined,
      }));
  }

  async bulkCreate(userRoles: UserRole[]): Promise<void> {
    await (this.client).authUserRole.createMany({
      data: userRoles.map((entity) => ({
        id: entity.id,
        idpSub: entity.idpSub,
        ownerId: entity.ownerId ?? null,
        entityId: entity.entityId ?? null,
        entityType: entity.entityType ?? null,
        roleId: entity.roleId,
        sourceGroupId: entity.sourceGroupId ?? null,
        grantedAt: entity.grantedAt,
        grantedBy: entity.grantedBy ?? null,
        note: entity.note ?? null,
      })),
    });
  }

  async revokeSourcedRoles(idpSub: string, sourceGroupId: string, revokedBy?: string): Promise<void> {
    await (this.client).authUserRole.updateMany({
      where: { idpSub, sourceGroupId, revokedAt: null },
      data: { revokedAt: new Date(), ...(revokedBy ? { revokedBy } : {}) },
    });
  }

  async findIdPSubsByRoleKey(roleKey: string): Promise<string[]> {
    const rows = await this.delegate.findMany({
      where: { role: { key: roleKey }, revokedAt: null },
      select: { idpSub: true },
    });
    return rows.map((r) => (r as { idpSub: string }).idpSub);
  }
}
