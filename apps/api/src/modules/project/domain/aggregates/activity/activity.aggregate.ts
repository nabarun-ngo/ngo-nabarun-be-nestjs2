import { randomUUID } from 'crypto';
import { AggregateRoot, BusinessException } from '@ce/nestjs-shared-core';
import { ActivityCompletedEvent } from '../../events/activity-completed.event';
import { ActivityPriority, ActivityScale, ActivityStatus, ActivityType } from '../../enums/activity.enum';

export interface ActivityFilter {
  projectId?: string;
  scale?: ActivityScale;
  status?: ActivityStatus;
  type?: ActivityType;
  assignedTo?: string;
  organizerId?: string;
  parentActivityId?: string;
}

export interface ActivityCreateProps {
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
}

export class Activity extends AggregateRoot<string> {
  #projectId: string;
  #name: string;
  #description?: string;
  #scale: ActivityScale;
  #type: ActivityType;
  #status: ActivityStatus;
  #priority: ActivityPriority;
  #startDate?: Date;
  #endDate?: Date;
  #actualStartDate?: Date;
  #actualEndDate?: Date;
  #location?: string;
  #venue?: string;
  #assignedTo?: string;
  #organizerId?: string;
  #parentActivityId?: string;
  #expectedParticipants?: number;
  #actualParticipants?: number;
  #estimatedCost?: number;
  #actualCost?: number;
  #currency?: string;
  #tags: string[];
  #metadata?: Record<string, unknown>;

  constructor(
    id: string,
    projectId: string,
    name: string,
    scale: ActivityScale,
    type: ActivityType,
    status: ActivityStatus,
    priority: ActivityPriority,
    description?: string,
    startDate?: Date,
    endDate?: Date,
    actualStartDate?: Date,
    actualEndDate?: Date,
    location?: string,
    venue?: string,
    assignedTo?: string,
    organizerId?: string,
    parentActivityId?: string,
    expectedParticipants?: number,
    actualParticipants?: number,
    estimatedCost?: number,
    actualCost?: number,
    currency?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#projectId = projectId;
    this.#name = name;
    this.#scale = scale;
    this.#type = type;
    this.#status = status;
    this.#priority = priority;
    this.#description = description;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#actualStartDate = actualStartDate;
    this.#actualEndDate = actualEndDate;
    this.#location = location;
    this.#venue = venue;
    this.#assignedTo = assignedTo;
    this.#organizerId = organizerId;
    this.#parentActivityId = parentActivityId;
    this.#expectedParticipants = expectedParticipants;
    this.#actualParticipants = actualParticipants;
    this.#estimatedCost = estimatedCost;
    this.#actualCost = actualCost;
    this.#currency = currency;
    this.#tags = tags ?? [];
    this.#metadata = metadata;
  }

  static create(props: ActivityCreateProps): Activity {
    if (!props.projectId || !props.name) {
      throw new BusinessException('Project ID and name are required');
    }
    if (props.endDate && props.startDate && props.endDate < props.startDate) {
      throw new BusinessException('End date must be after start date');
    }
    if (props.scale === ActivityScale.EVENT && !props.organizerId) {
      throw new BusinessException('Organizer ID is required for events');
    }
    if (props.estimatedCost !== undefined && props.estimatedCost <= 0) {
      throw new BusinessException('Estimated cost must be positive');
    }
    return new Activity(
      randomUUID(),
      props.projectId,
      props.name,
      props.scale,
      props.type,
      ActivityStatus.PLANNED,
      props.priority,
      props.description,
      props.startDate,
      props.endDate,
      undefined,
      undefined,
      props.location,
      props.venue,
      props.assignedTo,
      props.organizerId,
      props.parentActivityId,
      props.expectedParticipants,
      undefined,
      props.estimatedCost,
      undefined,
      props.currency,
      props.tags,
      props.metadata,
    );
  }

