import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ILinksContentPort } from './domain/ports/links-content.port';
import { LinksContentAdapter } from './infrastructure/adapters/links-content.adapter';
import { GetUserGuidesHandler } from './application/queries/get-user-guides/get-user-guides.handler';
import { GetPoliciesHandler } from './application/queries/get-policies/get-policies.handler';
import { GetAppLinksHandler } from './application/queries/get-app-links/get-app-links.handler';
import { LinksController } from './presentation/controllers/links.controller';

const QUERY_HANDLERS = [GetUserGuidesHandler, GetPoliciesHandler, GetAppLinksHandler];

@Module({})
export class LinksModule {
  static forRoot(): DynamicModule {
    return {
      module: LinksModule,
      imports: [CqrsModule],
      controllers: [LinksController],
      providers: [{ provide: ILinksContentPort, useClass: LinksContentAdapter }, ...QUERY_HANDLERS],
    };
  }
}
