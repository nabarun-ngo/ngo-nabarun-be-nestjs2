import { CustomFieldDefinition } from '../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import {
  CustomFieldDefinitionResponseDto,
  DependentOptionsResponseDto,
  FieldConditionResponseDto,
  FieldOptionResponseDto,
} from '../dtos/response/custom-field-response.dtos';
import { FieldOption } from '../../domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '../../domain/value-objects/dependent-options/dependent-options.vo';

export class CustomFieldDefinitionResponseMapper {
  static toDto(definition: CustomFieldDefinition): CustomFieldDefinitionResponseDto {
    const dto = new CustomFieldDefinitionResponseDto();
    dto.id            = definition.id;
    dto.entityType    = definition.entityType;
    dto.key           = definition.key;
    dto.label         = definition.label;
    dto.fieldType     = definition.fieldType;
    dto.mandatory     = definition.mandatory;
    dto.fieldOptions  = [...definition.fieldOptions].map(CustomFieldDefinitionResponseMapper.toFieldOptionDto);
    dto.isHidden      = definition.isHidden;
    dto.isEncrypted   = definition.isEncrypted;
    dto.active        = definition.active;
    dto.sortOrder     = definition.sortOrder;
    dto.condition     = definition.condition
      ? CustomFieldDefinitionResponseMapper.toConditionDto(definition.condition)
      : null;
    dto.dependentOptions = definition.dependentOptions
      ? CustomFieldDefinitionResponseMapper.toDependentOptionsDto(definition.dependentOptions)
      : null;
    dto.viewPermissions = [...definition.viewPermissions];
    dto.createdAt  = definition.createdAt;
    dto.updatedAt  = definition.updatedAt ?? null;
    return dto;
  }

  static toFieldOptionDto(option: FieldOption): FieldOptionResponseDto {
    const dto = new FieldOptionResponseDto();
    dto.key   = option.key;
    dto.label = option.label;
    return dto;
  }

  static toConditionDto(condition: FieldCondition): FieldConditionResponseDto {
    const dto = new FieldConditionResponseDto();
    dto.dependsOnKey = condition.dependsOnKey;
    dto.operator     = condition.operator;
    dto.value        = condition.value;
    return dto;
  }

  static toDependentOptionsDto(dependentOptions: DependentOptions): DependentOptionsResponseDto {
    const dto = new DependentOptionsResponseDto();
    dto.dependsOnKey = dependentOptions.dependsOnKey;
    dto.optionMap = Object.fromEntries(
      Object.entries(dependentOptions.optionMap).map(([parentKey, opts]) => [
        parentKey,
        [...opts].map(CustomFieldDefinitionResponseMapper.toFieldOptionDto),
      ]),
    );
    return dto;
  }
}
