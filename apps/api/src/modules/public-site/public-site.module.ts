import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetStaticContentHandler } from './application/queries/get-static-content/get-static-content.handler';
import { GetDynamicContentHandler } from './application/queries/get-dynamic-content/get-dynamic-content.handler';
import { GetFormDefinitionHandler } from './application/queries/get-form-definition/get-form-definition.handler';
import { SubmitPublicFormHandler } from './application/commands/submit-public-form/submit-public-form.handler';
import { SubscribeNewsletterHandler } from './application/commands/subscribe-newsletter/subscribe-newsletter.handler';
import { PublicFormValidatorService } from './application/services/public-form-validator.service';
import { StartPublicWorkflowService } from './application/services/start-public-workflow.service';
import { PublicSiteContentAdapter } from './infrastructure/adapters/public-site-content.adapter';
import { NewsletterSubscriptionRepository } from './infrastructure/repositories/newsletter-subscription.repository';
import { PublicSiteContentsController } from './presentation/controllers/public-site-contents.controller';
import { PublicSiteFormsController } from './presentation/controllers/public-site-forms.controller';
import { NewsletterController } from './presentation/controllers/newsletter.controller';

const QUERY_HANDLERS = [
  GetStaticContentHandler,
  GetDynamicContentHandler,
  GetFormDefinitionHandler,
];

const COMMAND_HANDLERS = [SubmitPublicFormHandler, SubscribeNewsletterHandler];

@Module({})
export class PublicSiteModule {
  static forRoot(options: { imports?: ModuleMetadata['imports'] } = {}): DynamicModule {
    return {
      module: PublicSiteModule,
      imports: [CqrsModule, ...(options.imports ?? [])],
      controllers: [
        PublicSiteContentsController,
        PublicSiteFormsController,
        NewsletterController,
      ],
      providers: [
        PublicSiteContentAdapter,
        PublicFormValidatorService,
        StartPublicWorkflowService,
        NewsletterSubscriptionRepository,
        ...QUERY_HANDLERS,
        ...COMMAND_HANDLERS,
      ],
    };
  }
}
