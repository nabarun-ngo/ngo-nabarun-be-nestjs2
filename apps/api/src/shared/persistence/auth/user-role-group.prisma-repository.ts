import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@nabarun-ngo/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  AuthUserRoleGroupWhereInput,
  AuthUserRoleGroupWhereUniqueInput,
  AuthUserRoleGroupCreateInput,
  AuthUserRoleGroupUncheckedCreateInput,
  AuthUserRoleGroupUpdateInput,
  AuthUserRoleGroupUncheckedUpdateInput,
  AuthUserRoleGroupOrderByWithRelationInput,
} from '../prisma/models';
import { UserRoleGroup, UserRoleGroupFilter } from '@nabarun-ngo/nestjs-shared-auth/domain/aggregates/user-role-group/user-role-group.aggregate';
import { UserRole } from '@nabarun-ngo/nestjs-shared-auth/domain/aggregates/user-role/user-role.aggregate';
import { GroupPermissionView, IUserRoleGroupRepository } from '@nabarun-ngo/nestjs-shared-auth/domain/repositories/user-role-group.repository';

type UserRoleGroupRow = {
  id: string;
  idpSub: string;
  ownerId: string | null;
  entityId: string | null;
  entityType: string | null;
  groupId: string;
  grantedAt: Date;
  revokedAt: Date | null;
  grantedBy: string | null;
  revokedBy: string | null;
  note: string | null;
};

@Injectable()
export class UserRoleGroupPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'authUserRoleGroup',
    UserRoleGroup,
    string,
    UserRoleGroupFilter,
    UserRoleGroupRow,
    AuthUserRoleGroupWhereInput,
    AuthUserRoleGroupWhereUniqueInput,
    ({} & AuthUserRoleGroupUncheckedCreateInput) | ({} & AuthUserRoleGroupCreateInput),
    ({} & AuthUserRoleGroupUncheckedUpdateInput) | ({} & AuthUserRoleGroupUpdateInput),
    AuthUserRoleGroupOrderByWithRelationInput
  >
  implements IUserRoleGroupRepository {
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'authUserRoleGroup');
  }

  protected toDomain(row: UserRoleGroupRow): UserRoleGroup {
    return new UserRoleGroup({
      id: row.id,
      idpSub: row.idpSub,
      ownerId: row.ownerId ?? undefined,
      entityId: row.entityId ?? undefined,
      entityType: row.entityType ?? undefined,
      groupId: row.groupId,
      grantedAt: row.grantedAt,
      revokedAt: row.revokedAt ?? undefined,
      grantedBy: row.grantedBy ?? undefined,
      revokedBy: row.revokedBy ?? undefined,
      note: row.note ?? undefined,
    });
  }

  protected toCreateInput(
    entity: UserRoleGroup,
  ): ({} & AuthUserRoleGroupUncheckedCreateInput) | ({} & AuthUserRoleGroupCreateInput) {
    return {
      id: entity.id,
      idpSub: entity.idpSub,
      ownerId: entity.ownerId ?? null,
      entityId: entity.entityId ?? null,
      entityType: entity.entityType ?? null,
      groupId: entity.groupId,
      grantedAt: entity.grantedAt,
      grantedBy: entity.grantedBy ?? null,
      note: entity.note ?? null,
    };
  }

  protected toUpdateInput(
    _id: string,
    entity: UserRoleGroup,
  ): ({} & AuthUserRoleGroupUncheckedUpdateInput) | ({} & AuthUserRoleGroupUpdateInput) {
    return {
      revokedAt: entity.revokedAt ?? null,
      revokedBy: entity.revokedBy ?? null,
      note: entity.note ?? null,
    };
  }

  protected toUniqueWhere(id: string): AuthUserRoleGroupWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: UserRoleGroupFilter): AuthUserRoleGroupWhereInput {
    return {
      ...(filter?.idpSub ? { idpSub: filter.idpSub } : {}),
      ...(filter?.groupId ? { groupId: filter.groupId } : {}),
      ...(filter?.ownerId ? { ownerId: filter.ownerId } : {}),
      ...(filter?.entityId ? { entityId: filter.entityId } : {}),
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.isActive === true ? { revokedAt: null } : {}),
    };
  }

  protected defaultOrderBy(): AuthUserRoleGroupOrderByWithRelationInput {
    return { grantedAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  async findActiveByIdPSub(idpSub: string): Promise<UserRoleGroup[]> {
    const rows = await this.delegate.findMany({ where: { idpSub, revokedAt: null } });
    return (rows as UserRoleGroupRow[]).map((r) => this.toDomain(r));
  }

  async resolveGroupPermissions(idpSub: string): Promise<GroupPermissionView[]> {
    const rows = await this.delegate.findMany({
      where: { idpSub, revokedAt: null },
      include: {
        group: {
          include: {
            roles: {
              include: {
                role: { include: { permissions: { include: { permission: true } } } },
              },
            },
          },
        },
      },
    });
    return (rows)
      .filter((r) => !r.group.deletedAt)
      .map((r) => {
        const activeRoles = r.group.roles.filter((rgr) => !rgr.role.deletedAt);
        return {
          groupKey: r.group.key as string,
          roleKeys: activeRoles.map((rgr) => rgr.role.key as string),
          permissionKeys: [
            ...new Set<string>(
              activeRoles.flatMap((rgr) =>
                rgr.role.permissions.map((rp) => rp.permission.key as string),
              ),
            ),
          ],
          ownerId: r.ownerId ?? undefined,
          entityId: (r).entityId ?? undefined,
          entityType: (r).entityType ?? undefined,
        };
      });
  }

  async revokeGroupMembership(idpSub: string, groupId: string, revokedBy?: string): Promise<void> {
    await (this.client).authUserRoleGroup.updateMany({
      where: { idpSub, groupId, revokedAt: null },
      data: { revokedAt: new Date(), ...(revokedBy ? { revokedBy } : {}) },
    });
  }

  async findIdPSubsByRoleKey(roleKey: string): Promise<string[]> {
    const rows = await (this.client).authUserRoleGroup.findMany({
      where: {
        revokedAt: null,
        group: {
          deletedAt: null,
          roles: { some: { role: { key: roleKey, deletedAt: null } } },
        },
      },
      select: { idpSub: true },
    });
    return rows.map((r) => r.idpSub);
  }

  async createMembershipWithRoles(membership: UserRoleGroup, userRoles: UserRole[]): Promise<void> {
    await this.$transaction(async (tx) => {
      await (tx).authUserRoleGroup.create({ data: this.toCreateInput(membership) });
      if (userRoles.length > 0) {
        await (tx).authUserRole.createMany({
          data: userRoles.map((ur) => ({
            id: ur.id,
            idpSub: ur.idpSub,
            ownerId: ur.ownerId ?? null,
            entityId: ur.entityId ?? null,
            entityType: ur.entityType ?? null,
            roleId: ur.roleId,
            sourceGroupId: ur.sourceGroupId ?? null,
            grantedAt: ur.grantedAt,
            grantedBy: ur.grantedBy ?? null,
            note: ur.note ?? null,
          })),
        });
      }
    });
  }
}
