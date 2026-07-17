import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ILinksContentPort } from '../../../domain/ports/links-content.port';
import { LinkGroupDto } from '../../dtos/links.dto';
import { groupLinksByCategory } from '../../links.util';
import { GetUserGuidesQuery } from './get-user-guides.query';

@QueryHandler(GetUserGuidesQuery)
@Injectable()
export class GetUserGuidesHandler implements IQueryHandler<GetUserGuidesQuery, LinkGroupDto[]> {
  constructor(@Inject(ILinksContentPort) private readonly port: ILinksContentPort) {}

  async execute(): Promise<LinkGroupDto[]> {
    const links = await this.port.getUserGuides();
    return groupLinksByCategory(links);
  }
}
