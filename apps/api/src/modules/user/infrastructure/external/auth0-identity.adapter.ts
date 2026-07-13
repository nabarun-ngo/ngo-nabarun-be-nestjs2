import { Inject, Injectable, Logger } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import { User } from '../../domain/aggregates/user/user.aggregate';
import {
  GrantConnectionResult,
  IIdentityProvider,
  IdentityCreateOptions,
  IdentityCreateResult,
  IdentityUserPatch,
  LinkedConnection,
} from '../../domain/ports/identity-provider.port';
import { IdentityProviderError } from '../../domain/errors/user.errors';
import { USER_OPTIONS } from '../user-options.token';
import type { ConnectionConfig, ConnectionType, UserModuleOptions } from '../../user.schema';

/** Shape of an Auth0 identity object returned from users.get. */
interface Auth0Identity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial?: boolean;
}

@Injectable()
export class Auth0IdentityAdapter implements IIdentityProvider {
  private readonly logger = new Logger(Auth0IdentityAdapter.name);
  private readonly management: ManagementClient;

  constructor(
    @Inject(USER_OPTIONS) private readonly options: UserModuleOptions,
  ) {
    const { domain, clientId, clientSecret } = options.idp;
    this.management = new ManagementClient({ domain, clientId, clientSecret });
  }

  // ── createUser ────────────────────────────────────────────────────────────

  /**
   * 1. Create the user in the `default` (primary) connection.
   * 2. For every other connection where `provisionOnCreate: true` and type is
   *    `password` or `passwordless`, create a secondary identity and link it to
   *    the primary via Auth0's account-linking API.
   * 3. Return the primary `externalSub`.
   */
  async createUser(user: User, options: IdentityCreateOptions): Promise<IdentityCreateResult> {
    const primary = this.resolveConnection('default');
    const primarySub = await this.createInConnection(user, primary, options);

    const secondaries = Object.entries(this.options.idp.connections).filter(
      ([key, conn]) =>
        key !== 'default' &&
        conn.provisionOnCreate &&
        this.isProvisionable(conn.type),
    );

    for (const [, conn] of secondaries) {
      try {
        const secondarySub = await this.createInConnection(user, conn, {
          resetPassword: false,
          emailVerified: options.emailVerified,
        });
        await this.linkIdentity(primarySub, secondarySub);
      } catch (err) {
        // Log but do not fail the entire creation — primary identity already exists.
        this.logger.warn(
          `Failed to provision secondary connection '${conn.name}' for user ${user.email}: ` +
          (err instanceof Error ? err.message : String(err)),
        );
      }
    }

    return { externalSub: primarySub };
  }

  // ── updateUser ────────────────────────────────────────────────────────────

  async updateUser(externalSub: string, patch: IdentityUserPatch): Promise<void> {
    try {
      await this.management.users.update(externalSub, {
        ...(patch.firstName ? { given_name: patch.firstName } : {}),
        ...(patch.lastName  ? { family_name: patch.lastName } : {}),
        ...(patch.firstName && patch.lastName
          ? { name: `${patch.firstName} ${patch.lastName}` }
          : {}),
        ...(patch.picture ? { picture: patch.picture } : {}),
        ...(patch.resetPassword ? { app_metadata: { reset_password: patch.resetPassword } } : {}),
      });
    } catch (err) {
      throw this.wrapError('updateUser', err);
    }
  }

  // ── deleteUser ────────────────────────────────────────────────────────────

  async deleteUser(externalSub: string): Promise<void> {
    try {
      await this.management.users.delete(externalSub);
    } catch (err) {
      throw this.wrapError('deleteUser', err);
    }
  }

  // ── sendPasswordReset ─────────────────────────────────────────────────────

