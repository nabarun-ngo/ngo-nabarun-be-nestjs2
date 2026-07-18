import { BusinessError } from '@nabarun-ngo/nestjs-shared-core';

export class UserNotFoundError extends BusinessError {
  constructor(id: string) {
    super(`User ${id} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class DuplicateEmailError extends BusinessError {
  constructor(email: string) {
    super(`A user with email ${email} already exists`, 'DUPLICATE_EMAIL', 409);
  }
}

export class InvalidStatusTransitionError extends BusinessError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition user status from ${from} to ${to}`,
      'INVALID_STATUS_TRANSITION',
      422,
    );
  }
}

export class ProfileIncompleteError extends BusinessError {
  constructor() {
    super('User profile is incomplete', 'PROFILE_INCOMPLETE', 422);
  }
}

export class IdentityNotLinkedError extends BusinessError {
  constructor(userId: string) {
    super(
      `User ${userId} does not have a linked identity provider account`,
      'IDENTITY_NOT_LINKED',
      422,
    );
  }
}

export class ProfileNotProvisionedError extends BusinessError {
  constructor(sub: string) {
    super(
      `No UserProfile found for sub ${sub} — admin must create the user first`,
      'PROFILE_NOT_PROVISIONED',
      403,
    );
  }
}

export class IdentityProviderError extends BusinessError {
  constructor(message: string) {
    super(message, 'IDENTITY_PROVIDER_ERROR', 502);
  }
}
