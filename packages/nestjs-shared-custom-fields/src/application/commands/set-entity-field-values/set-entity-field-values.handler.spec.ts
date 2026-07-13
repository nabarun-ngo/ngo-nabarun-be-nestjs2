import 'reflect-metadata';
import { SetEntityFieldValuesHandler } from './set-entity-field-values.handler';
import { SetEntityFieldValuesCommand } from './set-entity-field-values.command';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldValue } from '../../../domain/aggregates/custom-field-value/custom-field-value.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import {
  CustomFieldDefinitionNotFoundError,
  CustomFieldAccessDeniedError,
} from '../../../domain/errors/custom-field.errors';
import { EntityAccessDeniedError } from '@ce/nestjs-shared-core';

function makeDefinition(
  key: string,
  fieldType = CustomFieldType.Text,
  viewPermissions: string[] = [],
): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType,
    viewPermissions,
  });
  def.clearEvents();
  return def;
}

function makeMandatoryDefinition(
  key: string,
  viewPermissions: string[] = [],
): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key,
    label: key,
    fieldType: CustomFieldType.Text,
    mandatory: true,
    viewPermissions,
  });
  def.clearEvents();
  return def;
}

function makeValue(fieldDefId: string): CustomFieldValue {
  const fv = CustomFieldValue.create({
    entityType: 'donation',
    entityId: 'entity-1',
    fieldDefId,
    value: 'stored',
    changedBy: 'system',
  });
  fv.clearEvents();
  return fv;
}

const makeDefinitionRepo = (definitions: CustomFieldDefinition[] = []) => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  findPaged: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findByKey: jest.fn(),
  findByEntityType: jest.fn().mockResolvedValue(definitions),
});

const makeValueRepo = (values: CustomFieldValue[] = []) => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  findPaged: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  upsertMany: jest.fn().mockResolvedValue(values),
  findByEntity: jest.fn().mockResolvedValue([]),
  deleteByEntity: jest.fn(),
  findHistoryByEntity: jest.fn(),
});

const makeCodec = () => ({
  serialise: jest.fn().mockReturnValue('serialised'),
  encryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
  decryptIfNeeded: jest.fn().mockImplementation((s: string) => Promise.resolve(s)),
  parse: jest.fn().mockReturnValue(null),
});

const makeEventBus = () => ({ publishAll: jest.fn() });

const defaultOptions = {
  entityTypes: [
    {
      entityType: 'donation',
      writePermissions: ['write:donations'],
      readPermissions: ['read:donations'],
    },
  ],
};

