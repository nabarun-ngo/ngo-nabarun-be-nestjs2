/**
 * OnSubscriptionDeactivatedHandler unit tests.
 */
import { Logger } from '@nestjs/common';
import { OnSubscriptionDeactivatedHandler } from '@nabarun-ngo/nestjs-shared-correspondence/application/event-handlers/on-subscription-deactivated/on-subscription-deactivated.handler';
import { SubscriptionDeactivatedEvent, type SubscriptionDeactivatedSnapshot } from '@nabarun-ngo/nestjs-shared-correspondence/domain/events/subscription-deactivated.event';
import { ResourceSubscription } from '@nabarun-ngo/nestjs-shared-correspondence/domain/aggregates/resource-subscription.aggregate';
import { SubscribedVia } from '@nabarun-ngo/nestjs-shared-correspondence/domain/enums/subscribed-via.enum';

describe('OnSubscriptionDeactivatedHandler', () => {
  let handler: OnSubscriptionDeactivatedHandler;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    handler = new OnSubscriptionDeactivatedHandler();
  });

  afterEach(() => jest.restoreAllMocks());

  it('handles user subscription deactivated event without throwing', () => {
    const sub = ResourceSubscription.createUserSubscription({
      userId: 'u-1',
      userEmail: 'u1@test.com',
      resourceType: 'project',
      via: SubscribedVia.MANUAL,
    });
    sub.deactivate();
    const event = new SubscriptionDeactivatedEvent(sub.toSnapshot<SubscriptionDeactivatedSnapshot>());
    expect(() => handler.handle(event)).not.toThrow();
  });

  it('handles role subscription deactivated event without throwing', () => {
    const sub = ResourceSubscription.createRoleSubscription({
      roleName: 'MANAGER',
      resourceType: 'project',
      via: SubscribedVia.ROLE_DEFAULT,
    });
    sub.deactivate();
    const event = new SubscriptionDeactivatedEvent(sub.toSnapshot<SubscriptionDeactivatedSnapshot>());
    expect(() => handler.handle(event)).not.toThrow();
  });

  it('logs the subscription id', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log');
    const sub = ResourceSubscription.createUserSubscription({
      userId: 'u-1',
      userEmail: 'u1@test.com',
      resourceType: 'project',
      via: SubscribedVia.MANUAL,
    });
    sub.deactivate();
    const event = new SubscriptionDeactivatedEvent(sub.toSnapshot<SubscriptionDeactivatedSnapshot>());
    handler.handle(event);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(sub.id));
  });
});
