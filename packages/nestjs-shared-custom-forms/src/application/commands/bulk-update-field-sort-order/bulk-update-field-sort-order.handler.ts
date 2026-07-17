import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { FormNotFoundError } from '../../../domain/errors/form.errors';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { FormFieldDefinitionResponseDto } from '../../dtos/response/form-response.dtos';
import { FormFieldDefinitionResponseMapper } from '../../mappers/form-field-definition-response.mapper';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import { BulkUpdateFieldSortOrderCommand } from './bulk-update-field-sort-order.command';

@CommandHandler(BulkUpdateFieldSortOrderCommand)
@Injectable()
export class BulkUpdateFieldSortOrderHandler
  implements ICommandHandler<BulkUpdateFieldSortOrderCommand, FormFieldDefinitionResponseDto[]>
{
  constructor(
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
    @Optional()
    @Inject(IFormEntityAccessPort)
    private readonly accessPort: IFormEntityAccessPort | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    cmd: BulkUpdateFieldSortOrderCommand,
  ): Promise<FormFieldDefinitionResponseDto[]> {
    const form = await this.formRepo.findByIdWithFields(cmd.formId);
    if (!form) throw new FormNotFoundError(cmd.formId);

    FormAccessPolicy.assertHasPermission(form, 'manage', cmd.userPermissions);

    await checkFormRecordAccess(this.accessPort, {
      formId:          form.id,
      userId:          cmd.userId,
      userPermissions: cmd.userPermissions,
      action:          'manage',
    });

    const sortedIds = [...cmd.items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.id);

    form.reorderFields(sortedIds);

    await this.formRepo.update(cmd.formId, form);

    const events = [...form.domainEvents];
    form.clearEvents();
    this.eventBus.publishAll(events);

    return [...form.fields]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(FormFieldDefinitionResponseMapper.toDto);
  }
}
