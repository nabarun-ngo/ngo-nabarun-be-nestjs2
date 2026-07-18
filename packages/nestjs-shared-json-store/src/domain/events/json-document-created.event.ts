import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { JsonDocument } from '../aggregates/json-document.aggregate';

export type JsonDocumentCreatedSnapshot = Pick<JsonDocument, 'id' | 'key' | 'namespace'>;

/** Emitted by JsonDocument.create(). */
export class JsonDocumentCreatedEvent extends DomainEvent<JsonDocumentCreatedSnapshot> {
  constructor(snapshot: JsonDocumentCreatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
