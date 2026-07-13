import 'reflect-metadata';
import { DeleteEntityFieldValuesHandler } from './delete-entity-field-values.handler';
import { DeleteEntityFieldValuesCommand } from './delete-entity-field-values.command';
import { EntityAccessDeniedError } from '@ce/nestjs-shared-core';
import { EntityFieldValuesDeletedEvent } from '../../../domain/events/entity-field-values-deleted.event';

const makeValueRepo = () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  findPaged: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  upsertMany: jest.fn(),
  findByEntity: jest.fn(),
  deleteByEntity: jest.fn().mockResolvedValue(undefined),
  findHistoryByEntity: jest.fn(),
});

const makeEventBus = () => ({ publish: jest.fn(), publishAll: jest.fn() });

const defaultOptions = {
  entityTypes: [
    { entityType: 'donation', writePermissions: ['write:donations'] },
  ],
};

describe('DeleteEntityFieldValuesHandler', () => {
  it('deletes entity field values and publishes EntityFieldValuesDeletedEvent', async () => {
    const valueRepo = makeValueRepo();
    const eventBus = makeEventBus();
    const handler = new DeleteEntityFieldValuesHandler(
      valueRepo as any,
      null,
      defaultOptions as any,
      eventBus as any,
    );

    await handler.execute(
      new DeleteEntityFieldValuesCommand('donation', 'entity-1', 'user|1', ['write:donations']),
    );

    expect(valueRepo.deleteByEntity).toHaveBeenCalledWith('donation', 'entity-1');
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(event).toBeInstanceOf(EntityFieldValuesDeletedEvent);
    expect(event.entityType).toBe('donation');
    expect(event.entityId).toBe('entity-1');
    expect(event.deletedByUserId).toBe('user|1');
  });

  it('publishes event AFTER deleteByEntity', async () => {
    const callOrder: string[] = [];
    const valueRepo = makeValueRepo();
    (valueRepo.deleteByEntity as jest.Mock).mockImplementation(() => {
      callOrder.push('deleteByEntity');
      return Promise.resolve();
    });
    const eventBus = makeEventBus();
    (eventBus.publish as jest.Mock).mockImplementation(() => {
      callOrder.push('publish');
    });
    const handler = new DeleteEntityFieldValuesHandler(
      valueRepo as any,
      null,
      defaultOptions as any,
      eventBus as any,
    );

    await handler.execute(
      new DeleteEntityFieldValuesCommand('donation', 'entity-1', 'user|1', ['write:donations']),
    );

    expect(callOrder).toEqual(['deleteByEntity', 'publish']);
  });

  it('throws EntityAccessDeniedError when access port denies write', async () => {
    const valueRepo = makeValueRepo();
    const eventBus = makeEventBus();
    const mockAccessPort = { canAccess: jest.fn().mockResolvedValue(false) };
    const handler = new DeleteEntityFieldValuesHandler(
      valueRepo as any,
      mockAccessPort as any,
      defaultOptions as any,
      eventBus as any,
    );

    await expect(
      handler.execute(
        new DeleteEntityFieldValuesCommand('donation', 'entity-1', 'user|1', ['write:donations']),
      ),
    ).rejects.toThrow(EntityAccessDeniedError);

    expect(valueRepo.deleteByEntity).not.toHaveBeenCalled();
  });
});
