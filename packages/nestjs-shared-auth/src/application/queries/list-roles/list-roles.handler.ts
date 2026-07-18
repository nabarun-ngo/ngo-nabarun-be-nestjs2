import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { ListRolesQuery } from './list-roles.query';
import { IRoleRepository } from '../../../domain/repositories/role.repository';
import { RoleResponseMapper } from '../../mappers/role-response.mapper';
import { PagedResponse } from '@nabarun-ngo/nestjs-shared-core';
import { RoleResponseDto } from '../../dtos/response/auth-response.dtos';

@QueryHandler(ListRolesQuery)
@Injectable()
export class ListRolesHandler implements IQueryHandler<ListRolesQuery, PagedResponse<RoleResponseDto>> {
  constructor(@Inject(IRoleRepository) private readonly repo: IRoleRepository) { }

  async execute(query: ListRolesQuery): Promise<PagedResponse<RoleResponseDto>> {
    const activeFilter = {
      ...query.filter,
      props: { ...query.filter?.props, isActive: query.filter?.props?.isActive ?? true },
    };
    const paged = await this.repo.findPaged(activeFilter);
    return new PagedResponse(paged.content.map((r) => RoleResponseMapper.toDto(r)), paged.totalSize, paged.pageIndex, paged.pageSize);
  }
}
