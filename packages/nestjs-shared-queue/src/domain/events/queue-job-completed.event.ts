import { DomainEvent } from '@ce/nestjs-shared-core';

export interface QueueJobCompletedSnapshot {
  readonly id: string;
  readonly jobName: string;
  readonly finishedAt: string;
}

export class QueueJobCompletedEvent extends DomainEvent<QueueJobCompletedSnapshot> {
  constructor(snapshot: QueueJobCompletedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
