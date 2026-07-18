import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';

@CommandHandler(UpdateUserProfileCommand)
@Injectable()
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand, UserResponseDto>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: cmd }: UpdateUserProfileCommand): Promise<UserResponseDto> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new UserNotFoundError(cmd.userId);

    user.updateProfile(cmd.detail);
    user.setUpdatedById(cmd.requestorId);
    await this.repo.update(user.id, user);

    const events = [...user.domainEvents];
    user.clearEvents();
    this.eventBus.publishAll(events);

    return UserResponseMapper.toDto(user);
  }
}
