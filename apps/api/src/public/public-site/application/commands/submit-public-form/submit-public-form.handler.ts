import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { resolvePublicFormWorkflowAlias } from '../../services/public-form-alias.registry';
import { PublicFormValidatorService } from '../../services/public-form-validator.service';
import { StartPublicWorkflowService } from '../../services/start-public-workflow.service';
import { SubmitPublicFormCommand } from './submit-public-form.command';

export interface SubmitPublicFormResult {
  message: string;
  referenceId?: string;
}

@CommandHandler(SubmitPublicFormCommand)
export class SubmitPublicFormHandler
  implements ICommandHandler<SubmitPublicFormCommand, SubmitPublicFormResult>
{
  constructor(
    private readonly validator: PublicFormValidatorService,
    private readonly workflowStarter: StartPublicWorkflowService,
  ) {}

  async execute(command: SubmitPublicFormCommand): Promise<SubmitPublicFormResult> {
    const alias = resolvePublicFormWorkflowAlias(command.publicFormId);

    if (alias) {
      const { values } = await this.validator.validateForWorkflow({
        publicFormId: command.publicFormId,
        values: command.values,
      });

      const instanceId = await this.workflowStarter.startFromPublicSubmission({
        publicFormId: command.publicFormId,
        alias,
        values,
      });

      return {
        message: 'Request submitted successfully',
        referenceId: instanceId,
      };
    }

    const entityId = await this.validator.validateAndPersistGenericForm({
      publicFormId: command.publicFormId,
      values: command.values,
    });

    return {
      message: 'Form submitted successfully',
      referenceId: entityId,
    };
  }
}
