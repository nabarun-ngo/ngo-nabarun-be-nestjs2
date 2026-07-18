/**
 * OnNotificationCreatedHandler unit tests.
 * This handler logs the event — verify it handles without throwing.
 */
import { Logger } from '@nestjs/common';
import { OnNotificationCreatedHandler } from '@nabarun-ngo/nestjs-shared-correspondence/application/event-handlers/on-notification-created/on-notification-created.handler';
import { NotificationCreatedEvent, type NotificationCreatedSnapshot } from '@nabarun-ngo/nestjs-shared-correspondence/domain/events/notification-created.event';
import { Notification } from '@nabarun-ngo/nestjs-shared-correspondence/domain/aggregates/notification.aggregate';
import { NotificationType, NotificationCategory } from '@nabarun-ngo/nestjs-shared-correspondence/domain/enums/notification-type.enum';

describe('OnNotificationCreatedHandler', () => {
  let handler: OnNotificationCreatedHandler;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    handler = new OnNotificationCreatedHandler();
  });

  afterEach(() => jest.restoreAllMocks());

  it('handles the event without throwing', () => {
    const notification = Notification.create({
      title: 'Test',
      body: 'Body',
      type: NotificationType.INFO,
      category: NotificationCategory.SYSTEM,
    });
    const event = new NotificationCreatedEvent(notification.toSnapshot<NotificationCreatedSnapshot>());
    expect(() => handler.handle(event)).not.toThrow();
  });

  it('logs notification id and type', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log');
    const notification = Notification.create({
      title: 'Test',
      body: 'Body',
      type: NotificationType.TASK,
      category: NotificationCategory.WORKFLOW,
    });
    const event = new NotificationCreatedEvent(notification.toSnapshot<NotificationCreatedSnapshot>());
    handler.handle(event);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(notification.id),
    );
  });
});
