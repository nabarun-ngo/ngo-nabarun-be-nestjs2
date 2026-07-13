import { RootEvent } from '@ce/nestjs-shared-core';

/**
 * Emitted by DeleteEntityFieldValuesHandler after all custom field values
 * for an entity record are removed.
 *
 * Uses RootEvent (not DomainEvent) because the deletion spans multiple
 * CustomFieldValue aggregates — it is not tied to a single aggregate root's
 * state change.
 */
export class EntityFieldValuesDeletedEvent extends RootEvent {
  public readonly occurredAt: Date = new Date();

  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly deletedByUserId: string,
  ) {
    super();
  }
}
