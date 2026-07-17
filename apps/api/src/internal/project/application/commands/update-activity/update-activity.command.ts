import { ActivityPriority, ActivityStatus, ActivityType } from '../../../domain/enums/activity.enum';

export class UpdateActivityCommand {
  constructor(
    public readonly params: {
      activityId: string;
      name?: string;
      description?: string;
      type?: ActivityType;
      priority?: ActivityPriority;
      status?: ActivityStatus;
      startDate?: Date;
      endDate?: Date;
      location?: string;
      venue?: string;
      assignedTo?: string;
      organizerId?: string;
      expectedParticipants?: number;
      estimatedCost?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {}
}
