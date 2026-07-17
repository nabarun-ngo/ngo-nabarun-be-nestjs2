import { Inject, Injectable } from '@nestjs/common';
import {
  IOAuthAccessTokenPort,
  OAUTH_ACCESS_TOKEN_PORT,
  OAuthAccessTokenRequest,
} from '@ce/nestjs-shared-core';
import { TOKEN_VAULT_FACADE, TokenVaultFacade } from '@ce/nestjs-shared-token-vault';

@Injectable()
export class TokenVaultOAuthAccessTokenAdapter implements IOAuthAccessTokenPort {
  constructor(
    @Inject(TOKEN_VAULT_FACADE)
    private readonly tokenVault: TokenVaultFacade,
  ) {}

  getAccessToken(request: OAuthAccessTokenRequest): Promise<string> {
    return this.tokenVault.getAccessToken({
      provider: request.provider,
      scope: request.scope,
      ownerSub: request.ownerSub,
    });
  }
}

export const OAUTH_ACCESS_TOKEN_PROVIDER = {
  provide: OAUTH_ACCESS_TOKEN_PORT,
  useClass: TokenVaultOAuthAccessTokenAdapter,
};
