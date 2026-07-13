import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EntityTypePolicyUtil,
  EntityTypeForbiddenError,
  EntityAccessDeniedError,
} from '@ce/nestjs-shared-core';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { ListFieldDefinitionsResponseDto } from '../../dtos/response/custom-field-response.dtos';
import { CustomFieldDefinitionResponseMapper } from '../../mappers/custom-field-definition-response.mapper';
import { ListFieldDefinitionsQuery } from './list-field-definitions.query';

@QueryHandler(ListFieldDefinitionsQuery)
@Injectable()
export class ListFieldDefinitionsHandler
  implements IQueryHandler<ListFieldDefinitionsQuery, ListFieldDefinitionsResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
  ) {}

  async execute(query: ListFieldDefinitionsQuery): Promise<ListFieldDefinitionsResponseDto> {
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

    const definitions = await this.definitionRepo.findByEntityType(query.entityType, {
      activeOnly: query.activeOnly,
    });

    const userPermSet = new Set(query.userPermissions);
    const canSeeField = (def: typeof definitions[number]): boolean =>
      def.viewPermissions.length === 0 ||
      [...def.viewPermissions].some((p) => userPermSet.has(p));

    const visible = definitions.filter((d) => {
      if (!query.includeHidden && d.isHidden) return false;
      return canSeeField(d);
    });

    return {
      hasAccess: true,
      data: visible
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(CustomFieldDefinitionResponseMapper.toDto),
    };
  }
}
