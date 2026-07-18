import { UserInfo } from '@nabarun-ngo/nestjs-shared-core';

export interface ScopedRoleContext {
  permissions: string[];
  roles: string[];
  roleGroups: string[];
}

export interface AuthUser {
  type: 'apikey' | 'jwt';
  /** IdP subject identifier (JWT sub claim / synthetic for API keys). auth-internal — DO NOT use outside auth / token-vault. */
  idpSub: string;
  /** App profile UUID. Use this for audit fields, entity access, and all domain operations. Undefined when IUserLookupPort is not registered or the user has no profile yet. */
  userId?: string;
  /** Full user profile resolved at auth-time via IUserLookupPort. Undefined if port not registered. */
  userInfo?: UserInfo;
  permissions?: string[];
  userRoles?: string[];
  roleGroups?: string[];
  /** Email — resolved from IdP JWT payload first, then falls back to userInfo.email. */
  email?: string;
  /** Display name — resolved from IdP JWT payload first, then falls back to userInfo.fullName. */
  name?: string;
  /** Raw JWT payload claims. Renamed from 'claims'. */
  idpClaims?: Record<string, unknown>;
  /** Entity-scoped role contexts, keyed by "entityType:entityId" */
  scopedRoles?: Record<string, ScopedRoleContext>;
}
