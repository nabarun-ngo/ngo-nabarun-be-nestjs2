import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PublicSiteContentAdapter } from '../../../infrastructure/adapters/public-site-content.adapter';
import { GetStaticContentQuery } from './get-static-content.query';

@QueryHandler(GetStaticContentQuery)
export class GetStaticContentHandler
  implements IQueryHandler<GetStaticContentQuery, Record<string, unknown>>
{
  constructor(private readonly content: PublicSiteContentAdapter) {}

  execute(): Promise<Record<string, unknown>> {
    return this.content.getStaticContent();
  }
}
