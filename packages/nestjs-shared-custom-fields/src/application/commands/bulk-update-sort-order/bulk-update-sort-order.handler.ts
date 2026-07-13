import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil } from '@ce/nestjs-shared-core';
import { CustomFieldDefinitionNotFoundError } from '../../../domain/errors/custom-field.errors';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { CustomFieldDefinitionResponseDto } from '../../dtos/response/custom-field-response.dtos';
import { CustomFieldDefinitionResponseMapper } from '../../mappers/custom-field-definition-response.mapper';
import { BulkUpdateSortOrderCommand } from './bulk-update-sort-order.command';

@CommandHandler(BulkUpdateSortOrderCommand)
@Injectable()
export class BulkUpdateSortOrderHandler
  implements ICommandHandler<BulkUpdateSortOrderCommand, CustomFieldDefinitionResponseDto[]>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
  ) {}

  async execute(cmd: BulkUpdateSortOrderCommand): Promise<CustomFieldDefinitionResponseDto[]> {
    const config = EntityTypePolicyUtil.findConfig<EntityTypeConfig>(
      cmd.entityType,
      this.options.entityTypes,
      'CUSTOM_FIELD',
    );
    EntityTypePolicyUtil.assertHasPermission(
      config?.managePermissions,
      cmd.userPermissions,
      'manage',
      cmd.entityType,
      'CUSTOM_FIELD',
    );

    const results: CustomFieldDefinitionResponseDto[] = [];

    for (const item of cmd.items) {
      const definition = await this.definitionRepo.findById(item.id);
      if (!definition) throw new CustomFieldDefinitionNotFoundError(item.id);

      definition.updateSortOrder(item.sortOrder);
      await this.definitionRepo.update(item.id, definition);
      results.push(CustomFieldDefinitionResponseMapper.toDto(definition));
    }

    return results;
  }
}
