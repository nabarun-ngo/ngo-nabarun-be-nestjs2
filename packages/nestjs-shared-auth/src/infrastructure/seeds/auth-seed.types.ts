export interface Auth2PermissionSeed {
  key: string;
  description?: string;
}

export interface Auth2RoleSeed {
  key: string;
  description?: string;
  permissionKeys: string[];
  seedUsers?: string[];
}

export interface Auth2RoleGroupSeed {
  key: string;
  description?: string;
  roleKeys: string[];
  seedUsers?: string[];
}

export interface Auth2SeedData {
  permissions: Auth2PermissionSeed[];
  roles: Auth2RoleSeed[];
  roleGroups?: Auth2RoleGroupSeed[];
}
