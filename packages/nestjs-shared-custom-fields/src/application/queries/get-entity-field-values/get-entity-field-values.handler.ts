import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, EntityTypeForbiddenError, EntityAccessDeniedError, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import {
  ICustomFieldValueRepository,
} from '../../../domain/repositories/custom-field-value.repository';
import {
  ICustomFieldEntityAccessPort,
} from '../../../domain/ports/entity-access.port';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { FieldValueCodecService } from '../../../infrastructure/services/field-value-codec.service';
import {
  CustomFieldDefinitionResponseMapper,
} from '../../mappers/custom-field-definition-response.mapper';
import {
  GetEntityFieldValuesResponseDto,
  ResolvedCustomFieldValueResponseDto,
} from '../../dtos/response/custom-field-response.dtos';
import { GetEntityFieldValuesQuery } from './get-entity-field-values.query';
import { CustomFieldValueParsed } from '../../../domain/value-objects/field-condition/field-condition.vo';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

@QueryHandler(GetEntityFieldValuesQuery)
@Injectable()
export class GetEntityFieldValuesHandler
  implements IQueryHandler<GetEntityFieldValuesQuery, GetEntityFieldValuesResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(ICustomFieldValueRepository)
    private readonly valueRepo: ICustomFieldValueRepository,
    @Optional()
    @Inject(ICustomFieldEntityAccessPort)
    private readonly accessPort: ICustomFieldEntityAccessPort | null,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly codec: FieldValueCodecService,
  ) {}

  async execute(query: GetEntityFieldValuesQuery): Promise<GetEntityFieldValuesResponseDto> {
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

      await checkEntityRecordAccess(
        this.accessPort,
        {
          entityType:      query.entityType,
          entityId:        query.entityId,
          userId:          '',
          userPermissions: query.userPermissions,
          action:          'read',
        },
        'CUSTOM_FIELD',
      );
    } catch (err) {
      if (err instanceof EntityTypeForbiddenError || err instanceof EntityAccessDeniedError) {
        return { hasAccess: false, reason: err.errorCode, message: err.message, data: [] };
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

    // Deserialise all stored values for condition evaluation
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

    // Filter to visible fields: viewPermissions check AND (no condition OR condition satisfied)
    const visibleDefs = definitions.filter((def) => {
      if (!canSeeField(def)) return false;
      if (!def.condition) return true;
      const parentDef = defByKey.get(def.condition.dependsOnKey);
      if (!parentDef) return false;
      return def.condition.isSatisfiedBy(parsedByDefId.get(parentDef.id) ?? null);
    });

    const data = visibleDefs
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((def) => {
        const parsedValue = parsedByDefId.get(def.id) ?? null;

        // Resolve available options for select/multiselect
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

        const dto = new ResolvedCustomFieldValueResponseDto();
        dto.fieldDefId       = def.id;
        dto.key              = def.key;
        dto.label            = def.label;
        dto.fieldType        = def.fieldType;
        dto.value            = parsedValue;
        dto.availableOptions = availableOptions.map(
          CustomFieldDefinitionResponseMapper.toFieldOptionDto,
        );
        dto.dependentOptions = def.dependentOptions
          ? CustomFieldDefinitionResponseMapper.toDependentOptionsDto(def.dependentOptions)
          : null;
        dto.mandatory        = def.mandatory;
        dto.isEncrypted      = def.isEncrypted;
        dto.isHidden         = def.isHidden;
        dto.condition        = def.condition
          ? CustomFieldDefinitionResponseMapper.toConditionDto(def.condition)
          : null;
        return dto;
      });

    return { hasAccess: true, data };
  }
}
