import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { FormNotFoundError } from '../../../domain/errors/form.errors';
import { FormSubmissionClearedEvent } from '../../../domain/events/form-submission-cleared.event';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { FormPolicy } from '../../../domain/policies/form.policy';
import { FormEntityTypePolicy } from '../../../domain/policies/form-entity-type.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormSubmissionRepository } from '../../../domain/repositories/form-submission.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { CUSTOM_FORMS_OPTIONS } from '../../../infrastructure/custom-forms-options.token';
import { CustomFormsModuleOptions } from '../../../custom-forms.schema';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import { ClearFormSubmissionCommand } from './clear-form-submission.command';

@CommandHandler(ClearFormSubmissionCommand)
@Injectable()
export class ClearFormSubmissionHandler
  implements ICommandHandler<ClearFormSubmissionCommand, void>
{
  constructor(
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
    @Inject(IFormSubmissionRepository)
    private readonly submissionRepo: IFormSubmissionRepository,
    @Optional()
    @Inject(IFormEntityAccessPort)
    private readonly accessPort: IFormEntityAccessPort | null,
    @Inject(CUSTOM_FORMS_OPTIONS)
    private readonly options: CustomFormsModuleOptions,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ClearFormSubmissionCommand): Promise<void> {
    FormEntityTypePolicy.assertEntityTypeRegistered(cmd.entityType, this.options.entityTypes);

    const form = await this.formRepo.findById(cmd.formId);
    if (!form) throw new FormNotFoundError(cmd.formId);

    FormAccessPolicy.assertHasPermission(form, 'write', cmd.userPermissions);
    FormPolicy.assertPublishedAndEnabled(form);

    await checkFormRecordAccess(this.accessPort, {
      formId:          form.id,
      entityId:        cmd.entityId,
      userId:          cmd.userId,
      userPermissions: cmd.userPermissions,
      action:          'write',
    });

    await this.submissionRepo.clearByEntity(cmd.entityType, cmd.entityId, cmd.formId);

    this.eventBus.publish(
      new FormSubmissionClearedEvent(
        cmd.entityType,
        cmd.entityId,
        cmd.formId,
        cmd.userId,
      ),
    );
  }
}
