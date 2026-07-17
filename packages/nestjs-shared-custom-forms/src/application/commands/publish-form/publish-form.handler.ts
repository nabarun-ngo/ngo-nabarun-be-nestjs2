import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { FormNotFoundError } from '../../../domain/errors/form.errors';
import { FormAccessPolicy } from '../../../domain/policies/form-access.policy';
import { IFormRepository } from '../../../domain/repositories/form.repository';
import { IFormEntityAccessPort } from '../../../domain/ports/form-entity-access.port';
import { FormResponseDto } from '../../dtos/response/form-response.dtos';
import { FormResponseMapper } from '../../mappers/form-response.mapper';
import { checkFormRecordAccess } from '../../utilities/form-record-access.util';
import { PublishFormCommand } from './publish-form.command';

@CommandHandler(PublishFormCommand)
@Injectable()
export class PublishFormHandler implements ICommandHandler<PublishFormCommand, FormResponseDto> {
  constructor(
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
    @Optional()
    @Inject(IFormEntityAccessPort)
    private readonly accessPort: IFormEntityAccessPort | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: PublishFormCommand): Promise<FormResponseDto> {
    const form = await this.formRepo.findById(cmd.formId);
    if (!form) throw new FormNotFoundError(cmd.formId);

    FormAccessPolicy.assertHasPermission(form, 'manage', cmd.userPermissions);

    await checkFormRecordAccess(this.accessPort, {
      formId:          form.id,
      userId:          cmd.userId,
      userPermissions: cmd.userPermissions,
      action:          'manage',
    });

    form.publish(cmd.userId || undefined);

    await this.formRepo.update(cmd.formId, form);

    const events = [...form.domainEvents];
    form.clearEvents();
    this.eventBus.publishAll(events);

    return FormResponseMapper.toDto(form);
  }
}
