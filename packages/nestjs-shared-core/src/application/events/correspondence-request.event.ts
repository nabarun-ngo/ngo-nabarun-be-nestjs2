import { IEvent } from '@nestjs/cqrs';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '../../domain/enums/notification-channel.enum';

export interface NotificationAction {
  url?: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface TargetUsersRecipients {
  mode: 'users';
  userIds: string[];
}

export interface TargetRolesRecipients {
  mode: 'roles';
  roleNames: string[];
}

export interface TargetResourceRecipients {
  mode: 'resource';
  referenceType: string;
  referenceId?: string;
  excludeUserIds?: string[];
}

export type CorrespondenceRecipients =
  | TargetUsersRecipients
  | TargetRolesRecipients
  | TargetResourceRecipients;

export interface InAppChannelOptions {
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  action?: NotificationAction;
  referenceId?: string;
  referenceType?: string;
  imageUrl?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface EmailChannelOptions {
  templateKey: string;
  overrideEmails?: string[];
  cc?: string[];
  templateData?: Record<string, unknown>;
}

export interface PushChannelOptions {
  enabled: boolean;
}

export type CorrespondenceChannels =
  | { inApp: InAppChannelOptions; email?: EmailChannelOptions; push?: PushChannelOptions }
  | { inApp?: never; email: EmailChannelOptions; push?: never };

/**
 * Cross-module integration event published by consumers (e.g. Comment) to trigger
 * correspondence dispatch. Lives in core so feature packages avoid coupling.
 */
export class CorrespondenceRequestEvent implements IEvent {
  readonly recipients: CorrespondenceRecipients;
  readonly channels: CorrespondenceChannels;

  constructor(params: {
    recipients: CorrespondenceRecipients;
    channels: CorrespondenceChannels;
  }) {
    this.recipients = params.recipients;
    this.channels = params.channels;
  }
}
