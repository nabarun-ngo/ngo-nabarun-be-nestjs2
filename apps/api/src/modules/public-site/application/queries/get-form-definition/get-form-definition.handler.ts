import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FormFieldDefinition } from '@ce/nestjs-shared-custom-forms/domain/entities/form-field-definition/form-field-definition.entity';
import { toPublicApiFieldType } from '../../services/public-form-field-type.mapper';
import { PublicFormValidatorService } from '../../services/public-form-validator.service';
import { GetFormDefinitionQuery } from './get-form-definition.query';

export interface PublicFormDefinitionDto {
  id: string;
  key: string;
  label: string;
  description: string | null;
  fields: PublicFormFieldDefinitionDto[];
}

export interface PublicFormFieldDefinitionDto {
  id: string;
  key: string;
  label: string;
  fieldType: string;
  mandatory: boolean;
  fieldOptions: Array<{ key: string; label: string }>;
  isHidden: boolean;
  isEncrypted: boolean;
  enabled: boolean;
  sortOrder: number;
  condition: {
    dependsOnKey: string;
    operator: string;
    value: string | number | boolean | string[];
  } | null;
  dependentOptions: {
    dependsOnKey: string;
    optionMap: Record<string, Array<{ key: string; label: string }>>;
  } | null;
  validationRules: { pattern: string; regexErrMsg?: string } | null;
}

@QueryHandler(GetFormDefinitionQuery)
export class GetFormDefinitionHandler
  implements IQueryHandler<GetFormDefinitionQuery, PublicFormDefinitionDto>
{
  constructor(private readonly validator: PublicFormValidatorService) {}

  async execute(query: GetFormDefinitionQuery): Promise<PublicFormDefinitionDto> {
    const form = await this.validator.loadPublishedForm(query.publicFormId);

    return {
      id: query.publicFormId,
      key: query.publicFormId,
      label: form.label,
      description: form.description,
      fields: form.fields
        .filter((f) => f.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((field) => this.mapField(field)),
    };
  }

  private mapField(field: FormFieldDefinition): PublicFormFieldDefinitionDto {
    return {
      id: field.id,
      key: field.key,
      label: field.label,
      fieldType: toPublicApiFieldType(field.fieldType),
      mandatory: field.mandatory,
      fieldOptions: [...field.fieldOptions].map((o) => ({ key: o.key, label: o.label })),
      isHidden: field.isHidden,
      isEncrypted: field.isEncrypted,
      enabled: field.enabled,
      sortOrder: field.sortOrder,
      condition: field.condition
        ? {
            dependsOnKey: field.condition.dependsOnKey,
            operator: field.condition.operator,
            value: field.condition.value,
          }
        : null,
      dependentOptions: field.dependentOptions
        ? {
            dependsOnKey: field.dependentOptions.dependsOnKey,
            optionMap: Object.fromEntries(
              Object.entries(field.dependentOptions.optionMap).map(([k, opts]) => [
                k,
                [...opts].map((o) => ({ key: o.key, label: o.label })),
              ]),
            ),
          }
        : null,
      validationRules: field.validationRules
        ? {
            pattern: field.validationRules.pattern,
            regexErrMsg: field.validationRules.regexErrMsg,
          }
        : null,
    };
  }
}
