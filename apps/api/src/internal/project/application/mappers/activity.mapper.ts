import { Activity } from '../../domain/aggregates/activity/activity.aggregate';
import { ActivityDetailDto } from '../dtos/activity.dto';

export class ActivityMapper {
  static toDto(activity: Activity): ActivityDetailDto {
    return {
      id: activity.id,
      projectId: activity.projectId,
      name: activity.name,
      description: activity.description,
      scale: activity.scale,
      type: activity.type,
      status: activity.status,
      priority: activity.priority,
      startDate: activity.startDate,
      endDate: activity.endDate,
      actualStartDate: activity.actualStartDate,
      actualEndDate: activity.actualEndDate,
      location: activity.location,
      venue: activity.venue,
      assignedTo: activity.assignedTo,
      organizerId: activity.organizerId,
      parentActivityId: activity.parentActivityId,
      expectedParticipants: activity.expectedParticipants,
      actualParticipants: activity.actualParticipants,
      estimatedCost: activity.estimatedCost,
      actualCost: activity.actualCost,
      currency: activity.currency,
      tags: activity.tags,
      metadata: activity.metadata,
      createdAt: activity.createdAt!,
      updatedAt: activity.updatedAt!,
      nextStatus: activity.nextStatus,
    };
  }
}
