
// Comma-separated IdP subs to auto-assign to the SUPER_ADMINS group.

import { Auth2SeedData } from "./auth-seed.types";

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

const QUEUE_PERMISSIONS_ALL = [
  'read:jobs',
  'update:jobs',
  'delete:jobs',
];

const JSON_STORE_ALL = [
  'read:json_documents',
  'create:json_documents',
  'update:json_documents',
  'delete:json_documents',
] as const;

const DOCS_READ_ALL = [
  'read:documents',
] as const;

const DOCS_CREATE = [
  'create:documents',
] as const;

const DOCS_ALL = [
  ...DOCS_READ_ALL,
  ...DOCS_CREATE,
  'update:documents',
  'delete:documents',
] as const;

const CUSTOM_FORMS_DEFINITIONS_ALL = [
  'read:custom_forms',
  'create:custom_forms',
  'update:custom_forms',
  'disable:custom_forms',
] as const;

const CUSTOM_FORMS_SUBMISSIONS_ALL = [
  'read:form_submissions',
  'write:form_submissions',
  'submit:form_submissions',
  'clear:form_submissions',
] as const;

const DONATIONS_ALL = [
  'read:donations',
  'write:donations',
  'admin:donations',
  'donations:read',
  'donations:comment',
  'create:donation',
  'create:donation_guest',
  'update:donation',
  'read:user_donations',
  'read:donation_guest',
] as const;

const ACCOUNTS_ALL = [
  'create:account',
  'update:account',
  'read:accounts',
  'read:transactions',
  'update:accounts',
  'update:transactions',
] as const;

const EXPENSES_ALL = [
  'create:expense',
  'update:expense',
  'create:expense_final',
  'create:expense_settle',
  'read:expenses',
] as const;

const EARNINGS_ALL = [
  'create:earning',
  'update:earning',
  'read:earning',
] as const;

const PROJECT_ALL = [
  'read:project',
  'create:project',
  'update:project',
  'read:activity',
  'create:activity',
  'update:activity',
  'read:beneficiary',
  'create:beneficiary',
  'update:beneficiary',
  'read:goal',
  'create:goal',
  'update:goal',
  'read:milestone',
  'create:milestone',
  'update:milestone',
  'read:project_team',
  'create:project_team',
  'update:project_team',
  'read:risk',
  'create:risk',
  'update:risk',
] as const;

const FINANCE_ALL = [
  ...DONATIONS_ALL,
  ...ACCOUNTS_ALL,
  ...EXPENSES_ALL,
  ...EARNINGS_ALL,
] as const;

const FINANCE_GRANULAR = [
  'create:donation',
  'create:donation_guest',
  'update:donation',
  'read:user_donations',
  'read:donation_guest',
  'create:account',
  'update:account',
  'read:accounts',
  'read:transactions',
  'update:accounts',
  'update:transactions',
  'create:expense',
  'update:expense',
  'create:expense_final',
  'create:expense_settle',
  'read:expenses',
  'create:earning',
  'update:earning',
  'read:earning',
] as const;

const WORKFLOW_ALL = [
  'create:workflow',
  'read:workflow',
  'update:workflow',
  'read:task',
  'update:task',
  'admin:workflows',
  'manage:workflow-definitions',
] as const;

const REPORTS_ALL = [
  'read:reports',
  'create:reports',
  'delete:reports',
  'approve:reports',
] as const;

const MEETING_ALL = [
  'read:meeting',
  'create:meeting',
  'update:meeting',
  'delete:meeting',
] as const;

const CRON_ALL = [
  'read:cron',
  'update:cron',
] as const;

