import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ILinksContentPort } from '../../../domain/ports/links-content.port';
import { LinkGroupDto } from '../../dtos/links.dto';
import { groupLinksByCategory } from '../../links.util';
import { GetPoliciesQuery } from './get-policies.query';

@QueryHandler(GetPoliciesQuery)
@Injectable()
export class GetPoliciesHandler implements IQueryHandler<GetPoliciesQuery, LinkGroupDto[]> {
  constructor(@Inject(ILinksContentPort) private readonly port: ILinksContentPort) {}

  async execute(): Promise<LinkGroupDto[]> {
    const links = await this.port.getPolicies();
    return groupLinksByCategory(links);
  }
}
