import 'reflect-metadata';
import { DeactivateFieldDefinitionHandler } from './deactivate-field-definition.handler';
import { DeactivateFieldDefinitionCommand } from './deactivate-field-definition.command';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import { CustomFieldDefinitionNotFoundError } from '../../../domain/errors/custom-field.errors';

function makeActiveDefinition(): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key: 'field_a',
    label: 'Field A',
    fieldType: CustomFieldType.Text,
  });
  def.clearEvents();
  return def;
}

function makeInactiveDefinition(): CustomFieldDefinition {
  const def = makeActiveDefinition();
  def.deactivate();
  def.clearEvents();
  return def;
}

const makeDefinitionRepo = (definition?: CustomFieldDefinition) => ({
  findById: jest.fn().mockResolvedValue(definition ?? null),
  findAll: jest.fn(),
  findPaged: jest.fn(),
  create: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  count: jest.fn(),
  findByKey: jest.fn(),
  findByEntityType: jest.fn(),
});

const makeEventBus = () => ({ publishAll: jest.fn() });

const defaultOptions = {
  entityTypes: [
    { entityType: 'donation', managePermissions: ['manage:donations'] },
  ],
};

describe('DeactivateFieldDefinitionHandler', () => {
  it('deactivates an active definition, calls update, and emits events', async () => {
    const definition = makeActiveDefinition();
    const definitionRepo = makeDefinitionRepo(definition);
    const eventBus = makeEventBus();
    const handler = new DeactivateFieldDefinitionHandler(
      definitionRepo as any,
      defaultOptions as any,
      eventBus as any,
    );

    const result = await handler.execute(
      new DeactivateFieldDefinitionCommand(definition.id, 'user|1', ['manage:donations']),
    );

    expect(result.active).toBe(false);
    expect(definitionRepo.update).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — deactivating an already-inactive definition does not emit an event', async () => {
    const definition = makeInactiveDefinition();
    const definitionRepo = makeDefinitionRepo(definition);
    const eventBus = makeEventBus();
    const handler = new DeactivateFieldDefinitionHandler(
      definitionRepo as any,
      defaultOptions as any,
      eventBus as any,
    );

    await handler.execute(
      new DeactivateFieldDefinitionCommand(definition.id, 'user|1', ['manage:donations']),
    );

    // update still called, but publishAll called with empty events (no-op on inactive)
    expect(definitionRepo.update).toHaveBeenCalledTimes(1);
    const publishedEvents = (eventBus.publishAll as jest.Mock).mock.calls[0][0];
    expect(publishedEvents).toHaveLength(0);
  });

  it('throws CustomFieldDefinitionNotFoundError when definition does not exist', async () => {
    const definitionRepo = makeDefinitionRepo(undefined);
    const eventBus = makeEventBus();
    const handler = new DeactivateFieldDefinitionHandler(
      definitionRepo as any,
      defaultOptions as any,
      eventBus as any,
    );

    await expect(
      handler.execute(new DeactivateFieldDefinitionCommand('missing', 'u', ['manage:donations'])),
    ).rejects.toThrow(CustomFieldDefinitionNotFoundError);

    expect(definitionRepo.update).not.toHaveBeenCalled();
    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });
});
