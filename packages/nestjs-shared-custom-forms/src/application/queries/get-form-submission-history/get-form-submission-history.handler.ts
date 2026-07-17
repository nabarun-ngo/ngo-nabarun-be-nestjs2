import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FormNotFoundError } from '../../../domain/errors/form.errors';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { FormEntityTypePolicy } from '../../../domain/policies/form-entity-type.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormSubmissionRepository } from '../../../domain/repositories/form-submission.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { CUSTOM_FORMS_OPTIONS } from '../../../infrastructure/custom-forms-options.token';
import { CustomFormsModuleOptions } from '../../../custom-forms.schema';
import { FormFieldValueHistoryEntryResponseDto } from '../../dtos/response/form-response.dtos';
import { FormFieldValueHistoryEntryResponseMapper } from '../../mappers/form-field-value-history-entry-response.mapper';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import { GetFormSubmissionHistoryQuery } from './get-form-submission-history.query';

@QueryHandler(GetFormSubmissionHistoryQuery)
@Injectable()
export class GetFormSubmissionHistoryHandler
  implements IQueryHandler<GetFormSubmissionHistoryQuery, FormFieldValueHistoryEntryResponseDto[]>
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
  ) {}

  async execute(
    query: GetFormSubmissionHistoryQuery,
  ): Promise<FormFieldValueHistoryEntryResponseDto[]> {
    FormEntityTypePolicy.assertEntityTypeRegistered(query.entityType, this.options.entityTypes);

    const form = await this.formRepo.findByIdWithFields(query.formId);
    if (!form) throw new FormNotFoundError(query.formId);

    FormAccessPolicy.assertHasPermission(form, 'read', query.userPermissions);

    await checkFormRecordAccess(this.accessPort, {
      formId:          form.id,
      entityId:        query.entityId,
      userId:          '',
      userPermissions: query.userPermissions,
      action:          'read',
    });

    let fieldDefId: string | undefined;
    if (query.fieldKey) {
      const field = form.fields.find((f) => f.key === query.fieldKey);
      fieldDefId = field?.id;
    }

    const entries = await this.submissionRepo.findHistoryByEntity(
      query.entityType,
      query.entityId,
      query.formId,
      fieldDefId,
    );

    const fieldKeyById = new Map(form.fields.map((f) => [f.id, f.key]));

    return entries.map((entry) =>
      FormFieldValueHistoryEntryResponseMapper.toDto(
        entry,
        fieldKeyById.get(entry.fieldDefId) ?? entry.fieldDefId,
      ),
    );
  }
}
