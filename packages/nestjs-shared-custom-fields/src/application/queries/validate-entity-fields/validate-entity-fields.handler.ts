import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, EntityTypeForbiddenError, EntityAccessDeniedError } from '@ce/nestjs-shared-core';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import {
  ICustomFieldValueRepository,
} from '../../../domain/repositories/custom-field-value.repository';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { FieldValueCodecService } from '../../../infrastructure/services/field-value-codec.service';
import {
  EntityFieldValidationResultResponseDto,
} from '../../dtos/response/custom-field-response.dtos';
import { ValidateEntityFieldsQuery } from './validate-entity-fields.query';
import { CustomFieldValueParsed } from '../../../domain/value-objects/field-condition/field-condition.vo';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

@QueryHandler(ValidateEntityFieldsQuery)
@Injectable()
export class ValidateEntityFieldsHandler
  implements IQueryHandler<ValidateEntityFieldsQuery, EntityFieldValidationResultResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(ICustomFieldValueRepository)
    private readonly valueRepo: ICustomFieldValueRepository,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly codec: FieldValueCodecService,
  ) {}

  async execute(
    query: ValidateEntityFieldsQuery,
  ): Promise<EntityFieldValidationResultResponseDto> {
    try {
      const config = EntityTypePolicyUtil.findConfig<EntityTypeConfig>(
        query.entityType,
        this.options.entityTypes,
        'CUSTOM_FIELD',
      );
      EntityTypePolicyUtil.assertHasPermission(
        config?.readPermissions,
        query.userPermissions,
        'read',
        query.entityType,
        'CUSTOM_FIELD',
      );
    } catch (err) {
      if (err instanceof EntityTypeForbiddenError || err instanceof EntityAccessDeniedError) {
        const dto = new EntityFieldValidationResultResponseDto();
        dto.hasAccess = false;
        dto.reason = err.errorCode;
        dto.message = err.message;
        dto.valid = false;
        dto.missingMandatory = [];
        dto.conditionViolations = [];
        return dto;
      }
      throw err;
    }

    const definitions = await this.definitionRepo.findByEntityType(query.entityType, {
      activeOnly: true,
    });
    const storedValues = await this.valueRepo.findByEntity(query.entityType, query.entityId);
    const valueByDefId = new Map(storedValues.map((v) => [v.fieldDefId, v.value]));
    const defByKey = new Map<string, CustomFieldDefinition>(
      definitions.map((d) => [d.key, d]),
    );

    // Deserialise for condition evaluation
    const parsedByDefId = new Map<string, CustomFieldValueParsed>();
    await Promise.all(
      definitions.map(async (def) => {
        const stored = valueByDefId.get(def.id) ?? null;
        if (stored === null) {
          parsedByDefId.set(def.id, null);
          return;
        }
        const raw = await this.codec.decryptIfNeeded(stored, def.key, def.isEncrypted);
        parsedByDefId.set(def.id, this.codec.parse(def.fieldType, raw, def.key));
      }),
    );

    const userPermSet = new Set(query.userPermissions);
    const canSeeField = (def: CustomFieldDefinition): boolean =>
      def.viewPermissions.length === 0 ||
      [...def.viewPermissions].some((p) => userPermSet.has(p));

    const missingMandatory: string[] = [];
    const conditionViolations: string[] = [];

    for (const def of definitions) {
      if (!canSeeField(def)) continue;

      const isVisible = !def.condition || (() => {
        const parentDef = defByKey.get(def.condition!.dependsOnKey);
        if (!parentDef) return false;
        return def.condition!.isSatisfiedBy(parsedByDefId.get(parentDef.id) ?? null);
      })();

      if (!isVisible) continue;

      const parsedValue = parsedByDefId.get(def.id) ?? null;

      if (def.mandatory && (parsedValue === null || parsedValue === undefined)) {
        missingMandatory.push(def.key);
      }

      // For select/multiselect, validate allowed keys
      if (
        parsedValue !== null &&
        (def.fieldType === CustomFieldType.Select ||
          def.fieldType === CustomFieldType.Multiselect)
      ) {
        let availableKeys: Set<string>;
        if (def.dependentOptions) {
          const parentDef = defByKey.get(def.dependentOptions.dependsOnKey);
          const parentValue = parentDef
            ? (parsedByDefId.get(parentDef.id) as string | null)
            : null;
          availableKeys = new Set(
            [...def.dependentOptions.getOptionsFor(parentValue)].map((o) => o.key),
          );
        } else {
          availableKeys = new Set([...def.fieldOptions].map((o) => o.key));
        }

        if (availableKeys.size > 0) {
          const keys = Array.isArray(parsedValue)
            ? (parsedValue as string[])
            : [parsedValue as string];
          if (keys.some((k) => !availableKeys.has(k))) {
            conditionViolations.push(def.key);
          }
        }
      }
    }

    const dto = new EntityFieldValidationResultResponseDto();
    dto.hasAccess           = true;
    dto.valid               = missingMandatory.length === 0 && conditionViolations.length === 0;
    dto.missingMandatory    = missingMandatory;
    dto.conditionViolations = conditionViolations;
    return dto;
  }
}
