import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type UserProfileUpdatedSnapshot = {
  readonly userId: string;
  readonly idpSub: string | undefined;
  readonly isProfileComplete: boolean;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
  readonly picture: string | undefined;
};

export class UserProfileUpdatedEvent extends DomainEvent<UserProfileUpdatedSnapshot> {
  constructor(
    public readonly userId: string,
    public readonly idpSub: string | undefined,
    public readonly isProfileComplete: boolean,
    public readonly firstName: string | undefined,
    public readonly lastName: string | undefined,
    public readonly picture: string | undefined,
  ) {
    super(userId, { userId, idpSub, isProfileComplete, firstName, lastName, picture });
  }
}
