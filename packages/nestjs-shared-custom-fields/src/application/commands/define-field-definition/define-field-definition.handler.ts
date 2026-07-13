import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldKeyAlreadyExistsError } from '../../../domain/errors/custom-field.errors';
import {
  CustomFieldEntityTypePolicy,
  EntityTypeConfig,
} from '../../../domain/policies/custom-field-entity-type.policy';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import {
  ICustomFieldEntityAccessPort,
} from '../../../domain/ports/entity-access.port';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { CustomFieldDefinitionResponseDto } from '../../dtos/response/custom-field-response.dtos';
import { CustomFieldDefinitionResponseMapper } from '../../mappers/custom-field-definition-response.mapper';
import { DefineFieldDefinitionCommand } from './define-field-definition.command';

@CommandHandler(DefineFieldDefinitionCommand)
@Injectable()
export class DefineFieldDefinitionHandler
  implements ICommandHandler<DefineFieldDefinitionCommand, CustomFieldDefinitionResponseDto>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Optional()
    @Inject(ICustomFieldEntityAccessPort)
    private readonly accessPort: ICustomFieldEntityAccessPort | null,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DefineFieldDefinitionCommand): Promise<CustomFieldDefinitionResponseDto> {
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
    CustomFieldEntityTypePolicy.assertFieldTypeAllowed(
      cmd.fieldType,
      config,
      this.options.globalAllowedFieldTypes,
    );

    await checkEntityRecordAccess(
      this.accessPort,
      {
        entityType:      cmd.entityType,
        userId:          cmd.userId,
        userPermissions: cmd.userPermissions,
        action:          'manage',
      },
      'CUSTOM_FIELD',
    );

    const count = await this.definitionRepo.count({ entityType: cmd.entityType, active: true });
    CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(
      count,
      config,
      this.options.globalMaxFieldsPerEntityType,
    );

    const existing = await this.definitionRepo.findByKey(cmd.entityType, cmd.key);
    // LOW-1: Only block creation when the existing definition is still active.
    // A deactivated (soft-deleted) definition's key is reusable.
    if (existing && existing.active) throw new CustomFieldKeyAlreadyExistsError(cmd.key, cmd.entityType);

    const definition = CustomFieldDefinition.create({
      entityType:       cmd.entityType,
      key:              cmd.key,
      label:            cmd.label,
      fieldType:        cmd.fieldType,
      mandatory:        cmd.mandatory,
      fieldOptions:     cmd.fieldOptions,
      isHidden:         cmd.isHidden,
      isEncrypted:      cmd.isEncrypted,
      sortOrder:        cmd.sortOrder,
      condition:        cmd.condition,
      dependentOptions: cmd.dependentOptions,
      createdBy:        cmd.userId || undefined,
      viewPermissions:  cmd.viewPermissions,
    });

    await this.definitionRepo.create(definition);

    const events = [...definition.domainEvents];
    definition.clearEvents();
    this.eventBus.publishAll(events);

    return CustomFieldDefinitionResponseMapper.toDto(definition);
  }
}
