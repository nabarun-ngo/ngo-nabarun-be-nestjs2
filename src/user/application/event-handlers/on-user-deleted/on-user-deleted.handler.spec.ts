import { EventBus } from '@nestjs/cqrs';
import { IUserAccessPort } from 'nestjs-shared/auth';
import { CorrespondenceRequestEvent } from 'nestjs-shared/correspondence';
import { OnUserDeletedHandler } from './on-user-deleted.handler';
import { UserDeletedEvent } from '../../../domain/events/user-deleted.event';

describe('OnUserDeletedHandler', () => {
  let userAccess: jest.Mocked<Pick<IUserAccessPort, 'invalidate'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
  let handler: OnUserDeletedHandler;

  beforeEach(() => {
    userAccess = { invalidate: jest.fn().mockResolvedValue(undefined) };
    eventBus = { publish: jest.fn() };
    handler = new OnUserDeletedHandler(
      userAccess as unknown as IUserAccessPort,
      eventBus as unknown as EventBus,
    );
  });

  it('invalidates Auth2 cache when idpSub is present', async () => {
    const event = new UserDeletedEvent('user-1', 'john@example.com', 'auth0|abc');
    await handler.handle(event);
    expect(userAccess.invalidate).toHaveBeenCalledWith('auth0|abc');
  });

  it('skips cache invalidation when idpSub is absent', async () => {
    const event = new UserDeletedEvent('user-1', 'john@example.com', undefined);
    await handler.handle(event);
    expect(userAccess.invalidate).not.toHaveBeenCalled();
  });

  it('publishes a deactivation email via Correspondence2', async () => {
    const event = new UserDeletedEvent('user-1', 'john@example.com', 'auth0|abc');
    await handler.handle(event);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const [publishedEvent] = eventBus.publish.mock.calls[0];
    expect(publishedEvent).toBeInstanceOf(CorrespondenceRequestEvent);
  });

  it('deactivation email uses the correct template key and email', async () => {
    const event = new UserDeletedEvent('user-1', 'john@example.com', 'auth0|abc');
    await handler.handle(event);

    const publishedEvent = eventBus.publish.mock.calls[0][0] as unknown as CorrespondenceRequestEvent;
    expect(publishedEvent.channels?.email?.templateKey).toBe('USER_DEACTIVATED');
    expect(publishedEvent.channels?.email?.overrideEmails).toContain('john@example.com');
  });

  it('sends the email even when idpSub is absent', async () => {
    const event = new UserDeletedEvent('user-1', 'john@example.com', undefined);
    await handler.handle(event);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });
});