  /**
   * Fetch all identities linked to the user and send the appropriate re-engagement
   * action for each provisionable connection type:
   * - `password`     → change-password ticket email
   * - `passwordless` → verification / magic-link email
   * Social / enterprise identities are skipped.
   */
  async sendPasswordReset(externalSub: string): Promise<void> {
    const authUser = await this.fetchUser(externalSub, 'sendPasswordReset');
    const email = (authUser as any).email as string | undefined;
    if (!email) throw new IdentityProviderError(`No email found for user ${externalSub}`);

    const identities: Auth0Identity[] = (authUser as any).identities ?? [];
    for (const identity of identities) {
      const conn = this.findConnectionByName(identity.connection);
      if (!conn) continue;

      if (conn.type === 'password') {
        await this.sendPasswordChangeTicket(email).catch((err: unknown) =>
          this.logger.warn(`Password ticket failed for ${identity.connection}: ${err instanceof Error ? err.message : err}`),
        );
      } else if (conn.type === 'passwordless') {
        const userId = `${identity.provider}|${identity.user_id}`;
        await this.sendVerificationEmail(userId).catch((err: unknown) =>
          this.logger.warn(`Passwordless re-send failed for ${identity.connection}: ${err instanceof Error ? err.message : err}`),
        );
      }
      // social / enterprise: no server-side reset possible — skip
    }
  }

  // ── grantConnection ───────────────────────────────────────────────────────

  /**
   * Grant a `password` or `passwordless` connection to an existing user by
   * creating a secondary identity in Auth0 and linking it to the primary.
   * Throws for `social` and `enterprise` connection types — those identities
   * cannot be pre-provisioned and are linked externally on first OAuth/federated login.
   */
  async grantConnection(
    externalSub: string,
    connectionKey: string,
    user: User,
  ): Promise<GrantConnectionResult> {
    const conn = this.resolveConnection(connectionKey);

    if (!this.isProvisionable(conn.type)) {
      throw new IdentityProviderError(
        `Cannot grant connection '${connectionKey}' (type '${conn.type}'). ` +
        `Only 'password' and 'passwordless' connections can be granted via the API. ` +
        `Social and enterprise identities are provisioned externally on first login.`,
      );
    }

    try {
      const secondarySub = await this.createInConnection(user, conn, { resetPassword: false });
      await this.linkIdentity(externalSub, secondarySub);
      return { status: 'linked' };
    } catch (err) {
      throw this.wrapError('grantConnection', err);
    }
  }

  // ── revokeConnection ──────────────────────────────────────────────────────

  /**
   * Unlink a secondary identity from the user.
   * Throws if `connectionKey` is `default` (primary cannot be revoked).
   */
  async revokeConnection(externalSub: string, connectionKey: string): Promise<void> {
    if (connectionKey === 'default') {
      throw new IdentityProviderError(
        `The primary connection ('default') cannot be revoked. Delete the user instead.`,
      );
    }
    const conn = this.resolveConnection(connectionKey);
    const authUser = await this.fetchUser(externalSub, 'revokeConnection');

    const identities: Auth0Identity[] = (authUser as any).identities ?? [];
    const identity = identities.find((id) => id.connection === conn.name);
    if (!identity) {
      throw new IdentityProviderError(
        `User does not have a linked identity for connection '${connectionKey}' (${conn.name}).`,
      );
    }

    try {
      await this.management.users.identities.delete(
        externalSub,
        identity.provider as any,
        identity.user_id,
      );
    } catch (err) {
      throw this.wrapError('revokeConnection', err);
    }
  }

  // ── listConnections ───────────────────────────────────────────────────────

