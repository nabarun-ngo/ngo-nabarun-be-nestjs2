import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import { EntityFieldValuesDeletedEvent } from '../../../domain/events/entity-field-values-deleted.event';
import {
  ICustomFieldValueRepository,
} from '../../../domain/repositories/custom-field-value.repository';
import {
  ICustomFieldEntityAccessPort,
} from '../../../domain/ports/entity-access.port';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { DeleteEntityFieldValuesCommand } from './delete-entity-field-values.command';

@CommandHandler(DeleteEntityFieldValuesCommand)
@Injectable()
export class DeleteEntityFieldValuesHandler
  implements ICommandHandler<DeleteEntityFieldValuesCommand, void>
{
  constructor(
    @Inject(ICustomFieldValueRepository)
    private readonly valueRepo: ICustomFieldValueRepository,
    @Optional()
    @Inject(ICustomFieldEntityAccessPort)
    private readonly accessPort: ICustomFieldEntityAccessPort | null,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DeleteEntityFieldValuesCommand): Promise<void> {
    const config = EntityTypePolicyUtil.findConfig<EntityTypeConfig>(
      cmd.entityType,
      this.options.entityTypes,
      'CUSTOM_FIELD',
    );
    EntityTypePolicyUtil.assertHasPermission(
      config?.writePermissions,
      cmd.userPermissions,
      'write',
      cmd.entityType,
      'CUSTOM_FIELD',
    );

    await checkEntityRecordAccess(
      this.accessPort,
      {
        entityType:      cmd.entityType,
        entityId:        cmd.entityId,
        userId:          cmd.userId,
        userPermissions: cmd.userPermissions,
        action:          'write',
      },
      'CUSTOM_FIELD',
    );

    await this.valueRepo.deleteByEntity(cmd.entityType, cmd.entityId);

    this.eventBus.publish(
      new EntityFieldValuesDeletedEvent(cmd.entityType, cmd.entityId, cmd.userId),
    );
  }
}
