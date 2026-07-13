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
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import {
  CustomFieldValueHistoryEntryResponseDto,
  GetFieldValueHistoryResponseDto,
} from '../../dtos/response/custom-field-response.dtos';
import {
  CustomFieldValueHistoryEntryResponseMapper,
} from '../../mappers/custom-field-value-history-entry-response.mapper';
import { GetEntityFieldValueHistoryQuery } from './get-entity-field-value-history.query';

@QueryHandler(GetEntityFieldValueHistoryQuery)
@Injectable()
export class GetEntityFieldValueHistoryHandler
  implements IQueryHandler<GetEntityFieldValueHistoryQuery, GetFieldValueHistoryResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(ICustomFieldValueRepository)
    private readonly valueRepo: ICustomFieldValueRepository,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
  ) {}

  async execute(
    query: GetEntityFieldValueHistoryQuery,
  ): Promise<GetFieldValueHistoryResponseDto> {
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
        return { hasAccess: false, reason: err.errorCode, message: err.message, data: [] };
      }
      throw err;
    }

    let fieldDefId: string | undefined;
    if (query.fieldKey) {
      const def = await this.definitionRepo.findByKey(query.entityType, query.fieldKey);
      fieldDefId = def?.id;
    }

    const entries = await this.valueRepo.findHistoryByEntity(
      query.entityType,
      query.entityId,
      fieldDefId,
    );

    const definitions = await this.definitionRepo.findByEntityType(query.entityType, {
      activeOnly: false,
    });
    const defById = new Map(definitions.map((d) => [d.id, d.key]));

    const data = entries.map((entry) =>
      CustomFieldValueHistoryEntryResponseMapper.toDto(
        entry,
        defById.get(entry.fieldDefId) ?? entry.fieldDefId,
      ),
    );

    return { hasAccess: true, data };
  }
}
