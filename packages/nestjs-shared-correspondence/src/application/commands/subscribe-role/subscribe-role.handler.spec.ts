/**
 * SubscribeRoleHandler unit tests.
 */
import { SubscribeRoleHandler } from '@ce/nestjs-shared-correspondence/application/commands/subscribe-role/subscribe-role.handler';
import { SubscribeRoleCommand } from '@ce/nestjs-shared-correspondence/application/commands/subscribe-role/subscribe-role.command';
import { IResourceSubscriptionRepository } from '@ce/nestjs-shared-correspondence/domain/repositories/resource-subscription.repository';
import { ResourceSubscription } from '@ce/nestjs-shared-correspondence/domain/aggregates/resource-subscription.aggregate';
import { SubscribedVia } from '@ce/nestjs-shared-correspondence/domain/enums/subscribed-via.enum';
import { SubscriberType } from '@ce/nestjs-shared-correspondence/domain/enums/subscriber-type.enum';

function makeActiveRoleSub() {
  return ResourceSubscription.createRoleSubscription({
    roleName: 'MANAGER',
    resourceType: 'project',
    via: SubscribedVia.ROLE_DEFAULT,
  });
}

function buildHandler(findByRoleResult: any = null) {
  const repo: jest.Mocked<IResourceSubscriptionRepository> = {
    findByRoleAndResource: jest.fn().mockResolvedValue(findByRoleResult),
    create: jest.fn().mockResolvedValue(undefined),
    findByUserAndResource: jest.fn(),
    findActiveSubscribersForResource: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findPaged: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    updateEmailForUser: jest.fn(),
    deleteInactiveBefore: jest.fn(),
  } as any;

  const eventBus = { publishAll: jest.fn() };
  const handler = new SubscribeRoleHandler(repo, eventBus as any);
  return { handler, repo };
}

describe('SubscribeRoleHandler', () => {
  it('creates a new role subscription when none exists', async () => {
    const { handler, repo } = buildHandler(null);
    const cmd = new SubscribeRoleCommand(
      'MANAGER',
      'project',
      SubscribedVia.ROLE_DEFAULT,
    );
    await handler.execute(cmd);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('creates subscription with subscriberType ROLE', async () => {
    const { handler, repo } = buildHandler(null);
    const cmd = new SubscribeRoleCommand(
      'MANAGER',
      'project',
      SubscribedVia.ROLE_DEFAULT,
    );
    await handler.execute(cmd);
    const [sub] = (repo.create as jest.Mock).mock.calls[0];
    expect(sub.subscriberType).toBe(SubscriberType.ROLE);
  });

  it('sets roleName on the created subscription', async () => {
    const { handler, repo } = buildHandler(null);
    const cmd = new SubscribeRoleCommand('MANAGER', 'project', SubscribedVia.ROLE_DEFAULT);
    await handler.execute(cmd);
    const [sub] = (repo.create as jest.Mock).mock.calls[0];
    expect(sub.roleName).toBe('MANAGER');
  });

  it('is idempotent — skips create when role subscription already exists', async () => {
    const existing = makeActiveRoleSub();
    const { handler, repo } = buildHandler(existing);
    const cmd = new SubscribeRoleCommand('MANAGER', 'project', SubscribedVia.ROLE_DEFAULT);
    await handler.execute(cmd);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('checks by roleName and resourceType', async () => {
    const { handler, repo } = buildHandler(null);
    const cmd = new SubscribeRoleCommand(
      'MANAGER',
      'project',
      SubscribedVia.ROLE_DEFAULT,
      'proj-1',
    );
    await handler.execute(cmd);
    expect(repo.findByRoleAndResource).toHaveBeenCalledWith('MANAGER', 'project', 'proj-1');
  });
});
