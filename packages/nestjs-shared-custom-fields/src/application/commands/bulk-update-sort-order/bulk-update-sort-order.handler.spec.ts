import 'reflect-metadata';
import { BulkUpdateSortOrderHandler } from './bulk-update-sort-order.handler';
import { BulkUpdateSortOrderCommand } from './bulk-update-sort-order.command';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import { CustomFieldDefinitionNotFoundError } from '../../../domain/errors/custom-field.errors';

function makeDefinition(id: string, sortOrder = 0): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key: `field_${id}`,
    label: `Field ${id}`,
    fieldType: CustomFieldType.Text,
    sortOrder,
  });
  // Override id for predictable lookup
  Object.defineProperty(def, 'id', { value: id, writable: false, configurable: true });
  def.clearEvents();
  return def;
}

const defaultOptions = {
  entityTypes: [
    { entityType: 'donation', managePermissions: ['manage:donations'] },
  ],
};

describe('BulkUpdateSortOrderHandler', () => {
  it('updates sort order for each item in the batch', async () => {
    const def1 = makeDefinition('def-1', 1);
    const def2 = makeDefinition('def-2', 2);
    const mockFindById = jest.fn()
      .mockResolvedValueOnce(def1)
      .mockResolvedValueOnce(def2);
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    const definitionRepo = {
      findById: mockFindById,
      update: mockUpdate,
    };
    const handler = new BulkUpdateSortOrderHandler(definitionRepo as any, defaultOptions as any);

    const result = await handler.execute(
      new BulkUpdateSortOrderCommand(
        'donation',
        [{ id: 'def-1', sortOrder: 10 }, { id: 'def-2', sortOrder: 20 }],
        'user|1',
        ['manage:donations'],
      ),
    );

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(def1.sortOrder).toBe(10);
    expect(def2.sortOrder).toBe(20);
  });

  it('throws CustomFieldDefinitionNotFoundError when any item id is not found', async () => {
    const mockFindById = jest.fn().mockResolvedValue(null);
    const handler = new BulkUpdateSortOrderHandler(
      { findById: mockFindById, update: jest.fn() } as any,
      defaultOptions as any,
    );

    await expect(
      handler.execute(
        new BulkUpdateSortOrderCommand(
          'donation',
          [{ id: 'missing', sortOrder: 5 }],
          'user|1',
          ['manage:donations'],
        ),
      ),
    ).rejects.toThrow(CustomFieldDefinitionNotFoundError);
  });

  it('does not emit events (updateSortOrder is event-free)', async () => {
    const def = makeDefinition('def-1', 1);
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    const handler = new BulkUpdateSortOrderHandler(
      { findById: jest.fn().mockResolvedValue(def), update: mockUpdate } as any,
      defaultOptions as any,
    );

    await handler.execute(
      new BulkUpdateSortOrderCommand('donation', [{ id: 'def-1', sortOrder: 99 }], 'u', ['manage:donations']),
    );

    expect(def.domainEvents).toHaveLength(0);
  });
});
