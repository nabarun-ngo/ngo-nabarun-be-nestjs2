import { calendar_v3 } from '@googleapis/calendar';
import { OAuth2Client } from 'googleapis-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, IOAuthAccessTokenPort, OAUTH_ACCESS_TOKEN_PORT } from '@nabarun-ngo/nestjs-shared-core';
import { GOOGLE_SCOPES } from '@nabarun-ngo/nestjs-shared-token-vault';
import {
  IMeetingCalendarPort,
  MeetingCalendarEvent,
  MeetingCalendarEventInput,
} from '../../../modules/meeting/application/ports/meeting-calendar.port';

const DEFAULT_CALENDAR_ID = 'primary';

@Injectable()
export class GoogleCalendarMeetingAdapter implements IMeetingCalendarPort {
  private readonly logger = new Logger(GoogleCalendarMeetingAdapter.name);
  private readonly scope = GOOGLE_SCOPES.calendarEvents;

  constructor(
    @Inject(OAUTH_ACCESS_TOKEN_PORT)
    private readonly oauthTokens: IOAuthAccessTokenPort,
  ) { }

  private async getClient(): Promise<calendar_v3.Calendar> {
    let accessToken: string;
    try {
      accessToken = await this.oauthTokens.getAccessToken({ provider: 'google', scope: this.scope });
    } catch {
      throw new BusinessError('Connect a Google account before scheduling meetings');
    }
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    return new calendar_v3.Calendar({ auth });
  }

  async createEvent(input: MeetingCalendarEventInput, calendarId = DEFAULT_CALENDAR_ID): Promise<MeetingCalendarEvent> {
    try {
      const calendar = await this.getClient();

      const event: calendar_v3.Schema$Event = {
        summary: input.summary,
        description: input.description,
        location: input.location,
        attendees: input.attendees?.map((email) => ({ email })),
        anyoneCanAddSelf: input.guestPermissions?.anyoneCanAddSelf ?? true,
        guestsCanInviteOthers: input.guestPermissions?.guestsCanInviteOthers ?? true,
        guestsCanModify: input.guestPermissions?.guestsCanModify ?? true,
        guestsCanSeeOtherGuests: input.guestPermissions?.guestsCanSeeOtherGuests ?? true,
        start: { dateTime: input.startTime?.toISOString(), timeZone: input.timeZone ?? 'Asia/Kolkata' },
        end: { dateTime: input.endTime?.toISOString(), timeZone: input.timeZone ?? 'Asia/Kolkata' },
        reminders: {
          ...(input.reminders?.length ? { useDefault: false } : { useDefault: true }),
          ...(input.reminders?.length ? { overrides: input.reminders } : {}),
        },
      };

      if (input.addMeetLink) {
        event.conferenceData = {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
        conferenceDataVersion: input.addMeetLink ? 1 : 0,
        sendUpdates: 'all',
      });
      this.logger.log(`Event created: ${response.data.id}`);
      return this.toMeetingCalendarEvent(response.data);
    } catch (error) {
      this.logger.error('Error creating calendar event', error as Error);
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    input: MeetingCalendarEventInput,
    calendarId = DEFAULT_CALENDAR_ID,
  ): Promise<MeetingCalendarEvent> {
    try {
      const calendar = await this.getClient();
      const existingEvent = await calendar.events.get({ calendarId, eventId });

      const updatedEvent: calendar_v3.Schema$Event = {
        ...existingEvent.data,
        summary: input.summary ?? existingEvent.data.summary,
        description: input.description ?? existingEvent.data.description,
        location: input.location ?? existingEvent.data.location,
      };

      if (input.startTime) {
        updatedEvent.start = {
          dateTime: input.startTime.toISOString(),
          timeZone: input.timeZone ?? existingEvent.data.start?.timeZone ?? 'UTC',
        };
      }
      if (input.endTime) {
        updatedEvent.end = {
          dateTime: input.endTime.toISOString(),
          timeZone: input.timeZone ?? existingEvent.data.end?.timeZone ?? 'UTC',
        };
      }
      if (input.attendees) {
        updatedEvent.attendees = input.attendees.map((email) => ({ email }));
      }

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
        sendUpdates: 'all',
      });
      this.logger.log(`Event updated: ${eventId}`);
      return this.toMeetingCalendarEvent(response.data);
    } catch (error) {
      this.logger.error(`Error updating calendar event: ${eventId}`, error as Error);
      throw error;
    }
  }

  async deleteEvent(eventId: string, calendarId = DEFAULT_CALENDAR_ID, notifyAttendees = true): Promise<void> {
    try {
      const calendar = await this.getClient();
      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: notifyAttendees ? 'all' : 'none',
      });
      this.logger.log(`Event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(`Error deleting calendar event: ${eventId}`, error as Error);
      throw error;
    }
  }

  async getEvent(eventId: string, calendarId = DEFAULT_CALENDAR_ID): Promise<MeetingCalendarEvent> {
    try {
      const calendar = await this.getClient();
      const response = await calendar.events.get({ calendarId, eventId });
      return this.toMeetingCalendarEvent(response.data);
    } catch (error) {
      this.logger.error(`Error fetching calendar event: ${eventId}`, error as Error);
      throw error;
    }
  }

  private toMeetingCalendarEvent(event: calendar_v3.Schema$Event): MeetingCalendarEvent {
    const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri;
    return {
      eventId: event.id ?? '',
      summary: event.summary ?? undefined,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startTime: event.start?.dateTime ? new Date(event.start.dateTime) : undefined,
      endTime: event.end?.dateTime ? new Date(event.end.dateTime) : undefined,
      timeZone: event.start?.timeZone ?? 'UTC',
      attendees: event.attendees?.map((a) => a.email).filter((e): e is string => !!e) ?? [],
      status: event.status ?? 'unknown',
      meetLink: meetLink ?? undefined,
      calendarLink: event.htmlLink ?? '',
      hostEmail: event.creator?.email ?? undefined,
    };
  }
}
