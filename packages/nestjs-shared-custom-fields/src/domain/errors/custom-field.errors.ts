import { BusinessError } from '@ce/nestjs-shared-core';

export class EntityTypeForbiddenError extends BusinessError {
  constructor(entityType: string) {
    super(
      `entityType "${entityType}" is not registered with CustomFields2Module`,
      'CUSTOM_FIELD_ENTITY_TYPE_FORBIDDEN',
      403,
    );
  }
}

export class CustomFieldAccessDeniedError extends BusinessError {
  constructor(action: string, entityType: string, entityId?: string) {
    const location = entityId ? `${entityType}/${entityId}` : entityType;
    super(
      `No ${action} access to custom fields on ${location}`,
      'CUSTOM_FIELD_ACCESS_DENIED',
      403,
    );
  }
}

export class CustomFieldKeyAlreadyExistsError extends BusinessError {
  constructor(key: string, entityType: string) {
    super(
      `A custom field with key "${key}" already exists for entityType "${entityType}"`,
      'CUSTOM_FIELD_KEY_ALREADY_EXISTS',
      409,
    );
  }
}

export class CustomFieldDefinitionNotFoundError extends BusinessError {
  constructor(idOrKey: string) {
    super(
      `Custom field definition "${idOrKey}" not found`,
      'CUSTOM_FIELD_DEFINITION_NOT_FOUND',
      404,
    );
  }
}

export class MaxFieldsPerEntityTypeExceededError extends BusinessError {
  constructor(entityType: string, max: number) {
    super(
      `entityType "${entityType}" has reached the maximum of ${max} custom field definitions`,
      'CUSTOM_FIELD_MAX_FIELDS_EXCEEDED',
      400,
    );
  }
}

export class InvalidFieldValueError extends BusinessError {
  constructor(message: string) {
    super(message, 'CUSTOM_FIELD_INVALID_VALUE', 400);
  }
}

export class FieldConditionViolatedError extends BusinessError {
  constructor(fieldKey: string) {
    super(
      `Field "${fieldKey}" has a stale or invalid value relative to its parent condition field`,
      'CUSTOM_FIELD_CONDITION_VIOLATED',
      400,
    );
  }
}

export class EncryptionKeyMissingError extends BusinessError {
  constructor(fieldKey: string) {
    super(
      `Field "${fieldKey}" is encrypted but no encryptionKey is configured on CustomFields2Module`,
      'CUSTOM_FIELD_ENCRYPTION_KEY_MISSING',
      500,
    );
  }
}

export class InvalidFieldDefinitionError extends BusinessError {
  constructor(message: string) {
    super(message, 'CUSTOM_FIELD_INVALID_DEFINITION', 400);
  }
}

export class MandatoryFieldMissingError extends BusinessError {
  constructor(fieldKey: string) {
    super(
      `Field "${fieldKey}" is mandatory and must have a value`,
      'CUSTOM_FIELD_MANDATORY_MISSING',
      400,
    );
  }
}
