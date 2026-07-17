import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import {
  IIdentityProvider,
  LinkedConnection,
} from '../../../domain/ports/identity-provider.port';
import { UserNotFoundError, IdentityNotLinkedError } from '../../../domain/errors/user.errors';
import { GetUserConnectionsQuery } from './get-user-connections.query';

@QueryHandler(GetUserConnectionsQuery)
@Injectable()
export class GetUserConnectionsHandler
  implements IQueryHandler<GetUserConnectionsQuery, LinkedConnection[]>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(query: GetUserConnectionsQuery): Promise<LinkedConnection[]> {
    const user = await this.repo.findById(query.userId);
    if (!user) throw new UserNotFoundError(query.userId);
    if (!user.idpSub) throw new IdentityNotLinkedError(user.id);

    return this.identityProvider.listConnections(user.idpSub);
  }
}
