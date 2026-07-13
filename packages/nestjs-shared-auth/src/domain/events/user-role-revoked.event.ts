import { DomainEvent } from '@ce/nestjs-shared-core';
import type { UserRole } from '../aggregates/user-role/user-role.aggregate';

export type UserRoleRevokedSnapshot = Pick<UserRole, 'id' | 'idpSub' | 'roleId' | 'ownerId'>;

export class UserRoleRevokedEvent extends DomainEvent<UserRoleRevokedSnapshot> {
  constructor(snapshot: UserRoleRevokedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
