import 'reflect-metadata';
import { DefineFieldDefinitionHandler } from './define-field-definition.handler';
import { DefineFieldDefinitionCommand } from './define-field-definition.command';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import {
  CustomFieldKeyAlreadyExistsError,
  MaxFieldsPerEntityTypeExceededError,
} from '../../../domain/errors/custom-field.errors';
import { EntityTypeForbiddenError, EntityAccessDeniedError } from '@ce/nestjs-shared-core';
import { CustomFieldDefinitionResponseDto } from '../../dtos/response/custom-field-response.dtos';

const makeDefinitionRepo = () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  findPaged: jest.fn(),
  create: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  findByKey: jest.fn().mockResolvedValue(null),
  findByEntityType: jest.fn().mockResolvedValue([]),
});

const makeEventBus = () => ({ publishAll: jest.fn() });

const defaultOptions = {
  entityTypes: [
    {
      entityType: 'donation',
      managePermissions: ['manage:donations'],
      readPermissions: ['read:donations'],
      writePermissions: ['write:donations'],
      maxFields: 20,
    },
  ],
};

function makeCommand(): DefineFieldDefinitionCommand {
  return new DefineFieldDefinitionCommand(
    'donation',
    'donor_name',
    'Donor Name',
    CustomFieldType.Text,
    false,
    [],
    false,
    false,
    0,
    'user|1',
    ['manage:donations'],
  );
}

describe('DefineFieldDefinitionHandler', () => {
  let definitionRepo: ReturnType<typeof makeDefinitionRepo>;
  let eventBus: ReturnType<typeof makeEventBus>;
  let handler: DefineFieldDefinitionHandler;

  beforeEach(() => {
    definitionRepo = makeDefinitionRepo();
    eventBus = makeEventBus();
    handler = new DefineFieldDefinitionHandler(
      definitionRepo as any,
      null, // no access port
      defaultOptions as any,
      eventBus as any,
    );
  });

  it('creates a definition, persists it and emits a domain event', async () => {
    const cmd = makeCommand();
    definitionRepo.count.mockResolvedValue(0);
    definitionRepo.findByKey.mockResolvedValue(null);

    const result = await handler.execute(cmd);

    expect(definitionRepo.create).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(CustomFieldDefinitionResponseDto);
    expect(result.key).toBe('donor_name');
    expect(result.label).toBe('Donor Name');
  });

  it('throws CustomFieldKeyAlreadyExistsError when key is a duplicate', async () => {
    definitionRepo.findByKey.mockResolvedValue({ id: 'existing', active: true });

    await expect(handler.execute(makeCommand())).rejects.toThrow(CustomFieldKeyAlreadyExistsError);
    expect(definitionRepo.create).not.toHaveBeenCalled();
    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('throws MaxFieldsPerEntityTypeExceededError when field cap is reached', async () => {
    definitionRepo.count.mockResolvedValue(20); // at cap
    definitionRepo.findByKey.mockResolvedValue(null);

    await expect(handler.execute(makeCommand())).rejects.toThrow(MaxFieldsPerEntityTypeExceededError);
    expect(definitionRepo.create).not.toHaveBeenCalled();
  });

  it('throws EntityTypeForbiddenError when entityType is not registered', async () => {
    const handlerWithoutConfig = new DefineFieldDefinitionHandler(
      definitionRepo as any,
      null,
      { entityTypes: [{ entityType: 'task' }] } as any,
      eventBus as any,
    );

    await expect(
      handlerWithoutConfig.execute(makeCommand()),
    ).rejects.toThrow(EntityTypeForbiddenError);
  });

  it('publishes domain events AFTER the repository create call', async () => {
    const callOrder: string[] = [];
    definitionRepo.create.mockImplementation(() => {
      callOrder.push('create');
      return Promise.resolve(undefined);
    });
    eventBus.publishAll.mockImplementation(() => {
      callOrder.push('publishAll');
    });

    await handler.execute(makeCommand());

    expect(callOrder).toEqual(['create', 'publishAll']);
  });

  it('throws EntityAccessDeniedError when access port denies access', async () => {
    const mockAccessPort = { canAccess: jest.fn().mockResolvedValue(false) };
    const handlerWithPort = new DefineFieldDefinitionHandler(
      definitionRepo as any,
      mockAccessPort as any,
      defaultOptions as any,
      eventBus as any,
    );

    await expect(handlerWithPort.execute(makeCommand())).rejects.toThrow(EntityAccessDeniedError);
    expect(definitionRepo.create).not.toHaveBeenCalled();
  });

  it('proceeds when access port grants access', async () => {
    const mockAccessPort = { canAccess: jest.fn().mockResolvedValue(true) };
    const handlerWithPort = new DefineFieldDefinitionHandler(
      definitionRepo as any,
      mockAccessPort as any,
      defaultOptions as any,
      eventBus as any,
    );

    const result = await handlerWithPort.execute(makeCommand());

    expect(result).toBeDefined();
    expect(definitionRepo.create).toHaveBeenCalledTimes(1);
  });

  it('stores viewPermissions on the created definition', async () => {
    const cmd = new DefineFieldDefinitionCommand(
      'donation',
      'sensitive_field',
      'Sensitive Field',
      CustomFieldType.Text,
      false,
      [],
      false,
      false,
      0,
      'user|1',
      ['manage:donations'],
      null,
      null,
      ['admin:donations', 'superuser'],
    );

    const result = await handler.execute(cmd);

    expect(result.viewPermissions).toEqual(['admin:donations', 'superuser']);
  });

  it('defaults viewPermissions to empty array when not supplied', async () => {
    const result = await handler.execute(makeCommand());

    expect(result.viewPermissions).toEqual([]);
  });
});
