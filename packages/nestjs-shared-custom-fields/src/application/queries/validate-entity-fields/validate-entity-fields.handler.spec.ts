import 'reflect-metadata';
import { ValidateEntityFieldsHandler } from './validate-entity-fields.handler';
import { ValidateEntityFieldsQuery } from './validate-entity-fields.query';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import { FieldOption } from '../../../domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../../domain/value-objects/field-condition/field-condition.vo';

function makeDefinition(
  key: string,
  opts: Partial<{
    mandatory: boolean;
    isEncrypted: boolean;
    fieldType: CustomFieldType;
    fieldOptions: FieldOption[];
    condition: FieldCondition | null;
    viewPermissions: string[];
  }> = {},
): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType: opts.fieldType ?? CustomFieldType.Text,
    mandatory: opts.mandatory ?? false,
    fieldOptions: opts.fieldOptions ?? [],
    isEncrypted: opts.isEncrypted ?? false,
    condition: opts.condition ?? null,
    viewPermissions: opts.viewPermissions ?? [],
  });
  def.clearEvents();
  return def;
}

const defaultOptions = {
  entityTypes: [
    { entityType: 'donation', readPermissions: ['read:donations'] },
  ],
};

describe('ValidateEntityFieldsHandler', () => {
  it('returns valid=true when all mandatory fields have values', async () => {
    const mandatoryDef = makeDefinition('required_field', { mandatory: true });
    const storedValue = { fieldDefId: mandatoryDef.id, value: 'hello' };
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([mandatoryDef]),
    };
    const valueRepo = {
      findByEntity: jest.fn().mockResolvedValue([storedValue]),
    };
    const codec = {
      decryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
      parse: jest.fn().mockReturnValue('hello'),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.valid).toBe(true);
    expect(result.missingMandatory).toHaveLength(0);
    expect(result.conditionViolations).toHaveLength(0);
  });

  it('returns valid=false and lists missing mandatory fields', async () => {
    const mandatoryDef = makeDefinition('required_field', { mandatory: true });
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([mandatoryDef]),
    };
    const valueRepo = {
      findByEntity: jest.fn().mockResolvedValue([]), // no stored values
    };
    const codec = {
      decryptIfNeeded: jest.fn(),
      parse: jest.fn(),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.valid).toBe(false);
    expect(result.missingMandatory).toContain('required_field');
  });

  it('skips mandatory check for a field whose condition is not satisfied', async () => {
    const parentDef = makeDefinition('parent_field');
    const childDef = makeDefinition('child_field', {
      mandatory: true,
      condition: FieldCondition.of('parent_field', 'equals', 'yes'),
    });
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([parentDef, childDef]),
    };
    const valueRepo = { findByEntity: jest.fn().mockResolvedValue([]) };
    const codec = {
      decryptIfNeeded: jest.fn(),
      parse: jest.fn(),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations']),
    );

    // child_field condition not satisfied → not required → should be valid
    expect(result.missingMandatory).not.toContain('child_field');
  });

  it('skips mandatory check for a field the caller cannot see (viewPermissions)', async () => {
    const visibleMandatory = makeDefinition('visible_req', { mandatory: true });
    const hiddenMandatory  = makeDefinition('hidden_req',  { mandatory: true, viewPermissions: ['admin:donations'] });
    const storedValue = { fieldDefId: visibleMandatory.id, value: 'filled' };
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([visibleMandatory, hiddenMandatory]),
    };
    const valueRepo = { findByEntity: jest.fn().mockResolvedValue([storedValue]) };
    const codec = {
      decryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
      parse: jest.fn().mockImplementation((_type: unknown, raw: string) => raw),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations']),
      // caller lacks admin:donations → hidden_req is invisible → not validated
    );

    expect(result.valid).toBe(true);
    expect(result.missingMandatory).not.toContain('hidden_req');
  });

  it('validates a mandatory field the caller CAN see (viewPermissions)', async () => {
    const visibleMandatory = makeDefinition('visible_req', {
      mandatory: true,
      viewPermissions: ['admin:donations'],
    });
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([visibleMandatory]),
    };
    const valueRepo = { findByEntity: jest.fn().mockResolvedValue([]) };
    const codec = {
      decryptIfNeeded: jest.fn(),
      parse: jest.fn(),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations', 'admin:donations']),
    );

    expect(result.valid).toBe(false);
    expect(result.missingMandatory).toContain('visible_req');
  });

  it('flags a select field with an invalid option as a conditionViolation', async () => {
    const selectDef = makeDefinition('category', {
      fieldType: CustomFieldType.Select,
      fieldOptions: [FieldOption.of('valid_opt', 'Valid')],
    });
    const storedValue = { fieldDefId: selectDef.id, value: 'invalid_opt' };
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([selectDef]),
    };
    const valueRepo = { findByEntity: jest.fn().mockResolvedValue([storedValue]) };
    const codec = {
      decryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
      parse: jest.fn().mockReturnValue('invalid_opt'),
    };
    const handler = new ValidateEntityFieldsHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new ValidateEntityFieldsQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.conditionViolations).toContain('category');
    expect(result.valid).toBe(false);
  });
});
