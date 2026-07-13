import {
  EntityTypeForbiddenError,
  CustomFieldAccessDeniedError,
  CustomFieldKeyAlreadyExistsError,
  CustomFieldDefinitionNotFoundError,
  MaxFieldsPerEntityTypeExceededError,
  InvalidFieldValueError,
  FieldConditionViolatedError,
  EncryptionKeyMissingError,
} from './custom-field.errors';

describe('custom-field domain errors', () => {
  it('EntityTypeForbiddenError has correct code and 403 status', () => {
    const err = new EntityTypeForbiddenError('invoice');

    expect(err.message).toContain('invoice');
    expect(err.errorCode).toBe('CUSTOM_FIELD_ENTITY_TYPE_FORBIDDEN');
    expect(err.statusCode).toBe(403);
  });

  it('CustomFieldAccessDeniedError has correct code and 403 status (no entityId)', () => {
    const err = new CustomFieldAccessDeniedError('manage', 'donation');

    expect(err.message).toContain('manage');
    expect(err.message).toContain('donation');
    expect(err.errorCode).toBe('CUSTOM_FIELD_ACCESS_DENIED');
    expect(err.statusCode).toBe(403);
  });

  it('CustomFieldAccessDeniedError includes entityId when provided', () => {
    const err = new CustomFieldAccessDeniedError('write', 'donation', 'entity-123');

    expect(err.message).toContain('donation/entity-123');
  });

  it('CustomFieldKeyAlreadyExistsError has correct code and 409 status', () => {
    const err = new CustomFieldKeyAlreadyExistsError('donor_name', 'donation');

    expect(err.message).toContain('donor_name');
    expect(err.message).toContain('donation');
    expect(err.errorCode).toBe('CUSTOM_FIELD_KEY_ALREADY_EXISTS');
    expect(err.statusCode).toBe(409);
  });

  it('CustomFieldDefinitionNotFoundError has correct code and 404 status', () => {
    const err = new CustomFieldDefinitionNotFoundError('def-1');

    expect(err.message).toContain('def-1');
    expect(err.errorCode).toBe('CUSTOM_FIELD_DEFINITION_NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  it('MaxFieldsPerEntityTypeExceededError has correct code and 400 status', () => {
    const err = new MaxFieldsPerEntityTypeExceededError('donation', 20);

    expect(err.message).toContain('donation');
    expect(err.message).toContain('20');
    expect(err.errorCode).toBe('CUSTOM_FIELD_MAX_FIELDS_EXCEEDED');
    expect(err.statusCode).toBe(400);
  });

  it('InvalidFieldValueError has correct code and 400 status', () => {
    const err = new InvalidFieldValueError('Value must be a string');

    expect(err.message).toBe('Value must be a string');
    expect(err.errorCode).toBe('CUSTOM_FIELD_INVALID_VALUE');
    expect(err.statusCode).toBe(400);
  });

  it('FieldConditionViolatedError has correct code and 400 status', () => {
    const err = new FieldConditionViolatedError('child_field');

    expect(err.message).toContain('child_field');
    expect(err.errorCode).toBe('CUSTOM_FIELD_CONDITION_VIOLATED');
    expect(err.statusCode).toBe(400);
  });

  it('EncryptionKeyMissingError has correct code and 500 status', () => {
    const err = new EncryptionKeyMissingError('secret_field');

    expect(err.message).toContain('secret_field');
    expect(err.errorCode).toBe('CUSTOM_FIELD_ENCRYPTION_KEY_MISSING');
    expect(err.statusCode).toBe(500);
  });
});
