import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FormNotFoundError } from '../../../domain/errors/form.errors';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { FormPolicy } from '../../../domain/policies/form.policy';
import { FormEntityTypePolicy } from '../../../domain/policies/form-entity-type.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormSubmissionRepository } from '../../../domain/repositories/form-submission.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { CUSTOM_FORMS_OPTIONS } from '../../../infrastructure/custom-forms-options.token';
import { CustomFormsModuleOptions } from '../../../custom-forms.schema';
import { FieldValueCodecService } from '../../../infrastructure/services/field-value-codec.service';
import { FormValidationResultResponseDto } from '../../dtos/response/form-response.dtos';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import {
  buildParsedValuesByFieldDefId,
  validateVisibleFields,
} from '../../utilities/form-submission-values.util';
import { ValidateFormSubmissionQuery } from './validate-form-submission.query';

@QueryHandler(ValidateFormSubmissionQuery)
@Injectable()
export class ValidateFormSubmissionHandler
  implements IQueryHandler<ValidateFormSubmissionQuery, FormValidationResultResponseDto>
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
    private readonly codec: FieldValueCodecService,
  ) {}

  async execute(
    query: ValidateFormSubmissionQuery,
  ): Promise<FormValidationResultResponseDto> {
    FormEntityTypePolicy.assertEntityTypeRegistered(query.entityType, this.options.entityTypes);

    const form = await this.formRepo.findByIdWithFields(query.formId);
    if (!form) throw new FormNotFoundError(query.formId);

    FormAccessPolicy.assertHasPermission(form, 'read', query.userPermissions);
    FormPolicy.assertPublishedAndEnabled(form);

    await checkFormRecordAccess(this.accessPort, {
      formId:          form.id,
      entityId:        query.entityId,
      userId:          '',
      userPermissions: query.userPermissions,
      action:          'read',
    });

    const submission = await this.submissionRepo.findByEntity(
      query.entityType,
      query.entityId,
      query.formId,
    );

    const storedByFieldDefId = new Map<string, string | null>(
      (submission?.fieldValues ?? []).map((v) => [v.fieldDefId, v.value]),
    );
    const parsedByDefId = await buildParsedValuesByFieldDefId(form, storedByFieldDefId, this.codec);
    const validation = validateVisibleFields(form, parsedByDefId, query.userPermissions);

    const dto = new FormValidationResultResponseDto();
    dto.valid =
      validation.missingMandatory.length === 0 &&
      validation.conditionViolations.length === 0 &&
      validation.validationViolations.length === 0;
    dto.missingMandatory     = validation.missingMandatory;
    dto.conditionViolations  = validation.conditionViolations;
    dto.validationViolations = validation.validationViolations;
    return dto;
  }
}
