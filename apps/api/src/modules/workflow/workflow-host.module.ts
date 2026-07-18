import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ValidateInputsHandler } from './handlers/validate-inputs.handler';
import { UserNotRegisteredTaskHandler } from './handlers/user-not-registered.handler';
import { StartWorkflowCronHandler } from './handlers/start-workflow-cron.handler';
import { OnUserDeletedWorkflowHandler } from './handlers/on-user-deleted-workflow.handler';

import { Auth0UserCreationHandler } from './handlers/auth0-user-creation.handler';
import {
  DonationWorkflowHandlers,
} from './handlers/donation-workflow.handlers';
import { UserDeleteAndDataCleanupHandler } from './handlers/user-delete-cleanup.handler';

const HANDLERS = [
  ValidateInputsHandler,
  UserNotRegisteredTaskHandler,
  Auth0UserCreationHandler,
  UserDeleteAndDataCleanupHandler,
  ...DonationWorkflowHandlers,
  StartWorkflowCronHandler,
  OnUserDeletedWorkflowHandler,
];

@Module({})
export class WorkflowHostModule {
  static forRoot(options: { imports?: ModuleMetadata['imports'] } = {}): DynamicModule {
    return {
      module: WorkflowHostModule,
      imports: [CqrsModule, ...(options.imports ?? [])],
      providers: [...HANDLERS],
    };
  }
}
