/**
 * Represents a single Auth0 identity linked to a user.
 * Returned by GET /users/:id/connections.
 */
export class LinkedConnectionDto {
  /** Logical key from the idp.connections configuration map, or `__unknown__` when unmapped. */
  connectionKey!: string;
  /** Raw Auth0 connection name (e.g. `google-oauth`, `email`). */
  connectionName!: string;
  /** Connection type: `password | passwordless | social | enterprise` (as reported by Auth0). */
  type!: string;
  /** Auth0 identity provider identifier (e.g. `auth0`, `google-oauth`, `email`). */
  provider!: string;
  /** True for the identity that owns the stored `idpSub`. */
  isPrimary!: boolean;
}

/**
 * Result of POST /users/:id/connections.
 * Always `linked` — the identity was provisioned and linked synchronously.
 * (Social and enterprise connections are not supported via this endpoint.)
 */
export class GrantConnectionResponseDto {
  status!: 'linked';
}
