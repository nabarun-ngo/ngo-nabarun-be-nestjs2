import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiAutoPagedResponse,
  ApiAutoResponse,
  ApiAutoVoidResponse,
  Page,
  PaginatedQueryDto,
} from '@nabarun-ngo/nestjs-shared-core';
import { AuthUser, CurrentUser, IgnoreCaptcha, Public, RequirePermissions, StrictThrottle } from '@nabarun-ngo/nestjs-shared-auth';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { OAUTH_PROVIDER_REGISTRY } from '../../application/ports/oauth-provider.port';
import type { IOAuthProvider } from '../../application/ports/oauth-provider.port';
import { InitiateOAuthCommand } from '../../application/commands/initiate-oauth/initiate-oauth.command';
import type { InitiateOAuthResult } from '../../application/commands/initiate-oauth/initiate-oauth.handler';
import { CompleteOAuthCommand } from '../../application/commands/complete-oauth/complete-oauth.command';
import { RevokeTokenCommand } from '../../application/commands/revoke-token/revoke-token.command';
import { ListTokensQuery } from '../../application/queries/list-tokens/list-tokens.query';
import { ListAccountsQuery } from '../../application/queries/list-accounts/list-accounts.query';
import { AuthCallbackDto, AuthUrlResponseDto, OAuthAccountDto, OAuthTokenDto } from '../../application/dto/oauth-token.dto';
import { ProviderNotConfiguredError } from '../../domain/errors/token-vault.errors';

const OAUTH_ADMIN_PERMISSION = 'manage:oauth_token';

@ApiTags('OAuth2 Token Vault')
@ApiBearerAuth('jwt')
@Controller('auth/oauth')
export class OAuthController {
  constructor(
    @Inject(OAUTH_PROVIDER_REGISTRY) private readonly registry: Map<string, IOAuthProvider>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  private resolveProvider(provider: string): IOAuthProvider {
    const p = this.registry.get(provider.toLowerCase());
    if (!p || !p.isConfigured) throw new ProviderNotConfiguredError(provider);
    return p;
  }

  @Get(':provider/auth-url')
  @RequirePermissions('create:oauth_token')
  @StrictThrottle()
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiQuery({ name: 'scopes', required: false, description: 'Space-separated OAuth scopes (must be whitelisted)', type: String })
  @ApiQuery({ name: 'state', required: false, description: 'Optional caller-provided state (secure state generated when omitted)', type: String })
  @ApiAutoResponse(AuthUrlResponseDto, { description: 'OAuth URL and server-generated state token' })
  async getAuthUrl(
    @Param('provider') provider: string,
    @Query('scopes') scopes?: string,
    @Query('state') state?: string,
    @CurrentUser() caller?: AuthUser,
  ): Promise<AuthUrlResponseDto> {
    this.resolveProvider(provider);

    if (scopes && scopes.length > 1000) {
      throw new BadRequestException('Scopes parameter is too long. Maximum 1000 characters allowed.');
    }

    const scopeList = scopes
      ? scopes.split(' ').filter((s) => s.trim().length > 0)
      : [];

    return this.commandBus.execute<InitiateOAuthCommand, InitiateOAuthResult>(
      new InitiateOAuthCommand({ provider, scopes: scopeList, ownerSub: caller?.idpSub, customState: state }),
    );
  }

  @Get(':provider/callback')
  @Public()
  @IgnoreCaptcha()
  @StrictThrottle()
  @ApiOperation({
    summary: 'Handle OAuth provider callback',
    description:
      'Receives the authorization code and state from the provider, exchanges the code for tokens, and stores them encrypted. This endpoint is public.',
  })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiAutoResponse(Object, { description: 'Callback result with connected email' })
  async handleCallback(
    @Param('provider') provider: string,
    @Query() query: AuthCallbackDto,
  ): Promise<{ email: string; tokenId: string }> {
    this.resolveProvider(provider);
    return this.commandBus.execute(
      new CompleteOAuthCommand({ provider, code: query.code, state: query.state }),
    );
  }

  @Get(':provider/scopes')
  @ApiOperation({ summary: 'Get available OAuth scopes for provider' })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiAutoResponse(String, { description: 'Supported OAuth scopes', isArray: true })
  async getScopes(@Param('provider') provider: string): Promise<string[]> {
    const p = this.resolveProvider(provider);
    return p.getSupportedScopes();
  }

  @Get(':provider/tokens')
  @RequirePermissions('read:oauth_token')
  @ApiOperation({ summary: 'List stored OAuth tokens for provider' })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiAutoPagedResponse(OAuthTokenDto, { description: 'OAuth tokens (raw token values never exposed)' })
  async listTokens(
    @Param('provider') provider: string,
    @Query() query: PaginatedQueryDto,
    @CurrentUser() caller?: AuthUser,
  ): Promise<Page<OAuthTokenDto>> {
    this.resolveProvider(provider);
    const isAdmin = (caller?.permissions ?? []).includes(OAUTH_ADMIN_PERMISSION);
    return this.queryBus.execute(
      new ListTokensQuery({ provider, ownerSub: caller?.idpSub, isAdmin, pageIndex: query.pageIndex, pageSize: query.pageSize }),
    );
  }

  @Delete(':provider/tokens/:id')
  @RequirePermissions('delete:oauth_token')
  @ApiOperation({ summary: 'Revoke and delete a stored OAuth token' })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiParam({ name: 'id', description: 'Token ID to revoke', type: String })
  @ApiAutoVoidResponse({ status: 204 })
  async revokeToken(
    @Param('provider') provider: string,
    @Param('id') id: string,
    @CurrentUser() caller?: AuthUser,
  ): Promise<void> {
    this.resolveProvider(provider);
    const isAdmin = (caller?.permissions ?? []).includes(OAUTH_ADMIN_PERMISSION);
    await this.commandBus.execute(
      new RevokeTokenCommand({ tokenId: id, provider, callerSub: caller?.idpSub, isAdmin }),
    );
  }

  @Get(':provider/accounts')
  @RequirePermissions('read:oauth_token')
  @ApiOperation({ summary: 'List connected OAuth accounts for provider' })
  @ApiParam({ name: 'provider', description: 'OAuth provider (google, microsoft)', type: String })
  @ApiAutoPagedResponse(OAuthAccountDto, { description: 'Connected OAuth accounts' })
  async listAccounts(
    @Param('provider') provider: string,
    @Query() query: PaginatedQueryDto,
  ): Promise<Page<OAuthAccountDto>> {
    this.resolveProvider(provider);
    return this.queryBus.execute(
      new ListAccountsQuery({ provider, pageIndex: query.pageIndex, pageSize: query.pageSize }),
    );
  }

  @Get('providers')
  @ApiOperation({ summary: 'List all configured OAuth providers' })
  @ApiAutoResponse(String, { description: 'Configured provider keys', isArray: true })
  async getProviders(): Promise<string[]> {
    return Array.from(this.registry.entries())
      .filter(([, p]) => p.isConfigured)
      .map(([key]) => key);
  }
}