describe('SetEntityFieldValuesHandler', () => {
  it('validates, serialises, upserts values, and emits events', async () => {
    const def = makeDefinition('donor_name');
    const returnedValue = makeValue(def.id);
    const definitionRepo = makeDefinitionRepo([def]);
    const valueRepo = makeValueRepo([returnedValue]);
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    const result = await handler.execute(
      new SetEntityFieldValuesCommand(
        'donation',
        'entity-1',
        { donor_name: 'John Doe' },
        'user|1',
        ['write:donations'],
      ),
    );

    expect(codec.serialise).toHaveBeenCalledTimes(1);
    expect(valueRepo.upsertMany).toHaveBeenCalledWith(
      'donation',
      'entity-1',
      expect.arrayContaining([
        expect.objectContaining({ fieldDefId: def.id, changedBy: 'user|1' }),
      ]),
    );
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('throws CustomFieldDefinitionNotFoundError for an unknown field key', async () => {
    const definitionRepo = makeDefinitionRepo([makeDefinition('known_field')]);
    const valueRepo = makeValueRepo();
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    await expect(
      handler.execute(
        new SetEntityFieldValuesCommand(
          'donation',
          'entity-1',
          { unknown_field: 'value' },
          'user|1',
          ['write:donations'],
        ),
      ),
    ).rejects.toThrow(CustomFieldDefinitionNotFoundError);

    expect(valueRepo.upsertMany).not.toHaveBeenCalled();
  });

  it('throws EntityAccessDeniedError when access port denies write', async () => {
    const def = makeDefinition('field_x');
    const definitionRepo = makeDefinitionRepo([def]);
    const valueRepo = makeValueRepo();
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const mockAccessPort = { canAccess: jest.fn().mockResolvedValue(false) };
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      mockAccessPort as any,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    await expect(
      handler.execute(
        new SetEntityFieldValuesCommand(
          'donation', 'entity-1', { field_x: 'v' }, 'user|1', ['write:donations'],
        ),
      ),
    ).rejects.toThrow(EntityAccessDeniedError);

    expect(valueRepo.upsertMany).not.toHaveBeenCalled();
  });

  it('throws CustomFieldAccessDeniedError when writing to a field the user cannot see', async () => {
    const restricted = makeDefinition('secret_field', CustomFieldType.Text, ['admin:donations']);
    const definitionRepo = makeDefinitionRepo([restricted]);
    const valueRepo = makeValueRepo();
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    await expect(
      handler.execute(
        new SetEntityFieldValuesCommand(
          'donation',
          'entity-1',
          { secret_field: 'value' },
          'user|1',
          ['write:donations'], // missing admin:donations
        ),
      ),
    ).rejects.toThrow(CustomFieldAccessDeniedError);

    expect(valueRepo.upsertMany).not.toHaveBeenCalled();
  });

  it('allows writing to a field when caller holds the matching viewPermission', async () => {
    const restricted = makeDefinition('secret_field', CustomFieldType.Text, ['admin:donations']);
    const returnedValue = makeValue(restricted.id);
    const definitionRepo = makeDefinitionRepo([restricted]);
    const valueRepo = makeValueRepo([returnedValue]);
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    const result = await handler.execute(
      new SetEntityFieldValuesCommand(
        'donation',
        'entity-1',
        { secret_field: 'value' },
        'user|1',
        ['write:donations', 'admin:donations'],
      ),
    );

    expect(valueRepo.upsertMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('does not enforce mandatory check for fields the caller cannot see', async () => {
    const visibleMandatory = makeMandatoryDefinition('visible_required');
    const hiddenMandatory  = makeMandatoryDefinition('hidden_required', ['admin:donations']);
    const returnedValue = makeValue(visibleMandatory.id);
    const definitionRepo = makeDefinitionRepo([visibleMandatory, hiddenMandatory]);
    const valueRepo = makeValueRepo([returnedValue]);
    const codec = makeCodec();
    const eventBus = makeEventBus();
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    // Caller only submits the field they can see — hidden_required should NOT raise MandatoryFieldMissingError
    await expect(
      handler.execute(
        new SetEntityFieldValuesCommand(
          'donation',
          'entity-1',
          { visible_required: 'hello' },
          'user|1',
          ['write:donations'], // no admin:donations → cannot see hidden_required
        ),
      ),
    ).resolves.toBeDefined();

    expect(valueRepo.upsertMany).toHaveBeenCalledTimes(1);
  });

  it('publishes events AFTER upsertMany', async () => {
    const def = makeDefinition('field_x');
    const returnedValue = makeValue(def.id);
    const definitionRepo = makeDefinitionRepo([def]);
    const callOrder: string[] = [];
    const valueRepo = makeValueRepo([returnedValue]);
    (valueRepo.upsertMany as jest.Mock).mockImplementation(() => {
      callOrder.push('upsertMany');
      return Promise.resolve([returnedValue]);
    });
    const codec = makeCodec();
    const eventBus = makeEventBus();
    (eventBus.publishAll as jest.Mock).mockImplementation(() => {
      callOrder.push('publishAll');
    });
    const handler = new SetEntityFieldValuesHandler(
      definitionRepo as any,
      valueRepo as any,
      null,
      defaultOptions as any,
      codec as any,
      eventBus as any,
    );

    await handler.execute(
      new SetEntityFieldValuesCommand('donation', 'entity-1', { field_x: 'v' }, 'u', ['write:donations']),
    );

    expect(callOrder).toEqual(['upsertMany', 'publishAll']);
  });
});
