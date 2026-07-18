import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { OAuthAccount } from '../aggregates/oauth-account/oauth-account.aggregate';

export type AccountConnectedSnapshot = Pick<OAuthAccount, 'id' | 'provider' | 'email'>;

export class AccountConnectedEvent extends DomainEvent<AccountConnectedSnapshot> {
  constructor(snapshot: AccountConnectedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
