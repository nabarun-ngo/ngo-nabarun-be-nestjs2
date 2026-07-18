/**
 * OnUserNotificationReadHandler unit tests.
 */
import { Logger } from '@nestjs/common';
import { OnUserNotificationReadHandler } from '@nabarun-ngo/nestjs-shared-correspondence/application/event-handlers/on-user-notification-read/on-user-notification-read.handler';
import { UserNotificationReadEvent, type UserNotificationReadSnapshot } from '@nabarun-ngo/nestjs-shared-correspondence/domain/events/user-notification-read.event';
import { UserNotification } from '@nabarun-ngo/nestjs-shared-correspondence/domain/aggregates/user-notification.aggregate';

describe('OnUserNotificationReadHandler', () => {
  let handler: OnUserNotificationReadHandler;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    handler = new OnUserNotificationReadHandler();
  });

  afterEach(() => jest.restoreAllMocks());

  it('handles the event without throwing', () => {
    const un = UserNotification.create({ notificationId: 'n-1', userId: 'u-1' });
    un.markAsRead();
    const event = new UserNotificationReadEvent(un.toSnapshot<UserNotificationReadSnapshot>());
    expect(() => handler.handle(event)).not.toThrow();
  });

  it('logs the userNotification id and userId', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log');
    const un = UserNotification.create({ notificationId: 'n-1', userId: 'u-1' });
    un.markAsRead();
    const event = new UserNotificationReadEvent(un.toSnapshot<UserNotificationReadSnapshot>());
    handler.handle(event);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(un.id));
  });
});
