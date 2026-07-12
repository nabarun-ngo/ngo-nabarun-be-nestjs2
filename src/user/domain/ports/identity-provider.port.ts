import { User } from '../aggregates/user/user.aggregate';
import type { ConnectionType } from '../../user.schema';

export const IIdentityProvider = Symbol('IIdentityProvider');

// ── Create ────────────────────────────────────────────────────────────────────

export interface IdentityCreateOptions {
  /**
   * Password-connection only.
   * When true the adapter generates a compliant password and sets `reset_password`
   * in app_metadata. Ignored for passwordless connections.
   */
  resetPassword: boolean;
  /**
   * Password-connection only. Admin-supplied plain-text password.
   * When omitted the adapter generates a compliant password.
   */
  adminPassword?: string;
  emailVerified?: boolean;
  /** Password-connection only. Days before the password expires (written to app_metadata). */
}

export interface IdentityCreateResult {
  /** Opaque IdP subject → stored as `UserProfile.idpSub`. */
  externalSub: string;
}

// ── Update ────────────────────────────────────────────────────────────────────

export interface IdentityUserPatch {
  firstName?: string;
  lastName?: string;
  picture?: string;
  resetPassword?: boolean;

}

// ── Connections ───────────────────────────────────────────────────────────────

/**
 * Result of a grantConnection call.
 * Only `password` and `passwordless` connections can be granted — the identity is
 * created and linked synchronously. Social and enterprise connections are not supported
 * (they are provisioned externally on first OAuth/federated login).
 */
export type GrantConnectionResult = { status: 'linked' };

export interface LinkedConnection {
  /** Logical key from the `idp.connections` map, or `__unknown__` when unmapped. */
  connectionKey: string;
  /** Raw Auth0 connection name (e.g. `google-oauth2`, `email`). */
  connectionName: string;
  type: ConnectionType;
  /** Auth0 identity provider string (e.g. `auth0`, `google-oauth2`, `email`). */
  provider: string;
  /** True for the identity that owns the stored `externalSub`. */
  isPrimary: boolean;
}

// ── Port ──────────────────────────────────────────────────────────────────────

export interface IIdentityProvider {
  /**
   * Provision the user in all configured connections with `provisionOnCreate: true`
   * and link them via Auth0 account linking. Returns the primary identity's `externalSub`.
   */
  createUser(user: User, options: IdentityCreateOptions): Promise<IdentityCreateResult>;

  /** Sync name / picture to Auth0 after profile update. */
  updateUser(externalSub: string, patch: IdentityUserPatch): Promise<void>;

  /** Soft-delete complement: removes the user from Auth0. */
  deleteUser(externalSub: string): Promise<void>;

  /**
   * Iterate every identity linked to the user and send the appropriate re-engagement:
   * - `password` connection   → change-password ticket email
   * - `passwordless` connection → verification email (re-sends magic-link)
   * Social / enterprise identities are skipped (no server-side reset possible).
   */
  sendPasswordReset(externalSub: string): Promise<void>;

  /**
   * Grant a new `password` or `passwordless` connection to an existing user.
   * Creates the secondary identity in Auth0 and links it to the primary via account linking.
   * Throws `IdentityProviderError` if the connection type is `social` or `enterprise`
   * (those identities are provisioned externally on first OAuth / federated login).
   */
  grantConnection(
    externalSub: string,
    connectionKey: string,
    user: User,
  ): Promise<GrantConnectionResult>;

  /**
   * Unlink a secondary identity from the user.
   * Throws if `connectionKey` resolves to the primary (`default`) connection.
   */
  revokeConnection(externalSub: string, connectionKey: string): Promise<void>;

  /**
   * List all Auth0 identities currently linked to the user, enriched with
   * the logical connection key from the `idp.connections` map.
   */
  listConnections(externalSub: string): Promise<LinkedConnection[]>;
}
