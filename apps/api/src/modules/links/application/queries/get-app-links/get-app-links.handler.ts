import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ILinksContentPort } from '../../../domain/ports/links-content.port';
import { LinkItemDto } from '../../dtos/links.dto';
import { toLinkItemDto } from '../../links.util';
import { GetAppLinksQuery } from './get-app-links.query';

@QueryHandler(GetAppLinksQuery)
@Injectable()
export class GetAppLinksHandler implements IQueryHandler<GetAppLinksQuery, LinkItemDto[]> {
  constructor(@Inject(ILinksContentPort) private readonly port: ILinksContentPort) {}

  async execute(query: GetAppLinksQuery): Promise<LinkItemDto[]> {
    const links = await this.port.getAppLinks();
    const filtered = query.platform ? links.filter((link) => link.platform === query.platform) : links;
    return filtered.map(toLinkItemDto);
  }
}
