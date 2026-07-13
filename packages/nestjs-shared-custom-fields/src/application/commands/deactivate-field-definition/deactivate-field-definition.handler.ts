import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
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
import { DeactivateFieldDefinitionCommand } from './deactivate-field-definition.command';

@CommandHandler(DeactivateFieldDefinitionCommand)
@Injectable()
export class DeactivateFieldDefinitionHandler
  implements ICommandHandler<DeactivateFieldDefinitionCommand, CustomFieldDefinitionResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    cmd: DeactivateFieldDefinitionCommand,
  ): Promise<CustomFieldDefinitionResponseDto> {
    const definition = await this.definitionRepo.findById(cmd.id);
    if (!definition) throw new CustomFieldDefinitionNotFoundError(cmd.id);

    const config = EntityTypePolicyUtil.findConfig<EntityTypeConfig>(
      definition.entityType,
      this.options.entityTypes,
      'CUSTOM_FIELD',
    );
    EntityTypePolicyUtil.assertHasPermission(
      config?.managePermissions,
      cmd.userPermissions,
      'manage',
      definition.entityType,
      'CUSTOM_FIELD',
    );

    definition.deactivate(cmd.userId || undefined);

    await this.definitionRepo.update(cmd.id, definition);

    const events = [...definition.domainEvents];
    definition.clearEvents();
    this.eventBus.publishAll(events);

    return CustomFieldDefinitionResponseMapper.toDto(definition);
  }
}
