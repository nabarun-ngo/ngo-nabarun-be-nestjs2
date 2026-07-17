import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  FieldConditionViolatedError,
  FieldValidationRuleViolatedError,
  FormNotFoundError,
  MandatoryFieldMissingError,
} from '../../../domain/errors/form.errors';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { FormPolicy } from '../../../domain/policies/form.policy';
import { FormEntityTypePolicy } from '../../../domain/policies/form-entity-type.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormSubmissionRepository } from '../../../domain/repositories/form-submission.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { CUSTOM_FORMS_OPTIONS } from '../../../infrastructure/custom-forms-options.token';
import { CustomFormsModuleOptions } from '../../../custom-forms.schema';
import { FieldValueCodecService } from '../../../infrastructure/services/field-value-codec.service';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import {
  buildParsedValuesByFieldDefId,
  serialiseFormFieldValues,
  validateVisibleFields,
} from '../../utilities/form-submission-values.util';
import { SubmitFormCommand } from './submit-form.command';

@CommandHandler(SubmitFormCommand)
@Injectable()
export class SubmitFormHandler implements ICommandHandler<SubmitFormCommand, void> {
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
    private readonly codec: FieldValueCodecService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SubmitFormCommand): Promise<void> {
    FormEntityTypePolicy.assertEntityTypeRegistered(cmd.entityType, this.options.entityTypes);

    const form = await this.formRepo.findByIdWithFields(cmd.formId);
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

    let submission = await this.submissionRepo.findByEntity(
      cmd.entityType,
      cmd.entityId,
      cmd.formId,
    );

    const existingByFieldDefId = new Map<string, string | null>(
      (submission?.fieldValues ?? []).map((v) => [v.fieldDefId, v.value]),
    );

    if (cmd.values && Object.keys(cmd.values).length > 0) {
      const serialisedValues = await serialiseFormFieldValues({
        form,
        values: cmd.values,
        existingValuesByFieldDefId: existingByFieldDefId,
        userId: cmd.userId,
        userPermissions: cmd.userPermissions,
        codec: this.codec,
      });

      submission = await this.submissionRepo.upsertDraft(
        cmd.entityType,
        cmd.entityId,
        cmd.formId,
        serialisedValues,
      );

      const draftEvents = [...submission.domainEvents];
      submission.clearEvents();
      this.eventBus.publishAll(draftEvents);
    }

    if (!submission) {
      submission = await this.submissionRepo.upsertDraft(
        cmd.entityType,
        cmd.entityId,
        cmd.formId,
        [],
      );
    }

    const storedByFieldDefId = new Map<string, string | null>(
      submission.fieldValues.map((v) => [v.fieldDefId, v.value]),
    );
    const parsedByDefId = await buildParsedValuesByFieldDefId(form, storedByFieldDefId, this.codec);

    const validation = validateVisibleFields(form, parsedByDefId, cmd.userPermissions);
    if (validation.missingMandatory.length > 0) {
      throw new MandatoryFieldMissingError(validation.missingMandatory[0]);
    }
    if (validation.conditionViolations.length > 0) {
      throw new FieldConditionViolatedError(validation.conditionViolations[0]);
    }
    if (validation.validationViolations.length > 0) {
      const fieldKey = validation.validationViolations[0];
      const def = form.fields.find((f) => f.key === fieldKey);
      throw new FieldValidationRuleViolatedError(fieldKey, def?.validationRules?.regexErrMsg);
    }

    submission.submit(cmd.userId);

    await this.submissionRepo.update(submission.id, submission);

    const domainEvents = [...submission.domainEvents];
    submission.clearEvents();
    this.eventBus.publishAll(domainEvents);

    const integrationEvents = [...submission.integrationEvents];
    submission.clearIntegrationEvents();
    this.eventBus.publishAll(integrationEvents);
  }
}
