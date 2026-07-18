import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export interface QueueJobStartedSnapshot {
  readonly id: string;
  readonly jobName: string;
  readonly startedAt: string;
}

export class QueueJobStartedEvent extends DomainEvent<QueueJobStartedSnapshot> {
  constructor(snapshot: QueueJobStartedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
