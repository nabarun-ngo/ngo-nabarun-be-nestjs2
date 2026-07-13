import type { Auth2SeedData } from '@ce/nestjs-shared-auth';

// Comma-separated IdP subs to auto-assign to the SUPER_ADMINS group.
// Example .env entry:  SEED_SUPER_ADMIN_IDP_SUBS=auth0|abc123,auth0|def456
const superAdminSubs = (process.env.SEED_SUPER_ADMIN_IDP_SUBS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// ─── Canonical permission key sets (re-used in multiple roles) ───────────────

const RBAC_READ = [
  'read:roles',
  'read:permissions',
  'read:role_groups',
  'read:user_roles',
] as const;

const RBAC_MANAGE = [
  ...RBAC_READ,
  'create:user_roles',
  'delete:user_roles',
] as const;

const API_KEYS_ALL = [
  'read:api_keys',
  'create:api_keys',
  'update:api_keys',
  'delete:api_keys',
] as const;

const JSON_STORE_ALL = [
  'read:json_documents',
  'create:json_documents',
  'update:json_documents',
  'delete:json_documents',
] as const;

const DOCS_ALL = [
  'read:documents',
  'create:documents',
  'update:documents',
  'delete:documents',
] as const;

const CUSTOM_FIELDS_ALL = [
  'read:custom_field_definitions',
  'create:custom_field_definitions',
  'update:custom_field_definitions',
  'delete:custom_field_definitions',
  'read:custom_field_values',
  'write:custom_field_values',
  'delete:custom_field_values',
] as const;

const DONATIONS_ALL = [
  'read:donations',
  'write:donations',
  'admin:donations',
  'donations:read',
  'donations:comment',
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export const AUTH2_SEED: Auth2SeedData = {
  permissions: [
    // ── auth (self) ────────────────────────────────────────────────────────
    { key: 'read:roles', description: 'View all RBAC roles' },
    { key: 'read:permissions', description: 'View all registered permissions' },
    { key: 'read:role_groups', description: 'View all role groups' },
    { key: 'read:user_roles', description: 'View roles and role-group memberships of any user' },
    { key: 'create:user_roles', description: 'Grant a role or add a user to a role group' },
    { key: 'delete:user_roles', description: 'Revoke a role or remove a user from a role group' },
    { key: 'read:api_keys', description: 'List API keys and their scopes' },
    { key: 'create:api_keys', description: 'Generate a new API key' },
    { key: 'update:api_keys', description: 'Update permissions on an existing API key' },
    { key: 'delete:api_keys', description: 'Revoke an API key' },

    // ── json-store ───────────────────────────────────────────────────────────
    { key: 'read:json_documents', description: 'Read JSON store documents' },
    { key: 'create:json_documents', description: 'Create JSON store documents' },
    { key: 'update:json_documents', description: 'Update JSON store documents' },
    { key: 'delete:json_documents', description: 'Delete JSON store documents' },

    // ── correspondence ──────────────────────────────────────────────────────
    { key: 'read:notifications', description: 'Access notification admin endpoints' },

    // ── cron ────────────────────────────────────────────────────────────────
    { key: 'read:cron', description: 'View cron job definitions and status' },
    { key: 'update:cron', description: 'Trigger or update cron job definitions' },

    // ── dms ────────────────────────────────────────────────────────────────
    { key: 'read:documents', description: 'View document references' },
    { key: 'create:documents', description: 'Upload or attach documents' },
    { key: 'update:documents', description: 'Update document metadata' },
    { key: 'delete:documents', description: 'Delete document references' },

    // ── custom-fields ───────────────────────────────────────────────────────
    { key: 'read:custom_field_definitions', description: 'View custom field definitions' },
    { key: 'create:custom_field_definitions', description: 'Create custom field definitions' },
    { key: 'update:custom_field_definitions', description: 'Update custom field definitions' },
    { key: 'delete:custom_field_definitions', description: 'Delete custom field definitions' },
    { key: 'read:custom_field_values', description: 'Read custom field values on entities' },
    { key: 'write:custom_field_values', description: 'Set custom field values on entities' },
    { key: 'delete:custom_field_values', description: 'Remove custom field values from entities' },

    // ── token-vault ─────────────────────────────────────────────────────────
    { key: 'read:oauth_token', description: 'View OAuth token records' },
    { key: 'create:oauth_token', description: 'Create or refresh OAuth tokens' },
    { key: 'delete:oauth_token', description: 'Revoke OAuth tokens' },

    // ── queue ────────────────────────────────────────────────────────────────
    { key: 'read:jobs', description: 'View background job status' },
    { key: 'update:jobs', description: 'Retry or update background jobs' },
    { key: 'delete:jobs', description: 'Remove background jobs from the queue' },

    // ── user (consumer-defined) ──────────────────────────────────────────────
    { key: 'admin:users', description: 'Full administrative access to user profiles' },

    // ── comment entity-type permissions (consumer-defined) ──────────────────
    { key: 'donations:read', description: 'Read comments on donation entities' },
    { key: 'donations:comment', description: 'Post comments on donation entities' },
    { key: 'tasks:read', description: 'Read comments on task entities' },
    { key: 'tasks:write', description: 'Post comments on task entities' },

    // ── donations (consumer-defined) ─────────────────────────────────────────
    { key: 'read:donations', description: 'View donation records' },
    { key: 'write:donations', description: 'Create or edit donation records' },
    { key: 'admin:donations', description: 'Administrative access to donation records' },
  ],

  roles: [
    // ── Base role ─────────────────────────────────────────────────────────────
    {
      key: 'MEMBER',
      description: 'Base role — auto-assigned to every new user on registration. No elevated permissions.',
      permissionKeys: [],
    },

    // ── Governance roles ──────────────────────────────────────────────────────
    {
      key: 'PRESIDENT',
      description: 'Highest authority. Full governance and administrative access.',
      permissionKeys: [
        'admin:users',
        ...RBAC_MANAGE,
        ...API_KEYS_ALL,
        ...DOCS_ALL,
        ...CUSTOM_FIELDS_ALL,
        ...DONATIONS_ALL,
        'read:notifications',
        'tasks:read',
        'tasks:write',
      ],
    },
    {
      key: 'VICE_PRESIDENT',
      description: 'Second in command. Broad governance access; cannot manage RBAC or revoke API keys.',
      permissionKeys: [
        'admin:users',
        ...RBAC_READ,
        'read:api_keys',
        'read:documents',
        'create:documents',
        'update:documents',
        'read:custom_field_definitions',
        'read:custom_field_values',
        'write:custom_field_values',
        ...DONATIONS_ALL,
        'read:notifications',
        'tasks:read',
        'tasks:write',
      ],
    },
    {
      key: 'SECRETARY',
      description: 'Administrative officer. Manages records, communications, and member data.',
      permissionKeys: [
        'admin:users',
        ...RBAC_READ,
        'read:documents',
        'create:documents',
        'update:documents',
        'read:custom_field_definitions',
        'read:custom_field_values',
        'write:custom_field_values',
        'read:donations',
        'write:donations',
        'donations:read',
        'donations:comment',
        'tasks:read',
        'tasks:write',
        'read:notifications',
      ],
    },
    {
      key: 'ASSISTANT_SECRETARY',
      description: 'Junior administrative officer. Read-heavy access with limited write capabilities.',
      permissionKeys: [
        ...RBAC_READ,
        'read:documents',
        'create:documents',
        'read:custom_field_definitions',
        'read:custom_field_values',
        'read:donations',
        'donations:read',
        'tasks:read',
        'read:notifications',
      ],
    },
    {
      key: 'TREASURER',
      description: 'Financial officer. Manages and reports on donation and financial records.',
      permissionKeys: [
        'read:donations',
        'write:donations',
        'admin:donations',
        'donations:read',
        'donations:comment',
        'read:documents',
        'create:documents',
        'read:custom_field_definitions',
        'read:custom_field_values',
        'write:custom_field_values',
        'read:notifications',
      ],
    },

    // ── Technical roles ───────────────────────────────────────────────────────
    {
      key: 'TECH_ADMIN',
      description: 'Technical administrator. Manages platform infrastructure, integrations, and system configuration.',
      permissionKeys: [
        'admin:users',
        ...RBAC_MANAGE,
        ...API_KEYS_ALL,
        ...JSON_STORE_ALL,
        'read:notifications',
        'read:cron',
        'update:cron',
        'read:jobs',
        'update:jobs',
        'delete:jobs',
        'read:oauth_token',
        'create:oauth_token',
        'delete:oauth_token',
        'read:custom_field_definitions',
        'create:custom_field_definitions',
        'update:custom_field_definitions',
        'delete:custom_field_definitions',
      ],
    },
    {
      key: 'ADMIN',
      description: 'Platform administrator. Manages users, RBAC assignments, API keys, json-store documents, and notifications.',
      permissionKeys: [
        'admin:users',
        ...RBAC_MANAGE,
        ...API_KEYS_ALL,
        ...JSON_STORE_ALL,
        'read:notifications',
        'read:cron',
        'update:cron',
      ],
    },
  ],

  roleGroups: [
    // ── Governance groups ─────────────────────────────────────────────────────
    {
      key: 'EXECUTIVE_BOARD',
      description: 'Top leadership — President and Vice President.',
      roleKeys: ['PRESIDENT', 'VICE_PRESIDENT'],
    },
    {
      key: 'SECRETARIAT',
      description: 'Administrative body — Secretary and Assistant Secretary.',
      roleKeys: ['SECRETARY', 'ASSISTANT_SECRETARY'],
    },
    {
      key: 'FINANCE_TEAM',
      description: 'Financial oversight — Treasurer.',
      roleKeys: ['TREASURER'],
    },
    {
      key: 'GOVERNING_COMMITTEE',
      description: 'Full elected governing body — all office bearers.',
      roleKeys: ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'ASSISTANT_SECRETARY', 'TREASURER'],
    },

    // ── Technical groups ──────────────────────────────────────────────────────
    {
      key: 'PLATFORM_ADMINS',
      description: 'Platform and technical administrators.',
      roleKeys: ['ADMIN', 'TECH_ADMIN'],
    },

    // ── Super admin group — seeded from SEED_SUPER_ADMIN_IDP_SUBS env var ─────
    {
      key: 'SUPER_ADMINS',
      description:
        'Full access across all roles. Membership seeded from the SEED_SUPER_ADMIN_IDP_SUBS environment variable.',
      roleKeys: [
        'PRESIDENT',
        'VICE_PRESIDENT',
        'SECRETARY',
        'ASSISTANT_SECRETARY',
        'TREASURER',
        'TECH_ADMIN',
        'ADMIN',
        'MEMBER',
      ],
      seedUsers: superAdminSubs,
    },
  ],
};
