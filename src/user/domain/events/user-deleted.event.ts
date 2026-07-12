import { DomainEvent } from 'nestjs-shared/core';

export type UserDeletedSnapshot = {
  readonly userId: string;
  readonly email: string;
  readonly idpSub: string | undefined;
};

export class UserDeletedEvent extends DomainEvent<UserDeletedSnapshot> {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly idpSub: string | undefined,
  ) {
    super(userId, { userId, email, idpSub });
  }
}
