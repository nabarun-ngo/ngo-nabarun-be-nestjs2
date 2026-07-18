export interface MeetingCalendarReminder {
  method: 'popup' | 'email';
  minutes: number;
}

export interface MeetingCalendarGuestPermissions {
  guestsCanSeeOtherGuests?: boolean;
  guestsCanModify?: boolean;
  guestsCanInviteOthers?: boolean;
  anyoneCanAddSelf?: boolean;
}

export interface MeetingCalendarEventInput {
  summary?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  timeZone?: string;
  attendees?: string[];
  addMeetLink?: boolean;
  reminders?: MeetingCalendarReminder[];
  guestPermissions?: MeetingCalendarGuestPermissions;
}

export interface MeetingCalendarEvent {
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  timeZone?: string;
  attendees: string[];
  status: string;
  meetLink?: string;
  calendarLink: string;
  hostEmail?: string;
}

export const IMeetingCalendarPort = Symbol('IMeetingCalendarPort');

/**
 * Outbound port for syncing meetings with an external calendar provider
 * (Google Calendar in production — see GoogleCalendarMeetingAdapter).
 */
export interface IMeetingCalendarPort {
  createEvent(input: MeetingCalendarEventInput, calendarId?: string): Promise<MeetingCalendarEvent>;
  updateEvent(eventId: string, input: MeetingCalendarEventInput, calendarId?: string): Promise<MeetingCalendarEvent>;
  deleteEvent(eventId: string, calendarId?: string, notifyAttendees?: boolean): Promise<void>;
  getEvent(eventId: string, calendarId?: string): Promise<MeetingCalendarEvent>;
}
