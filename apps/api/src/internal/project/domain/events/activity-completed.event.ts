import { DomainEvent } from '@ce/nestjs-shared-core';

export type ActivityCompletedSnapshot = {
  readonly activityId: string;
  readonly projectId: string;
  readonly name: string;
};

export class ActivityCompletedEvent extends DomainEvent<ActivityCompletedSnapshot> {
  constructor(activityId: string, projectId: string, name: string) {
    super(activityId, { activityId, projectId, name });
  }
}
