import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { ListRoleGroupsQuery } from './list-role-groups.query';
import { IRoleGroupRepository } from '../../../domain/repositories/role-group.repository';
import { RoleGroupResponseMapper } from '../../mappers/role-group-response.mapper';
import { PagedResponse } from '@ce/nestjs-shared-core';
import { RoleGroupResponseDto } from '../../dtos/response/role-group-response.dto';

@QueryHandler(ListRoleGroupsQuery)
@Injectable()
export class ListRoleGroupsHandler
  implements IQueryHandler<ListRoleGroupsQuery, PagedResponse<RoleGroupResponseDto>>
{
  constructor(@Inject(IRoleGroupRepository) private readonly repo: IRoleGroupRepository) {}

  async execute(query: ListRoleGroupsQuery): Promise<PagedResponse<RoleGroupResponseDto>> {
    const activeFilter = {
      ...query.filter,
      props: { ...query.filter?.props, isActive: query.filter?.props?.isActive ?? true },
    };
    const paged = await this.repo.findPaged(activeFilter);
    return new PagedResponse(
      paged.content.map((g) => RoleGroupResponseMapper.toDto(g)),
      paged.totalSize,
      paged.pageIndex,
      paged.pageSize,
    );
  }
}
