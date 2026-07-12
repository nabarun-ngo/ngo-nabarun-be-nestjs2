import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { UserProfileCompletenessPolicy } from '../../../domain/policies/user-profile-completeness.policy';
import { UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';
import { GetMyProfileQuery } from './get-my-profile.query';

@QueryHandler(GetMyProfileQuery)
@Injectable()
export class GetMyProfileHandler
  implements IQueryHandler<GetMyProfileQuery, UserResponseDto>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
  ) {}

  async execute(query: GetMyProfileQuery): Promise<UserResponseDto> {
    const user = await this.repo.findByIdPSub(query.idpSub);
    if (!user) throw new UserNotFoundError(query.idpSub);

    const dto = UserResponseMapper.toDto(user);
    // Include missing fields for the complete-profile form
    dto.missingFields = UserProfileCompletenessPolicy.missingFields(user);
    return dto;
  }
}
