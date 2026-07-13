import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
@Injectable()
export class GetUserByIdHandler
  implements IQueryHandler<GetUserByIdQuery, UserResponseDto>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserResponseDto> {
    const user = await this.repo.findById(query.userId);
    if (!user) throw new UserNotFoundError(query.userId);
    return UserResponseMapper.toDto(user);
  }
}
