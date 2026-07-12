import { z } from 'zod';

/**
 * Supported Auth0 connection types and their provisioning behaviour.
 *
 * - `password`     — Auth0 database connection. Pre-provisioned with a password
 *                    via the Management API. Supports adminPassword, resetPassword,
 *                    passwordExpiresInDays. Uses change-password ticket for reset.
 * - `passwordless` — Auth0 `email` or `sms` connection. Pre-provisioned without
 *                    a password. User completes first login via magic-link/OTP.
 * - `social`       — OAuth2 connection (Google, GitHub, Facebook, Apple, etc.).
 *                    Cannot be pre-provisioned. Identity created on first OAuth login.
 * - `enterprise`   — Federated connection (SAML, OIDC, Entra ID, ADFS).
 *                    Cannot be pre-provisioned. Identity created on first federated login.
 */
export const ConnectionType = {
  Password:     'password',
  Passwordless: 'passwordless',
  //Social:       'social',
  //Enterprise:   'enterprise',
} as const;
export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

const ConnectionConfigSchema = z.object({
  /** The Auth0 connection name passed to the Management API. */
  name: z.string().min(1),
  /** Determines how the identity is provisioned and what reset flow applies. */
  type: z.enum(['password', 'passwordless', /*'social', 'enterprise'*/]).default('password'),
  /**
   * When true, this connection is automatically provisioned and linked when a new
   * user is created. Only meaningful for `password` and `passwordless` types —
   * social and enterprise connections cannot be pre-provisioned via the Management API.
   */
  provisionOnCreate: z.boolean().default(true),
});

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

/**
 * Named connection map. The `default` key is required (primary identity).
 * Additional keys map logical names to Auth0 connection configs.
 *
 * @example
 * connections: {
 *   default:      { name: 'Username-Password-Authentication', type: 'password',     provisionOnCreate: true  },
 *   passwordless: { name: 'email',                            type: 'passwordless', provisionOnCreate: true  },
 *   google:       { name: 'google-oauth2',                    type: 'social',       provisionOnCreate: false },
 *   saml:         { name: 'samlp',                            type: 'enterprise',   provisionOnCreate: false },
 * }
 */
const ConnectionsSchema = z
  .object({ default: ConnectionConfigSchema })
  .catchall(ConnectionConfigSchema);

const IdpOptionsSchema = z.object({
  /** Auth0 tenant domain, e.g. `my-tenant.us.auth0.com`. */
  domain: z.string().min(1),
  /** Management API client ID. */
  clientId: z.string().min(1),
  /** Management API client secret. */
  clientSecret: z.string().min(1),
  /** Named connection map. Defaults to a single password-based connection. */
  connections: ConnectionsSchema.default({
    default: { name: 'Username-Password-Authentication', type: 'password', provisionOnCreate: true },
  }),
});

export type IdpOptions = z.infer<typeof IdpOptionsSchema>;

export const UserModuleOptionsSchema = z.object({
  /** Auth0 Management API credentials and connection configuration. */
  idp: IdpOptionsSchema,
  /** Default role keys to grant on admin user create (via Auth2 GrantUserRoleCommand). */
  defaultRoleKeys: z.array(z.string()).optional().default([]),
  /** Number of days before a provisioned password expires (written to IdP app_metadata). */
  passwordExpiresInDays: z.number().int().min(1).optional().default(90),
});

/** Parsed/output type — all defaults applied. Used internally after schema.parse(). */
export type UserModuleOptions = z.infer<typeof UserModuleOptionsSchema>;

/** Raw input type — fields with defaults are optional. Use as the factory return type in forRootAsync(). */
export type UserModuleInput = z.input<typeof UserModuleOptionsSchema>;
