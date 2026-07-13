import { BusinessError } from '@ce/nestjs-shared-core';

export class ApiKeyNotFoundError extends BusinessError {
  constructor(id: string) {
    super(`API key '${id}' not found.`, 'API_KEY_NOT_FOUND', 404);
  }
}

export class ApiKeyExpiredError extends BusinessError {
  constructor() {
    super('API key has expired.', 'API_KEY_EXPIRED', 401);
  }
}

export class InvalidApiKeyError extends BusinessError {
  constructor() {
    super('Invalid or expired API key.', 'INVALID_API_KEY', 401);
  }
}

export class InsufficientPermissionsError extends BusinessError {
  constructor() {
    super(
      'Cannot grant permissions that exceed your own access level.',
      'INSUFFICIENT_PERMISSIONS',
      403,
    );
  }
}

export class RoleNotFoundError extends BusinessError {
  constructor(key: string) {
    super(`Role '${key}' not found.`, 'ROLE_NOT_FOUND', 404);
  }
}

export class PermissionNotFoundError extends BusinessError {
  constructor(key: string) {
    super(`Permission '${key}' not found.`, 'PERMISSION_NOT_FOUND', 404);
  }
}

export class RoleGroupNotFoundError extends BusinessError {
  constructor(key: string) {
    super(`Role group '${key}' not found.`, 'ROLE_GROUP_NOT_FOUND', 404);
  }
}

export class UserRoleNotFoundError extends BusinessError {
  constructor(id: string) {
    super(`User role assignment '${id}' not found.`, 'USER_ROLE_NOT_FOUND', 404);
  }
}

export class UserRoleGroupNotFoundError extends BusinessError {
  constructor(id: string) {
    super(
      `User role-group assignment '${id}' not found.`,
      'USER_ROLE_GROUP_NOT_FOUND',
      404,
    );
  }
}

export class UserRoleAlreadyRevokedError extends BusinessError {
  constructor(id: string) {
    super(
      `User role assignment '${id}' has already been revoked.`,
      'USER_ROLE_ALREADY_REVOKED',
      400,
    );
  }
}

export class UserRoleGroupAlreadyRevokedError extends BusinessError {
  constructor(id: string) {
    super(
      `User role-group assignment '${id}' has already been revoked.`,
      'USER_ROLE_GROUP_ALREADY_REVOKED',
      400,
    );
  }
}
