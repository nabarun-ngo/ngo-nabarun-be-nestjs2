import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@ce/nestjs-shared-core';
import { LockingService } from '@ce/nestjs-shared-persistence';
import { TOKEN_VAULT2_OPTIONS, TokenVault2ModuleOptions } from './token-vault-options';
import { TokenVault2OptionsSchema } from './token-vault.schema';

// Application handlers
import { InitiateOAuthHandler } from './application/commands/initiate-oauth/initiate-oauth.handler';
import { CompleteOAuthHandler } from './application/commands/complete-oauth/complete-oauth.handler';
import { RevokeTokenHandler } from './application/commands/revoke-token/revoke-token.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token/refresh-token.handler';
import { GetValidTokenHandler } from './application/queries/get-valid-token/get-valid-token.handler';
import { ListTokensHandler } from './application/queries/list-tokens/list-tokens.handler';
import { ListAccountsHandler } from './application/queries/list-accounts/list-accounts.handler';

// Application event handlers
import { OnTokenRevokedHandler } from './application/event-handlers/on-token-revoked.handler';
import { OnTokenRefreshedHandler } from './application/event-handlers/on-token-refreshed.handler';
import { OnAccountConnectedHandler } from './application/event-handlers/on-account-connected.handler';
import { OnAccountDisconnectedHandler } from './application/event-handlers/on-account-disconnected.handler';

// Application services
import { TokenVaultFacade, TOKEN_VAULT2_FACADE } from './application/services/token-vault.facade';

// Ports
import { OAUTH_PROVIDER_REGISTRY } from './application/ports/oauth-provider.port';
import type { IOAuthProvider } from './application/ports/oauth-provider.port';

// Infrastructure
import { AesTokenEncryptor } from './infrastructure/crypto/aes-token-encryptor';
import { GoogleOAuthProvider } from './infrastructure/providers/google-oauth.provider';
import { MicrosoftOAuthProvider } from './infrastructure/providers/microsoft-oauth.provider';

// Presentation
import { OAuthController } from './presentation/controllers/oauth.controller';

export { TokenVault2ModuleOptions } from './token-vault-options';
export { TokenVault2OptionsSchema } from './token-vault.schema';

export interface TokenVault2AsyncOptions
  extends DynamicModuleAsyncOptions<TokenVault2ModuleOptions> {}

const COMMAND_HANDLERS = [
  InitiateOAuthHandler,
  CompleteOAuthHandler,
  RevokeTokenHandler,
  RefreshTokenHandler,
];

const QUERY_HANDLERS = [
  GetValidTokenHandler,
  ListTokensHandler,
  ListAccountsHandler,
];

const EVENT_HANDLERS = [
  OnTokenRevokedHandler,
  OnTokenRefreshedHandler,
  OnAccountConnectedHandler,
  OnAccountDisconnectedHandler,
];

/**
 * TokenVault2Module — full DDD-compliant, CQRS-based generic OAuth token vault.
 *
 * Registers encrypted token storage and management for Google and Microsoft
 * OAuth providers. Designed to be consumed by any module that needs delegated
 * account access (e.g. CorrespondenceModule for Gmail, DmsModule for Drive).
 *
 * HTTP routes exposed under `/auth/oauth/:provider/*`:
 *   GET  /auth/oauth/:provider/auth-url
 *   GET  /auth/oauth/:provider/callback    (public)
 *   GET  /auth/oauth/:provider/scopes
 *   GET  /auth/oauth/:provider/tokens
 *   GET  /auth/oauth/:provider/accounts
 *   DELETE /auth/oauth/:provider/tokens/:id
 *   GET  /auth/oauth/providers
 *
 * Consumer injection:
 *   @Inject(TOKEN_VAULT2_FACADE) facade: TokenVaultFacade
 *   await facade.getAccessToken({ provider: 'google', scope: 'gmail.send', ownerSub })
 */
@Module({})
export class TokenVault2Module extends BaseDynamicModule {
  static forRoot(options: TokenVault2ModuleOptions = {}): DynamicModule {
    return TokenVault2Module._build([
      TokenVault2Module.createOptionsProvider(TOKEN_VAULT2_OPTIONS, TokenVault2OptionsSchema, options),
    ]);
  }

  static forRootAsync(options: TokenVault2AsyncOptions): DynamicModule {
    return TokenVault2Module._build(
      [
        TokenVault2Module.createAsyncOptionsProvider(TOKEN_VAULT2_OPTIONS, TokenVault2OptionsSchema, options),
      ],
      options.imports,
    );
  }

  private static _build(optionsProviders: any[], extraImports: any[] = []): DynamicModule {
    return {
      module: TokenVault2Module,
      global: true,
      imports: [
        ...extraImports,
        CqrsModule,
        HttpModule.register({ timeout: 10_000, maxRedirects: 5 }),
      ],
      controllers: [OAuthController],
      providers: [
        ...optionsProviders,

        // Infrastructure — crypto
        AesTokenEncryptor,

        // Infrastructure — providers
        GoogleOAuthProvider,
        MicrosoftOAuthProvider,
        LockingService,

        // Provider registry factory (Map<string, IOAuthProvider>)
        {
          provide: OAUTH_PROVIDER_REGISTRY,
          useFactory: (
            options: TokenVault2ModuleOptions,
            google: GoogleOAuthProvider,
            microsoft: MicrosoftOAuthProvider,
          ): Map<string, IOAuthProvider> => {
            const map = new Map<string, IOAuthProvider>();
            if (options.googleOAuth) map.set('google', google);
            if (options.microsoftOAuth) map.set('microsoft', microsoft);
            return map;
          },
          inject: [TOKEN_VAULT2_OPTIONS, GoogleOAuthProvider, MicrosoftOAuthProvider],
        },

        // Application — CQRS handlers
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,

        // Application — consumer facade
        TokenVaultFacade,
        { provide: TOKEN_VAULT2_FACADE, useExisting: TokenVaultFacade },
      ],
      exports: [
        // Primary consumer API
        TOKEN_VAULT2_FACADE,
        TokenVaultFacade,

        // Provider registry — available for advanced consumers
        OAUTH_PROVIDER_REGISTRY,

        // Provider classes — exported for typed client access (e.g. OAuth2Client)
        GoogleOAuthProvider,
        MicrosoftOAuthProvider,

        // Crypto service — exported for modules that need to encrypt/decrypt tokens
        AesTokenEncryptor,
      ],
    };
  }
}
