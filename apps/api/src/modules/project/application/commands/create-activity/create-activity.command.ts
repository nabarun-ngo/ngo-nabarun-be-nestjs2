import { ActivityPriority, ActivityScale, ActivityType } from '../../../domain/enums/activity.enum';

export class CreateActivityCommand {
  constructor(
    public readonly params: {
      projectId: string;
      name: string;
      description?: string;
      scale: ActivityScale;
      type: ActivityType;
      priority: ActivityPriority;
      startDate?: Date;
      endDate?: Date;
      location?: string;
      venue?: string;
      assignedTo?: string;
      organizerId?: string;
      parentActivityId?: string;
      expectedParticipants?: number;
      estimatedCost?: number;
      currency?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {}
}
