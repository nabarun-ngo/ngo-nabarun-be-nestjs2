import 'reflect-metadata';
import { GetEntityFieldValuesHandler } from './get-entity-field-values.handler';
import { GetEntityFieldValuesQuery } from './get-entity-field-values.query';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

function makeDefinition(
  key: string,
  opts: Partial<{
    fieldType: CustomFieldType;
    viewPermissions: string[];
    sortOrder: number;
  }> = {},
): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType: opts.fieldType ?? CustomFieldType.Text,
    viewPermissions: opts.viewPermissions ?? [],
    sortOrder: opts.sortOrder ?? 0,
  });
  def.clearEvents();
  return def;
}

const defaultOptions = {
  entityTypes: [
    { entityType: 'donation', readPermissions: ['read:donations'] },
  ],
};

const makeDefinitionRepo = (definitions: CustomFieldDefinition[] = []) => ({
  findByEntityType: jest.fn().mockResolvedValue(definitions),
});

const makeValueRepo = (values: { fieldDefId: string; value: string | null }[] = []) => ({
  findByEntity: jest.fn().mockResolvedValue(values),
});

const makeCodec = (parsedValue: unknown = null) => ({
  decryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
  parse: jest.fn().mockReturnValue(parsedValue),
});

describe('GetEntityFieldValuesHandler', () => {
  it('returns all field values for the entity ordered by sortOrder', async () => {
    const def1 = makeDefinition('field_b', { sortOrder: 2 });
    const def2 = makeDefinition('field_a', { sortOrder: 1 });
    const definitionRepo = makeDefinitionRepo([def1, def2]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec('hello');
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].key).toBe('field_a');
    expect(result.data[1].key).toBe('field_b');
  });

  it('omits fields the caller lacks viewPermissions for', async () => {
    const open       = makeDefinition('open_field',       { sortOrder: 0 });
    const restricted = makeDefinition('restricted_field', { sortOrder: 1, viewPermissions: ['admin:donations'] });
    const definitionRepo = makeDefinitionRepo([open, restricted]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec(null);
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe('open_field');
  });

  it('includes a restricted field when the caller holds the matching viewPermission', async () => {
    const open       = makeDefinition('open_field',       { sortOrder: 0 });
    const restricted = makeDefinition('restricted_field', { sortOrder: 1, viewPermissions: ['admin:donations'] });
    const definitionRepo = makeDefinitionRepo([open, restricted]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec(null);
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations', 'admin:donations']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((r) => r.key)).toContain('restricted_field');
  });

  it('includes a field with viewPermissions when at least one permission matches (OR semantics)', async () => {
    const restricted = makeDefinition('field_x', {
      viewPermissions: ['perm_a', 'perm_b'],
    });
    const definitionRepo = makeDefinitionRepo([restricted]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec(null);
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations', 'perm_b']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe('field_x');
  });

  it('includes a field with empty viewPermissions for any authenticated caller', async () => {
    const def = makeDefinition('public_field', { viewPermissions: [] });
    const definitionRepo = makeDefinitionRepo([def]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec('stored_value');
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe('public_field');
  });

  it('returns hasAccess: false when entity-level access port denies read', async () => {
    const def = makeDefinition('field_x');
    const definitionRepo = makeDefinitionRepo([def]);
    const valueRepo = makeValueRepo([]);
    const codec = makeCodec(null);
    const mockAccessPort = { canAccess: jest.fn().mockResolvedValue(false) };
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      mockAccessPort as any,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.hasAccess).toBe(false);
    expect(result.data).toEqual([]);
  });

  it('returns the deserialised stored value for each visible field', async () => {
    const def = makeDefinition('donor_name');
    const storedValue = { fieldDefId: def.id, value: 'raw_stored' };
    const definitionRepo = makeDefinitionRepo([def]);
    const valueRepo = makeValueRepo([storedValue]);
    const codec = makeCodec('parsed_value');
    const handler = new GetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValuesQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.data[0].value).toBe('parsed_value');
    expect(codec.decryptIfNeeded).toHaveBeenCalledWith('raw_stored', 'donor_name', false);
    expect(codec.parse).toHaveBeenCalledWith(CustomFieldType.Text, 'raw_stored', 'donor_name');
  });
});
