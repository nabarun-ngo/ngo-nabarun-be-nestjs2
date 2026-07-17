import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserListResponseDto, UserResponseDto } from '../../dtos/user-response.dto';
import { UserResponseMapper } from '../../mappers/user-response.mapper';
import { ListUsersQuery } from './list-users.query';

@QueryHandler(ListUsersQuery)
@Injectable()
export class ListUsersHandler
  implements IQueryHandler<ListUsersQuery, UserListResponseDto>
{
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<UserListResponseDto> {
    const filter = new BaseFilter(
      query.filter,
      query.pageIndex ?? 0,
      query.pageSize ?? 20,
      query.sortBy,
      query.sortDir,
    );
    const page = await this.repo.findPaged(filter);
    const dto = new UserListResponseDto();
    dto.items = page.content.map((u): UserResponseDto => UserResponseMapper.toDto(u));
    dto.total = page.totalSize;
    dto.pageIndex = page.pageIndex;
    dto.pageSize = page.pageSize;
    return dto;
  }
}
