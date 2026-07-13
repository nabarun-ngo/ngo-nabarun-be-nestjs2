import 'reflect-metadata';
import { GetEntityFieldValueHistoryHandler } from './get-entity-field-value-history.handler';
import { GetEntityFieldValueHistoryQuery } from './get-entity-field-value-history.query';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldValueHistoryEntry } from '../../../domain/entities/custom-field-value-history-entry/custom-field-value-history-entry.entity';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

function makeDefinition(id: string, key: string): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType: CustomFieldType.Text,
  });
  Object.defineProperty(def, 'id', { value: id, configurable: true });
  def.clearEvents();
  return def;
}

function makeHistoryEntry(fieldDefId: string): CustomFieldValueHistoryEntry {
  return CustomFieldValueHistoryEntry.create({
    fieldDefId,
    entityType: 'donation',
    entityId: 'entity-1',
    oldValue: 'old',
    newValue: 'new',
    changedBy: 'user|1',
  });
}

const defaultOptions = {
  entityTypes: [{ entityType: 'donation', readPermissions: ['read:donations'] }],
};

describe('GetEntityFieldValueHistoryHandler', () => {
  it('returns history entries with resolved field keys', async () => {
    const def = makeDefinition('def-1', 'donor_name');
    const entry = makeHistoryEntry('def-1');
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([def]),
      findByKey: jest.fn().mockResolvedValue(null),
    };
    const valueRepo = {
      findHistoryByEntity: jest.fn().mockResolvedValue([entry]),
    };
    const handler = new GetEntityFieldValueHistoryHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValueHistoryQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(valueRepo.findHistoryByEntity).toHaveBeenCalledWith('donation', 'entity-1', undefined);
    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].fieldKey).toBe('donor_name');
  });

  it('looks up fieldDefId when a fieldKey filter is provided', async () => {
    const def = makeDefinition('def-1', 'donor_name');
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([def]),
      findByKey: jest.fn().mockResolvedValue(def),
    };
    const valueRepo = { findHistoryByEntity: jest.fn().mockResolvedValue([]) };
    const handler = new GetEntityFieldValueHistoryHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
    );

    await handler.execute(
      new GetEntityFieldValueHistoryQuery('donation', 'entity-1', ['read:donations'], 'donor_name'),
    );

    expect(definitionRepo.findByKey).toHaveBeenCalledWith('donation', 'donor_name');
    expect(valueRepo.findHistoryByEntity).toHaveBeenCalledWith('donation', 'entity-1', 'def-1');
  });

  it('returns empty array when there are no history entries', async () => {
    const definitionRepo = {
      findByEntityType: jest.fn().mockResolvedValue([]),
      findByKey: jest.fn().mockResolvedValue(null),
    };
    const valueRepo = { findHistoryByEntity: jest.fn().mockResolvedValue([]) };
    const handler = new GetEntityFieldValueHistoryHandler(
      definitionRepo as any,
      valueRepo as any,
      defaultOptions as any,
    );

    const result = await handler.execute(
      new GetEntityFieldValueHistoryQuery('donation', 'entity-1', ['read:donations']),
    );

    expect(result.hasAccess).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});
