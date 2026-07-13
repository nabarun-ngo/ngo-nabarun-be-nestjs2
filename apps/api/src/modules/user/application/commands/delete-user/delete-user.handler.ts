import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { IdentityProviderError, UserNotFoundError } from '../../../domain/errors/user.errors';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
@Injectable()
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, void> {
  private readonly logger = new Logger(DeleteUserHandler.name);
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: cmd }: DeleteUserCommand): Promise<void> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new UserNotFoundError(cmd.userId);

    const sub = user.idpSub;

    // Soft-delete aggregate (raises UserDeletedEvent + UserStatusChangedEvent)
    user.softDelete();
    user.setUpdatedById(cmd.adminId);

    // Delete from identity provider (best-effort — profile is already soft-deleted)
    if (sub) {
        await this.identityProvider.deleteUser(sub);
    }
    await this.repo.update(user.id, user);

    const events = [...user.domainEvents];
    user.clearEvents();
    this.eventBus.publishAll(events);
  }
}
