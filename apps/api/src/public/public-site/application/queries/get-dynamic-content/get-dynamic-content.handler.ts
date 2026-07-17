import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PublicSiteContentAdapter } from '../../../infrastructure/adapters/public-site-content.adapter';
import { GetDynamicContentQuery } from './get-dynamic-content.query';

@QueryHandler(GetDynamicContentQuery)
export class GetDynamicContentHandler
  implements IQueryHandler<GetDynamicContentQuery, Record<string, unknown>>
{
  constructor(private readonly content: PublicSiteContentAdapter) {}

  execute(): Promise<Record<string, unknown>> {
    return this.content.getDynamicContent();
  }
}
