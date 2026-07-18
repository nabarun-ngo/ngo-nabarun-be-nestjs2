import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import { UserStatus } from '../enums/user-status.enum';

export type UserStatusChangedSnapshot = {
  readonly userId: string;
  readonly idpSub: string | undefined;
  readonly previousStatus: UserStatus;
  readonly newStatus: UserStatus;
};

export class UserStatusChangedEvent extends DomainEvent<UserStatusChangedSnapshot> {
  constructor(
    public readonly userId: string,
    public readonly idpSub: string | undefined,
    public readonly previousStatus: UserStatus,
    public readonly newStatus: UserStatus,
  ) {
    super(userId, { userId, idpSub, previousStatus, newStatus });
  }
}
