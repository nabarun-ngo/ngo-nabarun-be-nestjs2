import { IUserAccessPort } from '@ce/nestjs-shared-auth';
import { OnUserStatusChangedHandler } from './on-user-status-changed.handler';
import { UserStatusChangedEvent } from '../../../domain/events/user-status-changed.event';
import { UserStatus } from '../../../domain/enums/user-status.enum';

describe('OnUserStatusChangedHandler', () => {
  let userAccess: jest.Mocked<Pick<IUserAccessPort, 'invalidate'>>;
  let handler: OnUserStatusChangedHandler;

  beforeEach(() => {
    userAccess = { invalidate: jest.fn().mockResolvedValue(undefined) };
    handler = new OnUserStatusChangedHandler(userAccess as unknown as IUserAccessPort);
  });

  it('invalidates Auth2 cache when idpSub is present', async () => {
    const event = new UserStatusChangedEvent('user-1', 'auth0|abc', UserStatus.ACTIVE, UserStatus.BLOCKED);
    await handler.handle(event);
    expect(userAccess.invalidate).toHaveBeenCalledWith('auth0|abc');
  });

  it('skips cache invalidation when idpSub is absent', async () => {
    const event = new UserStatusChangedEvent('user-1', undefined, UserStatus.DRAFT, UserStatus.ACTIVE);
    await handler.handle(event);
    expect(userAccess.invalidate).not.toHaveBeenCalled();
  });

  it('handles ACTIVE → BLOCKED transition', async () => {
    const event = new UserStatusChangedEvent('user-1', 'auth0|abc', UserStatus.ACTIVE, UserStatus.BLOCKED);
    await handler.handle(event);
    expect(userAccess.invalidate).toHaveBeenCalledTimes(1);
  });

  it('handles BLOCKED → ACTIVE transition', async () => {
    const event = new UserStatusChangedEvent('user-1', 'auth0|abc', UserStatus.BLOCKED, UserStatus.ACTIVE);
    await handler.handle(event);
    expect(userAccess.invalidate).toHaveBeenCalledTimes(1);
  });

  it('handles DELETED transition (also fires on softDelete)', async () => {
    const event = new UserStatusChangedEvent('user-1', 'auth0|abc', UserStatus.ACTIVE, UserStatus.DELETED);
    await handler.handle(event);
    expect(userAccess.invalidate).toHaveBeenCalledWith('auth0|abc');
  });
});
