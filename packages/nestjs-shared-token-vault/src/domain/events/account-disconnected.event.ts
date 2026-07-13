import { DomainEvent } from '@ce/nestjs-shared-core';
import type { OAuthAccount } from '../aggregates/oauth-account/oauth-account.aggregate';

export type AccountDisconnectedSnapshot = Pick<OAuthAccount, 'id' | 'provider' | 'email'>;

export class AccountDisconnectedEvent extends DomainEvent<AccountDisconnectedSnapshot> {
  constructor(snapshot: AccountDisconnectedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
