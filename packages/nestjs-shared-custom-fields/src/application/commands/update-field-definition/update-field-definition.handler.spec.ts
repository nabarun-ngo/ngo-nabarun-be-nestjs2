import 'reflect-metadata';
import { UpdateFieldDefinitionHandler } from './update-field-definition.handler';
import { UpdateFieldDefinitionCommand } from './update-field-definition.command';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import {
  CustomFieldDefinitionNotFoundError,
} from '../../../domain/errors/custom-field.errors';
import { CustomFieldDefinitionResponseDto } from '../../dtos/response/custom-field-response.dtos';

function makeExistingDefinition(): CustomFieldDefinition {
  const def = CustomFieldDefinition.create({
    entityType: 'donation',
    key: 'donor_name',
    label: 'Donor Name',
    fieldType: CustomFieldType.Text,
  });
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
    {
      entityType: 'donation',
      managePermissions: ['manage:donations'],
    },
  ],
};

describe('UpdateFieldDefinitionHandler', () => {
  let definition: CustomFieldDefinition;
  let definitionRepo: ReturnType<typeof makeDefinitionRepo>;
  let eventBus: ReturnType<typeof makeEventBus>;
  let handler: UpdateFieldDefinitionHandler;

  beforeEach(() => {
    definition = makeExistingDefinition();
    definitionRepo = makeDefinitionRepo(definition);
    eventBus = makeEventBus();
    handler = new UpdateFieldDefinitionHandler(
      definitionRepo as any,
      defaultOptions as any,
      eventBus as any,
    );
  });

  it('applies a partial patch, calls repo.update, and emits events', async () => {
    const cmd = new UpdateFieldDefinitionCommand(
      definition.id,
      'user|1',
      ['manage:donations'],
      'Updated Label', // label only
    );

    const result = await handler.execute(cmd);

    expect(result).toBeInstanceOf(CustomFieldDefinitionResponseDto);
    expect(result.label).toBe('Updated Label');
    expect(result.fieldType).toBe(CustomFieldType.Text); // unchanged
    expect(definitionRepo.update).toHaveBeenCalledTimes(1);
    expect(definitionRepo.update).toHaveBeenCalledWith(definition.id, expect.any(CustomFieldDefinition));
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws CustomFieldDefinitionNotFoundError when definition does not exist', async () => {
    definitionRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateFieldDefinitionCommand('missing-id', 'u', ['manage:donations'])),
    ).rejects.toThrow(CustomFieldDefinitionNotFoundError);

    expect(definitionRepo.update).not.toHaveBeenCalled();
    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('publishes domain events AFTER the repository update', async () => {
    const callOrder: string[] = [];
    definitionRepo.update.mockImplementation(() => {
      callOrder.push('update');
      return Promise.resolve(undefined);
    });
    eventBus.publishAll.mockImplementation(() => {
      callOrder.push('publishAll');
    });

    await handler.execute(
      new UpdateFieldDefinitionCommand(definition.id, 'user|1', ['manage:donations'], 'New Label'),
    );

    expect(callOrder).toEqual(['update', 'publishAll']);
  });

  it('updates fieldType when provided', async () => {
    const cmd = new UpdateFieldDefinitionCommand(
      definition.id,
      'user|1',
      ['manage:donations'],
      undefined,
      CustomFieldType.Number,
    );

    const result = await handler.execute(cmd);

    expect(result.fieldType).toBe(CustomFieldType.Number);
  });

  it('updates viewPermissions when provided', async () => {
    const cmd = new UpdateFieldDefinitionCommand(
      definition.id,
      'user|1',
      ['manage:donations'],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['admin:donations'],
    );

    const result = await handler.execute(cmd);

    expect(result.viewPermissions).toEqual(['admin:donations']);
  });

  it('clears viewPermissions when an empty array is provided', async () => {
    // First set some permissions on the definition
    definition.update({ viewPermissions: ['admin:donations'] });
    definition.clearEvents();

    const cmd = new UpdateFieldDefinitionCommand(
      definition.id,
      'user|1',
      ['manage:donations'],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    );

    const result = await handler.execute(cmd);

    expect(result.viewPermissions).toEqual([]);
  });

  it('does not touch viewPermissions when the field is omitted from the patch', async () => {
    // Definition starts with permissions set
    definition.update({ viewPermissions: ['admin:donations'] });
    definition.clearEvents();

    // Patch only the label — viewPermissions not provided
    const cmd = new UpdateFieldDefinitionCommand(
      definition.id,
      'user|1',
      ['manage:donations'],
      'New Label',
    );

    const result = await handler.execute(cmd);

    expect(result.viewPermissions).toEqual(['admin:donations']);
  });
});
