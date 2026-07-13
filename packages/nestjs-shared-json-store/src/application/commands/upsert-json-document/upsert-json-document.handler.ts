import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IJsonDocumentRepository } from '../../../domain/repositories/json-document.repository';
import { JsonDocumentCreatedEvent } from '../../../domain/events/json-document-created.event';
import { JsonDocumentUpdatedEvent } from '../../../domain/events/json-document-updated.event';
import { JsonDocumentResponseDto } from '../../dtos/json-document.dtos';
import { JsonDocumentResponseMapper } from '../../mappers/json-document-response.mapper';
import { UpsertJsonDocumentCommand } from './upsert-json-document.command';

@CommandHandler(UpsertJsonDocumentCommand)
@Injectable()
export class UpsertJsonDocumentHandler
  implements ICommandHandler<UpsertJsonDocumentCommand, JsonDocumentResponseDto>
{
  constructor(
    @Inject(IJsonDocumentRepository)
    private readonly repo: IJsonDocumentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params }: UpsertJsonDocumentCommand): Promise<JsonDocumentResponseDto> {
    const { document, wasCreated, payloadChanged } = await this.repo.upsertByKey(
      params.key,
      params.namespace,
      params.payload,
    );

    // LOW-1: Only publish an event when the payload actually changed to avoid
    // spurious update events on identical writes.
    if (payloadChanged) {
      document.addDomainEvent(
        wasCreated
          ? new JsonDocumentCreatedEvent(document)
          : new JsonDocumentUpdatedEvent(document),
      );

      const events = [...document.domainEvents];
      document.clearEvents();
      this.eventBus.publishAll(events);
    }

    return JsonDocumentResponseMapper.toDto(document);
  }
}