const OAUTH_TOKEN_ALL = [
  'read:oauth_token',
  'create:oauth_token',
  'delete:oauth_token',
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
    // --- API Keys Management
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

    // ── links (consumer-defined) ──────────────────────────────────────────────
    { key: 'read:links', description: 'View user guide, policy, and app links' },

    // ── dms ────────────────────────────────────────────────────────────────
    { key: 'read:documents', description: 'View document references' },
    { key: 'create:documents', description: 'Upload or attach documents' },
    { key: 'update:documents', description: 'Update document metadata' },
    { key: 'delete:documents', description: 'Delete document references' },

    // ── reports ─────────────────────────────────────────────────────────────
    { key: 'read:reports', description: 'View report definitions and executions' },
    { key: 'create:reports', description: 'Generate reports' },
    { key: 'delete:reports', description: 'Delete report executions' },
    { key: 'approve:reports', description: 'Approve reports via workflow tasks' },

    // ── custom-forms ─────────────────────────────────────────────────────────
    { key: 'read:custom_forms', description: 'View custom form definitions' },
    { key: 'create:custom_forms', description: 'Create custom forms' },
    { key: 'update:custom_forms', description: 'Update custom forms and fields' },
    { key: 'disable:custom_forms', description: 'Disable custom forms and fields' },
    { key: 'read:form_submissions', description: 'Read form submission values' },
    { key: 'write:form_submissions', description: 'Save draft form submission values' },
    { key: 'submit:form_submissions', description: 'Submit form submissions' },
    { key: 'clear:form_submissions', description: 'Clear form submission values' },

    // ── token-vault ─────────────────────────────────────────────────────────
    { key: 'read:oauth_token', description: 'View OAuth token records' },
    { key: 'create:oauth_token', description: 'Create or refresh OAuth tokens' },
    { key: 'delete:oauth_token', description: 'Revoke OAuth tokens' },

    // ── queue ────────────────────────────────────────────────────────────────
    { key: 'read:jobs', description: 'View background job status' },
    { key: 'update:jobs', description: 'Retry or update background jobs' },
    { key: 'delete:jobs', description: 'Remove background jobs from the queue' },

    // ── user (consumer-defined) ──────────────────────────────────────────────
    { key: 'create:users', description: 'Create user profiles' },
    { key: 'read:users', description: 'Read user profiles' },
    { key: 'update:users', description: 'Update user profiles' },
    { key: 'delete:users', description: 'Delete user profiles' },
    { key: 'create:user_connections', description: 'Create user connections' },
    { key: 'read:user_connections', description: 'Read user connections' },
    { key: 'delete:user_connections', description: 'Delete user connections' },

    // ── comment entity-type permissions (consumer-defined) ──────────────────
    { key: 'donations:read', description: 'Read comments on donation entities' },
    { key: 'donations:comment', description: 'Post comments on donation entities' },
    { key: 'tasks:read', description: 'Read comments on task entities' },
    { key: 'tasks:write', description: 'Post comments on task entities' },

    // ── donations (consumer-defined) ─────────────────────────────────────────
    { key: 'read:donations', description: 'View donation records' },
    { key: 'write:donations', description: 'Create or edit donation records' },
    { key: 'admin:donations', description: 'Administrative access to donation records' },
    { key: 'create:donation', description: 'Create member donation' },
    { key: 'create:donation_guest', description: 'Create guest donation' },
    { key: 'update:donation', description: 'Update donation details' },
    { key: 'read:user_donations', description: 'View donations for a specific member' },
    { key: 'read:donation_guest', description: 'View guest donations' },

    // ── accounts / transactions (consumer-defined) ───────────────────────────
    { key: 'create:account', description: 'Create financial account' },
    { key: 'update:account', description: 'Update financial account' },
    { key: 'read:accounts', description: 'View financial accounts' },
    { key: 'read:transactions', description: 'View account transactions' },
    { key: 'update:accounts', description: 'Update accounts (admin)' },
    { key: 'update:transactions', description: 'Create or reverse transactions' },

    // ── expenses (consumer-defined) ──────────────────────────────────────────
    { key: 'create:expense', description: 'Create expense record' },
    { key: 'update:expense', description: 'Update expense record' },
    { key: 'create:expense_final', description: 'Finalize (approve) expense' },
    { key: 'create:expense_settle', description: 'Settle (pay) expense' },
    { key: 'read:expenses', description: 'View expense records' },

    // ── earnings (consumer-defined) ──────────────────────────────────────────
    { key: 'create:earning', description: 'Create earning record' },
    { key: 'update:earning', description: 'Update earning record' },
    { key: 'read:earning', description: 'View earning records' },

    // ── project (consumer-defined) ───────────────────────────────────────────
    { key: 'read:project', description: 'View project records' },
    { key: 'create:project', description: 'Create projects' },
    { key: 'update:project', description: 'Update projects' },
    { key: 'read:activity', description: 'View project activities' },
    { key: 'create:activity', description: 'Create project activities' },
    { key: 'update:activity', description: 'Update project activities' },
    { key: 'read:beneficiary', description: 'View project beneficiaries' },
    { key: 'create:beneficiary', description: 'Create project beneficiaries' },
    { key: 'update:beneficiary', description: 'Update project beneficiaries' },
    { key: 'read:goal', description: 'View project goals' },
    { key: 'create:goal', description: 'Create project goals' },
    { key: 'update:goal', description: 'Update project goals' },
    { key: 'read:milestone', description: 'View project milestones' },
    { key: 'create:milestone', description: 'Create project milestones' },
    { key: 'update:milestone', description: 'Update project milestones' },
    { key: 'read:project_team', description: 'View project team members' },
    { key: 'create:project_team', description: 'Add project team members' },
    { key: 'update:project_team', description: 'Update project team members' },
    { key: 'read:risk', description: 'View project risks' },
    { key: 'create:risk', description: 'Create project risks' },
    { key: 'update:risk', description: 'Update project risks' },
    { key: 'create:donation', description: 'Create member donations' },
    { key: 'create:donation_guest', description: 'Create guest donations' },
    { key: 'update:donation', description: 'Update donation details or payment status' },
    { key: 'read:user_donations', description: 'View donations for a specific member' },
    { key: 'read:donation_guest', description: 'List guest donations' },

    // ── accounts & transactions (consumer-defined) ───────────────────────────
    { key: 'create:account', description: 'Create financial accounts' },
    { key: 'update:account', description: 'Update financial account details' },
    { key: 'read:accounts', description: 'View financial accounts' },
    { key: 'read:transactions', description: 'View account transactions' },
    { key: 'update:accounts', description: 'Adjust account balances' },
    { key: 'update:transactions', description: 'Reverse or fix transactions' },

    // ── expenses (consumer-defined) ──────────────────────────────────────────
    { key: 'create:expense', description: 'Create expense records' },
    { key: 'update:expense', description: 'Update expense records' },
    { key: 'create:expense_final', description: 'Finalize (approve) expenses' },
    { key: 'create:expense_settle', description: 'Settle approved expenses' },
    { key: 'read:expenses', description: 'View expense records' },

    // ── earnings (consumer-defined) ──────────────────────────────────────────
    { key: 'create:earning', description: 'Create earning records' },
    { key: 'update:earning', description: 'Update earning records' },
    { key: 'read:earning', description: 'View earning records' },

    // ── workflow (consumer-defined) ──────────────────────────────────────────
    { key: 'create:workflow', description: 'Start new workflow instances' },
    { key: 'read:workflow', description: 'View workflow instances and timelines' },
    { key: 'update:workflow', description: 'Cancel or update workflow instances' },
    { key: 'read:task', description: 'View assigned workflow tasks (inbox)' },
    { key: 'update:task', description: 'Claim, complete, or delegate workflow tasks' },
    { key: 'admin:workflows', description: 'Administrative workflow operations (force-skip, stuck detector)' },
    { key: 'manage:workflow-definitions', description: 'Publish and manage workflow definitions' },

    // ── meeting (consumer-defined) ───────────────────────────────────────────
    { key: 'read:meeting', description: 'View meeting records' },
    { key: 'create:meeting', description: 'Schedule meetings and sync with Google Calendar' },
    { key: 'update:meeting', description: 'Update or cancel meeting details' },
    { key: 'delete:meeting', description: 'Delete meeting records' },
  ],

  roles: [
    // ── Base role ─────────────────────────────────────────────────────────────
    {
      key: 'MEMBER',
      description: 'Base role — auto-assigned to every new user on registration. No elevated permissions.',
      permissionKeys: [
        ...RBAC_READ,
        //DMS Create and Read
        ...DOCS_CREATE,
        ...DOCS_READ_ALL,
        'create:workflow',
        'read:workflow',
        'read:task',
        'read:user_donations',
        'update:donation',
        'read:links',
        'read:meeting',
        ...CUSTOM_FORMS_SUBMISSIONS_ALL,
        'read:users',
        'read:user_connections',

      ],
    },

    // ── Governance roles ──────────────────────────────────────────────────────
    {
      key: 'PRESIDENT',
      description: 'Highest authority. Full governance and administrative access.',
      permissionKeys: [
        ...RBAC_MANAGE,
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'VICE_PRESIDENT',
      description: 'Second in command. Broad governance access.',
      permissionKeys: [
        ...RBAC_MANAGE,
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'SECRETARY',
      description: 'Administrative officer. Manages records, communications, and member data.',
      permissionKeys: [
        ...RBAC_MANAGE,
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'ASSISTANT_SECRETARY',
      description: 'Junior administrative officer. Read-heavy access with limited write capabilities.',
      permissionKeys: [
        ...RBAC_MANAGE,
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'TREASURER',
      description: 'Financial officer. Manages and reports on donation and financial records.',
      permissionKeys: [
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'CASHIER',
      description: 'Cashier officer. Manages and reports on donation and financial records.',
      permissionKeys: [
        ...DOCS_ALL,
        'update:users',
        'read:user_connections',

      ],
    },
    {
      key: 'GROUP_COORDINATOR',
      description: 'Financial officer. Manages and reports on donation and financial records.',
      permissionKeys: [
        'update:users',
        'read:user_connections',
      ],
    },
    {
      key: 'COMMUNITY_MANAGER',
      description: 'Community Manager. Manages and reports on community and financial records.',
      permissionKeys: [

      ],
    },

    // ── Technical roles ───────────────────────────────────────────────────────
    {
      key: 'TECH_ADMIN',
      description: 'Technical administrator. Manages platform infrastructure, integrations, and system configuration.',
      permissionKeys: [
        ...API_KEYS_ALL,
        ...JSON_STORE_ALL,
        ...QUEUE_PERMISSIONS_ALL,
        ...DOCS_ALL,
        ...CUSTOM_FORMS_DEFINITIONS_ALL,
        ...CRON_ALL,
        ...OAUTH_TOKEN_ALL,
        'create:user_connections',
        'delete:user_connections',
      ],
    },
    {
      key: 'ADMIN',
      description: 'System Administrator. Full access to user management.',
      permissionKeys: [
        'create:users',
        'update:users',
        'delete:users',
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
      roleKeys: ['TREASURER', 'CASHIER'],
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
        'COMMUNITY_MANAGER',
        'GROUP_COORDINATOR',
        'CASHIER',
        'TECH_ADMIN',
        'ADMIN',
        'MEMBER',
      ],
      seedUsers: superAdminSubs,
    },
  ],
};
