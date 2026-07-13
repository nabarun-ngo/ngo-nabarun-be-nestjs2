import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { isEncryptedText } from '@ce/nestjs-shared-core';
import type { PrismaClient } from '../prisma/client';
import type {
  TokenVault2OAuthTokenWhereInput,
  TokenVault2OAuthTokenWhereUniqueInput,
  TokenVault2OAuthTokenCreateInput,
  TokenVault2OAuthTokenUncheckedCreateInput,
  TokenVault2OAuthTokenUpdateInput,
  TokenVault2OAuthTokenUncheckedUpdateInput,
  TokenVault2OAuthTokenOrderByWithRelationInput,
} from '../prisma/models';
import {
  EncryptedToken,
  InvalidEncryptedTokenError,
  IOAuthTokenRepository,
  OAuthAccountSnapshot,
  OAuthToken,
  OAuthTokenFilter,
  TokenScope,
} from '@ce/nestjs-shared-token-vault';

/**
 * Extended row type that includes the eagerly-loaded account relation.
 * `toInclude()` returns `{ account: true }`, so all find methods automatically
 * eager-load the account, allowing `toDomain` to reconstruct the snapshot.
 */
type TokenRow = {
  id: string;
  accountId: string;
  clientId: string;
  provider: string;
  email: string;
  ownerSub: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: Date | null;
  scope: string | null;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    email: string;
    externalId: string | null;
    name: string | null;
    givenName: string | null;
    familyName: string | null;
    pictureUrl: string | null;
    locale: string | null;
  } | null;
};

/**
 * Defensive guard: refuses to persist a token that was not properly encrypted.
 * Prevents plaintext tokens from reaching the database if the EncryptedToken
 * VO invariant was somehow bypassed.
 */
function assertEncrypted(token: OAuthToken): void {
  if (!isEncryptedText(token.accessToken.raw)) {
    throw new InvalidEncryptedTokenError();
  }
  if (token.refreshToken && !isEncryptedText(token.refreshToken.raw)) {
    throw new InvalidEncryptedTokenError();
  }
}

@Injectable()
export class OAuthTokenPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'tokenVault2OAuthToken',
    OAuthToken,
    string,
    OAuthTokenFilter,
    TokenRow,
    TokenVault2OAuthTokenWhereInput,
    TokenVault2OAuthTokenWhereUniqueInput,
    ({} & TokenVault2OAuthTokenUncheckedCreateInput) | ({} & TokenVault2OAuthTokenCreateInput),
    ({} & TokenVault2OAuthTokenUncheckedUpdateInput) | ({} & TokenVault2OAuthTokenUpdateInput),
    TokenVault2OAuthTokenOrderByWithRelationInput,
    { account: true }
  >
  implements IOAuthTokenRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'tokenVault2OAuthToken');
  }

  // ── toInclude hook — eager-loads account on every find query ─────────────

  protected override toInclude(): { account: true } {
    return { account: true };
  }

  // ── Custom interface methods ─────────────────────────────────────────────────

  async findByAttribute(filter: Partial<OAuthTokenFilter>): Promise<OAuthToken | null> {
    const row = await (this.delegate).findFirst({
      where: this.toFilterWhere(filter as OAuthTokenFilter),
      include: { account: true },
    });
    return row ? this.toDomain(row as TokenRow) : null;
  }

  // ── Mapping hooks ────────────────────────────────────────────────────────────

  protected toDomain(row: TokenRow): OAuthToken {
    const account: OAuthAccountSnapshot | undefined = row.account
      ? {
          id: row.account.id,
          email: row.account.email,
          externalId: row.account.externalId ?? undefined,
          name: row.account.name ?? undefined,
          givenName: row.account.givenName ?? undefined,
          familyName: row.account.familyName ?? undefined,
          pictureUrl: row.account.pictureUrl ?? undefined,
          locale: row.account.locale ?? undefined,
        }
      : undefined;

    return OAuthToken.rehydrate({
      id: row.id,
      accountId: row.accountId,
      clientId: row.clientId,
      provider: row.provider,
      email: row.email,
      ownerSub: row.ownerSub ?? undefined,
      accessToken: EncryptedToken.fromEncrypted(row.accessToken),
      refreshToken: row.refreshToken ? EncryptedToken.fromEncrypted(row.refreshToken) : null,
      tokenType: row.tokenType ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
      scope: TokenScope.fromStorage(row.scope),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      account,
    });
  }

  protected toCreateInput(
    entity: OAuthToken,
  ): ({} & TokenVault2OAuthTokenUncheckedCreateInput) | ({} & TokenVault2OAuthTokenCreateInput) {
    assertEncrypted(entity);
    return {
      id: entity.id,
      accountId: entity.accountId,
      clientId: entity.clientId,
      provider: entity.provider,
      email: entity.email,
      ownerSub: entity.ownerSub ?? null,
      accessToken: entity.accessToken.raw,
      refreshToken: entity.refreshToken?.raw ?? null,
      tokenType: entity.tokenType ?? null,
      expiresAt: entity.expiresAt ?? null,
      scope: entity.scope?.toString() ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUpdateInput(
    _id: string,
    entity: OAuthToken,
  ): ({} & TokenVault2OAuthTokenUncheckedUpdateInput) | ({} & TokenVault2OAuthTokenUpdateInput) {
    assertEncrypted(entity);
    return {
      accessToken: entity.accessToken.raw,
      ...(entity.refreshToken ? { refreshToken: entity.refreshToken.raw } : {}),
      expiresAt: entity.expiresAt ?? null,
      tokenType: entity.tokenType ?? null,
      // Persist scope and ownerSub: refresh() may update these on re-authorisation.
      scope: entity.scope?.toString() ?? null,
      ownerSub: entity.ownerSub ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): TokenVault2OAuthTokenWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: OAuthTokenFilter): TokenVault2OAuthTokenWhereInput {
    return {
      ...(filter?.provider ? { provider: filter.provider } : {}),
      ...(filter?.email ? { email: filter.email } : {}),
      ...(filter?.clientId ? { clientId: filter.clientId } : {}),
      ...(filter?.ownerSub ? { ownerSub: filter.ownerSub } : {}),
      ...(filter?.scope ? { scope: { contains: filter.scope } } : {}),
    };
  }

  protected defaultOrderBy(): TokenVault2OAuthTokenOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }
}
