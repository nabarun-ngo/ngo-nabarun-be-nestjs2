import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { UserRole } from '../aggregates/user-role/user-role.aggregate';

export type UserRoleGrantedSnapshot = Pick<UserRole, 'id' | 'idpSub' | 'roleId' | 'ownerId'>;

export class UserRoleGrantedEvent extends DomainEvent<UserRoleGrantedSnapshot> {
  constructor(snapshot: UserRoleGrantedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
