import 'reflect-metadata';
import { ListFieldDefinitionsHandler } from './list-field-definitions.handler';
import { ListFieldDefinitionsQuery } from './list-field-definitions.query';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

function makeDefinition(
  key: string,
  sortOrder = 0,
  isHidden = false,
  viewPermissions: string[] = [],
): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType: CustomFieldType.Text,
    sortOrder,
    isHidden,
    viewPermissions,
  });
  def.clearEvents();
  return def;
}

const defaultOptions = {
  entityTypes: [
    {
      entityType: 'donation',
      readPermissions: ['read:donations'],
      managePermissions: ['manage:donations'],
    },
  ],
};

describe('ListFieldDefinitionsHandler', () => {
  it('returns definitions ordered by sortOrder', async () => {
    const def1 = makeDefinition('field_b', 2);
    const def2 = makeDefinition('field_a', 1);
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([def1, def2]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['read:donations']),
    );

    expect(result.data[0].key).toBe('field_a');
    expect(result.data[1].key).toBe('field_b');
  });

  it('filters out hidden definitions by default (includeHidden = false)', async () => {
    const visible = makeDefinition('visible_field', 0, false);
    const hidden = makeDefinition('hidden_field', 1, true);
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([visible, hidden]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['read:donations'], true, false),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe('visible_field');
  });

  it('includes hidden definitions when includeHidden = true', async () => {
    const visible = makeDefinition('visible_field');
    const hidden = makeDefinition('hidden_field', 1, true);
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([visible, hidden]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['read:donations'], true, true),
    );

    expect(result.data).toHaveLength(2);
  });

  it('passes activeOnly filter to repository', async () => {
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    await handler.execute(new ListFieldDefinitionsQuery('donation', ['read:donations'], false));

    expect(definitionRepo.findByEntityType).toHaveBeenCalledWith('donation', { activeOnly: false });
  });

  it('returns empty data with hasAccess: false when user lacks read permission (graceful deny)', async () => {
    const definitionRepo = { findByEntityType: jest.fn() };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['other:permission']),
    );

    expect(result.hasAccess).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.data).toHaveLength(0);
    expect(result.message).toBeDefined();
    expect(definitionRepo.findByEntityType).not.toHaveBeenCalled();
  });

  it('omits fields the caller lacks viewPermissions for', async () => {
    const unrestricted = makeDefinition('open_field', 0);
    const restricted = makeDefinition('restricted_field', 1, false, ['admin:donations']);
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([unrestricted, restricted]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['read:donations']),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe('open_field');
  });

  it('includes restricted fields when caller has matching viewPermission', async () => {
    const unrestricted = makeDefinition('open_field', 0);
    const restricted = makeDefinition('restricted_field', 1, false, ['admin:donations']);
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([unrestricted, restricted]),
    };
    const handler = new ListFieldDefinitionsHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new ListFieldDefinitionsQuery('donation', ['read:donations', 'admin:donations']),
    );

    expect(result.data).toHaveLength(2);
  });
});
