import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { UniqueEmailPolicy } from '../../../domain/policies/unique-email.policy';
import { UserProfileCompletenessPolicy } from '../../../domain/policies/user-profile-completeness.policy';
import { CreateUserCommand } from './create-user.command';
import { UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';

@CommandHandler(CreateUserCommand)
@Injectable()
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserResponseDto> {
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: cmd }: CreateUserCommand): Promise<UserResponseDto> {
    // 1. Email collision check (includes soft-deleted rows)
    const existing = await this.repo.findByEmail(cmd.email);
    UniqueEmailPolicy.assertNoDuplicate(cmd.email, existing ?? null);

    const isReuse = !!(existing?.status === UserStatus.DELETED || existing?.deletedAt);

    // 2. Create or reuse aggregate
    let user = User.create(
      {
        email: cmd.email,
        firstName: cmd.firstName,
        lastName: cmd.lastName,
        title: cmd.title,
        middleName: cmd.middleName,
        dateOfBirth: cmd.dateOfBirth,
        gender: cmd.gender,
        about: cmd.about,
        picture: cmd.picture,
        isPublic: cmd.isPublic,
      },
      isReuse ? existing! : undefined,
    );

    if (isReuse) {
      user.restoreFromDeletion();
    }

    // 3. Signal whether the IdP adapter must generate the password
    if (!cmd.adminPassword) {
      user.markSystemPasswordRequired();
    }

    // 4. Profile completeness
    user.applyCompleteness(UserProfileCompletenessPolicy.evaluate(user));

    // 5. Provision identity — adapter owns password generation
    const { externalSub } = await this.identityProvider.createUser(user, {
      resetPassword: user.systemGeneratedPassword,
      adminPassword: cmd.adminPassword,
    });

    // 6. Link identity + set audit + save
    user.linkIdentity(externalSub);
    user.setCreatedById(cmd.createdById);
    user.setUpdatedById(cmd.createdById);

    if (isReuse) {
      await this.repo.update(user.id, user);
    } else {
      await this.repo.create(user);
    }

    // 7. Publish domain events
    const events = [...user.domainEvents];
    user.clearEvents();
    this.eventBus.publishAll(events);

    return UserResponseMapper.toDto(user);
  }
}