  /**
   * List all Auth0 identities linked to the user, enriched with the logical
   * connection key from the `idp.connections` map.
   */
  async listConnections(externalSub: string): Promise<LinkedConnection[]> {
    const authUser = await this.fetchUser(externalSub, 'listConnections');
    const primaryConnectionName = this.resolveConnection('default').name;
    const identities: Auth0Identity[] = (authUser as any).identities ?? [];

    return identities.map((identity) => {
      const entry = this.findConnectionEntryByName(identity.connection);
      return {
        connectionKey:  entry?.key  ?? '__unknown__',
        connectionName: identity.connection,
        type:           (entry?.conn.type ?? 'social') as ConnectionType,
        provider:       identity.provider,
        isPrimary:      identity.connection === primaryConnectionName && !identity.isSocial,
      };
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async fetchUser(externalSub: string, operation: string): Promise<unknown> {
    try {
      const res = await this.management.users.get(externalSub);
      return res.data;
    } catch (err) {
      throw this.wrapError(`${operation}.getUser`, err);
    }
  }

  /**
   * Create a user in a single Auth0 connection and return the full `user_id`.
   */
  private async createInConnection(
    user: User,
    conn: ConnectionConfig,
    options: Pick<IdentityCreateOptions, 'resetPassword' | 'adminPassword' | 'emailVerified'>,
  ): Promise<string> {
    const base = {
      email:          user.email,
      given_name:     user.firstName,
      family_name:    user.lastName,
      name:           user.fullName,
      connection:     conn.name,
      email_verified: options.emailVerified ?? false,
    };

    if (conn.type === 'password') {
      const password = options.adminPassword ?? this.generateCompliantPassword();
      const res = await this.management.users.create({
        ...base,
        password,
        app_metadata: {
          reset_password: options.resetPassword,
          password_expires_in_days:
            this.options.passwordExpiresInDays ?? 180,
        },
      });
      return res.data.user_id as string;
    }

    // passwordless — no password field
    const res = await this.management.users.create({
      ...base,
      app_metadata: { profile_complete: false },
    });
    const userId = res.data.user_id as string;
    // Only send a magic-link if the email is not already verified.
    if (!options.emailVerified) {
      await this.sendVerificationEmail(userId);
    }
    return userId;
  }

  /**
   * Link a secondary identity to the primary user via Auth0 account linking.
   * The `secondaryFullId` format is `{provider}|{bareId}`.
   */
  private async linkIdentity(primarySub: string, secondaryFullId: string): Promise<void> {
    const [provider, ...rest] = secondaryFullId.split('|');
    const userId = rest.join('|');
    await this.management.users.identities.link(primarySub, {
      provider: provider as any,
      user_id: userId,
    });
  }

  private async sendPasswordChangeTicket(email: string): Promise<void> {
    await this.management.tickets.changePassword({ email });
  }

  private async sendVerificationEmail(userId: string): Promise<void> {
    await this.management.jobs.verificationEmail.create({ user_id: userId });
  }

  /**
   * Resolve a logical connection key to its config.
   * Throws a descriptive error if the key is not configured.
   */
  private resolveConnection(key: string): ConnectionConfig {
    const config = this.options.idp.connections[key];
    if (!config) {
      throw new IdentityProviderError(
        `Unknown connection key '${key}'. ` +
        `Available: ${Object.keys(this.options.idp.connections).join(', ')}.`,
      );
    }
    return config;
  }

  /** Find the first connection config whose `name` matches the raw Auth0 connection name. */
  private findConnectionByName(connectionName: string): ConnectionConfig | undefined {
    return this.findConnectionEntryByName(connectionName)?.conn;
  }

  private findConnectionEntryByName(
    connectionName: string,
  ): { key: string; conn: ConnectionConfig } | undefined {
    const entry = Object.entries(this.options.idp.connections).find(
      ([, conn]) => conn.name === connectionName,
    );
    return entry ? { key: entry[0], conn: entry[1] } : undefined;
  }

  /** Returns true for connection types that can be pre-provisioned via Management API. */
  private isProvisionable(type: ConnectionConfig['type']): boolean {
    return type === 'password' || type === 'passwordless';
  }

  /**
   * Generates a password satisfying Auth0's default "Fair" policy:
   * 8+ chars, uppercase, lowercase, digit, and special character.
   */
  private generateCompliantPassword(): string {
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const digits  = '0123456789';
    const special = '!@#$%^&*';
    const all     = upper + lower + digits + special;
    const rand = (set: string) => set[Math.floor(Math.random() * set.length)];
    const required = [rand(upper), rand(lower), rand(digits), rand(special)];
    const extra    = Array.from({ length: 12 }, () => rand(all));
    return [...required, ...extra].sort(() => Math.random() - 0.5).join('');
  }

  private wrapError(operation: string, err: unknown): IdentityProviderError {
    const message = err instanceof Error ? err.message : `Auth0 ${operation} failed`;
    this.logger.error(`Auth0 ${operation} error: ${message}`, err);
    return new IdentityProviderError(`Identity provider error during ${operation}: ${message}`);
  }
}
