import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { UserNotFoundError, IdentityNotLinkedError } from '../../../domain/errors/user.errors';
import { InitiatePasswordChangeCommand } from './initiate-password-change.command';

@CommandHandler(InitiatePasswordChangeCommand)
@Injectable()
export class InitiatePasswordChangeHandler
  implements ICommandHandler<InitiatePasswordChangeCommand, void>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute({ params: cmd }: InitiatePasswordChangeCommand): Promise<void> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new UserNotFoundError(cmd.userId);
    if (!user.idpSub) throw new IdentityNotLinkedError(user.id);

    await this.identityProvider.sendPasswordReset(user.idpSub);
  }
}
