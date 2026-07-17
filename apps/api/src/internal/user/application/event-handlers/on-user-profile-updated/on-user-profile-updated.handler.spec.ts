import { IUserAccessPort } from '@ce/nestjs-shared-auth';
import { OnUserProfileUpdatedHandler } from './on-user-profile-updated.handler';
import { UserProfileUpdatedEvent } from '../../../domain/events/user-profile-updated.event';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';

describe('OnUserProfileUpdatedHandler', () => {
  let identityProvider: jest.Mocked<Pick<IIdentityProvider, 'updateUser'>>;
  let userAccess: jest.Mocked<Pick<IUserAccessPort, 'invalidate'>>;
  let handler: OnUserProfileUpdatedHandler;

  beforeEach(() => {
    identityProvider = { updateUser: jest.fn().mockResolvedValue(undefined) };
    userAccess = { invalidate: jest.fn().mockResolvedValue(undefined) };
    handler = new OnUserProfileUpdatedHandler(
      identityProvider as unknown as IIdentityProvider,
      userAccess as unknown as IUserAccessPort,
    );
  });

  it('syncs name and picture to identity provider', async () => {
    const event = new UserProfileUpdatedEvent('user-1', 'auth0|abc', true, 'Jane', 'Doe', 'https://pic.jpg');
    await handler.handle(event);

    expect(identityProvider.updateUser).toHaveBeenCalledWith('auth0|abc', {
      firstName: 'Jane',
      lastName: 'Doe',
      picture: 'https://pic.jpg',
    });
  });

  it('invalidates the Auth2 cache after IdP sync', async () => {
    const event = new UserProfileUpdatedEvent('user-1', 'auth0|abc', true, 'Jane', 'Doe', undefined);
    await handler.handle(event);

    expect(userAccess.invalidate).toHaveBeenCalledWith('auth0|abc');
  });

  it('skips both IdP sync and cache invalidation when idpSub is undefined', async () => {
    const event = new UserProfileUpdatedEvent('user-1', undefined, false, 'Jane', 'Doe', undefined);
    await handler.handle(event);

    expect(identityProvider.updateUser).not.toHaveBeenCalled();
    expect(userAccess.invalidate).not.toHaveBeenCalled();
  });

  it('still invalidates cache even when IdP sync throws', async () => {
    identityProvider.updateUser.mockRejectedValue(new Error('Auth0 unavailable'));
    const event = new UserProfileUpdatedEvent('user-1', 'auth0|abc', true, 'Jane', 'Doe', undefined);
    await handler.handle(event);

    expect(userAccess.invalidate).toHaveBeenCalledWith('auth0|abc');
  });
});
