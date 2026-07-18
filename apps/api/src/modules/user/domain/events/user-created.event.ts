import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type UserCreatedSnapshot = {
  readonly userId: string;
  readonly email: string;
  readonly idpSub: string | undefined;
  /** True when the IdP adapter generated the password; user must reset on first login. */
  readonly systemGeneratedPassword: boolean;
};

export class UserCreatedEvent extends DomainEvent<UserCreatedSnapshot> {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly idpSub: string | undefined,
    public readonly systemGeneratedPassword: boolean,
  ) {
    super(userId, { userId, email, idpSub, systemGeneratedPassword });
  }
}
