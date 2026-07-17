export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TASK = 'TASK',
  APPROVAL = 'APPROVAL',
  REMINDER = 'REMINDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum NotificationCategory {
  SYSTEM = 'SYSTEM',
  WORKFLOW = 'WORKFLOW',
  DONATION = 'DONATION',
  EXPENSE = 'EXPENSE',
  PROJECT = 'PROJECT',
  MEETING = 'MEETING',
  TASK = 'TASK',
  DOCUMENT = 'DOCUMENT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
