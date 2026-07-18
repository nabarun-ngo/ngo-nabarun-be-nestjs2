import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { UpdateUserAdminCommand } from './update-user-admin.command';
import { UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';

@CommandHandler(UpdateUserAdminCommand)
@Injectable()
export class UpdateUserAdminHandler
  implements ICommandHandler<UpdateUserAdminCommand, UserResponseDto>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: cmd }: UpdateUserAdminCommand): Promise<UserResponseDto> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new UserNotFoundError(cmd.userId);

    user.updateAdmin(cmd.detail);
    user.setUpdatedById(cmd.adminId);
    await this.repo.update(user.id, user);

    const events = [...user.domainEvents];
    user.clearEvents();
    this.eventBus.publishAll(events);

    return UserResponseMapper.toDto(user);
  }
}
