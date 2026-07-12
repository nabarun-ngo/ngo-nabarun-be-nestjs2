import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import {
  IIdentityProvider,
  GrantConnectionResult,
} from '../../../domain/ports/identity-provider.port';
import { UserNotFoundError, IdentityNotLinkedError } from '../../../domain/errors/user.errors';
import { GrantUserConnectionCommand } from './grant-user-connection.command';

@CommandHandler(GrantUserConnectionCommand)
@Injectable()
export class GrantUserConnectionHandler
  implements ICommandHandler<GrantUserConnectionCommand, GrantConnectionResult>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute({ params: cmd }: GrantUserConnectionCommand): Promise<GrantConnectionResult> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new UserNotFoundError(cmd.userId);
    if (!user.idpSub) throw new IdentityNotLinkedError(user.id);

    return this.identityProvider.grantConnection(user.idpSub, cmd.connectionKey, user);
  }
}