  update(props: Partial<ActivityCreateProps>): void {
    if (this.#status === ActivityStatus.COMPLETED) {
      throw new BusinessException('Cannot update completed activity');
    }
    if (props.name !== undefined) this.#name = props.name;
    if (props.description !== undefined) this.#description = props.description;
    if (props.type !== undefined) this.#type = props.type;
    if (props.priority !== undefined) this.#priority = props.priority;
    if (props.location !== undefined) this.#location = props.location;
    if (props.venue !== undefined) this.#venue = props.venue;
    if (props.assignedTo !== undefined) this.#assignedTo = props.assignedTo;
    if (props.organizerId !== undefined) this.#organizerId = props.organizerId;
    if (props.expectedParticipants !== undefined) this.#expectedParticipants = props.expectedParticipants;
    if (props.tags !== undefined) this.#tags = props.tags;
    if (props.metadata !== undefined) this.#metadata = props.metadata;
    if (props.startDate !== undefined) this.#startDate = props.startDate;
    if (props.endDate !== undefined) {
      if (this.#startDate && props.endDate <= this.#startDate) {
        throw new BusinessException('End date must be after start date');
      }
      this.#endDate = props.endDate;
    }
    if (props.estimatedCost !== undefined) {
      if (props.estimatedCost <= 0) throw new BusinessException('Estimated cost must be positive');
      this.#estimatedCost = props.estimatedCost;
    }
    this.touch();
  }

  updateStatus(newStatus: ActivityStatus): void {
    if (this.#status === ActivityStatus.COMPLETED || this.#status === ActivityStatus.CANCELLED) {
      throw new BusinessException('Cannot change status of completed or cancelled activity');
    }
    this.#status = newStatus;
    if (newStatus === ActivityStatus.IN_PROGRESS) this.#actualStartDate = new Date();
    if (newStatus === ActivityStatus.COMPLETED) {
      this.#actualEndDate = new Date();
      this.addDomainEvent(new ActivityCompletedEvent(this.id, this.#projectId, this.#name));
    }
    this.touch();
  }

  get projectId(): string { return this.#projectId; }
  get name(): string { return this.#name; }
  get description(): string | undefined { return this.#description; }
  get scale(): ActivityScale { return this.#scale; }
  get type(): ActivityType { return this.#type; }
  get status(): ActivityStatus { return this.#status; }
  get priority(): ActivityPriority { return this.#priority; }
  get startDate(): Date | undefined { return this.#startDate; }
  get endDate(): Date | undefined { return this.#endDate; }
  get actualStartDate(): Date | undefined { return this.#actualStartDate; }
  get actualEndDate(): Date | undefined { return this.#actualEndDate; }
  get location(): string | undefined { return this.#location; }
  get venue(): string | undefined { return this.#venue; }
  get assignedTo(): string | undefined { return this.#assignedTo; }
  get organizerId(): string | undefined { return this.#organizerId; }
  get parentActivityId(): string | undefined { return this.#parentActivityId; }
  get expectedParticipants(): number | undefined { return this.#expectedParticipants; }
  get actualParticipants(): number | undefined { return this.#actualParticipants; }
  get estimatedCost(): number | undefined { return this.#estimatedCost; }
  get actualCost(): number | undefined { return this.#actualCost; }
  get currency(): string | undefined { return this.#currency; }
  get tags(): string[] { return [...this.#tags]; }
  get metadata(): Record<string, unknown> | undefined {
    return this.#metadata ? { ...this.#metadata } : undefined;
  }

  get nextStatus(): ActivityStatus[] {
    switch (this.#status) {
      case ActivityStatus.PLANNED:
      case ActivityStatus.CONFIRMED:
        return [ActivityStatus.IN_PROGRESS, ActivityStatus.ON_HOLD, ActivityStatus.CANCELLED];
      case ActivityStatus.IN_PROGRESS:
        return [ActivityStatus.COMPLETED, ActivityStatus.ON_HOLD, ActivityStatus.CANCELLED];
      case ActivityStatus.ON_HOLD:
        return [ActivityStatus.IN_PROGRESS, ActivityStatus.CANCELLED];
      default:
        return [];
    }
  }
}
