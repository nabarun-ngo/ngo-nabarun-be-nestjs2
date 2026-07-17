import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import {
  FormNotFoundError,
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
import { ResolvedFormFieldValueResponseDto } from '../../dtos/response/form-response.dtos';
import { FormFieldDefinitionResponseMapper } from '../../mappers/form-field-definition-response.mapper';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import {
  buildParsedValuesByFieldDefId,
  isFieldVisible,
  serialiseFormFieldValues,
} from '../../utilities/form-submission-values.util';
import { SaveFormDraftCommand } from './save-form-draft.command';

@CommandHandler(SaveFormDraftCommand)
@Injectable()
export class SaveFormDraftHandler
  implements ICommandHandler<SaveFormDraftCommand, ResolvedFormFieldValueResponseDto[]>
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
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SaveFormDraftCommand): Promise<ResolvedFormFieldValueResponseDto[]> {
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

    const existingSubmission = await this.submissionRepo.findByEntity(
      cmd.entityType,
      cmd.entityId,
      cmd.formId,
    );
    const existingByFieldDefId = new Map<string, string | null>(
      (existingSubmission?.fieldValues ?? []).map((v) => [v.fieldDefId, v.value]),
    );

    const serialisedValues = await serialiseFormFieldValues({
      form,
      values: cmd.values,
      existingValuesByFieldDefId: existingByFieldDefId,
      userId: cmd.userId,
      userPermissions: cmd.userPermissions,
      codec: this.codec,
    });

    const submission = await this.submissionRepo.upsertDraft(
      cmd.entityType,
      cmd.entityId,
      cmd.formId,
      serialisedValues,
    );

    const events = [...submission.domainEvents];
    submission.clearEvents();
    this.eventBus.publishAll(events);

    const storedByFieldDefId = new Map<string, string | null>(
      submission.fieldValues.map((v) => [v.fieldDefId, v.value]),
    );
    const parsedByDefId = await buildParsedValuesByFieldDefId(form, storedByFieldDefId, this.codec);
    const defByKey = new Map(form.fields.map((f) => [f.key, f]));

    return form.fields
      .filter((def) => isFieldVisible(def, defByKey, parsedByDefId, cmd.userPermissions))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((def) => {
        const parsedValue = parsedByDefId.get(def.id) ?? null;

        let availableOptions = [...def.fieldOptions];
        if (
          def.dependentOptions &&
          (def.fieldType === CustomFieldType.Select ||
            def.fieldType === CustomFieldType.Multiselect)
        ) {
          const parentDef = defByKey.get(def.dependentOptions.dependsOnKey);
          const parentValue = parentDef
            ? (parsedByDefId.get(parentDef.id) as string | null)
            : null;
          availableOptions = [...def.dependentOptions.getOptionsFor(parentValue)];
        }

        const dto = new ResolvedFormFieldValueResponseDto();
        dto.fieldDefId       = def.id;
        dto.key              = def.key;
        dto.label            = def.label;
        dto.fieldType        = def.fieldType;
        dto.value            = parsedValue;
        dto.availableOptions = availableOptions.map(FormFieldDefinitionResponseMapper.toFieldOptionDto);
        dto.dependentOptions = def.dependentOptions
          ? FormFieldDefinitionResponseMapper.toDependentOptionsDto(def.dependentOptions)
          : null;
        dto.mandatory        = def.mandatory;
        dto.validationRules  = def.validationRules
          ? FormFieldDefinitionResponseMapper.toValidationRulesDto(def.validationRules)
          : null;
        dto.isEncrypted      = def.isEncrypted;
        dto.isHidden         = def.isHidden;
        dto.condition        = def.condition
          ? FormFieldDefinitionResponseMapper.toConditionDto(def.condition)
          : null;
        return dto;
      });
  }
}
