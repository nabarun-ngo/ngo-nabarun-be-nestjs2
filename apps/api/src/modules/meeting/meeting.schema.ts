import { z } from 'zod';

export const MeetingModuleOptionsSchema = z.object({
  /** IANA timezone used for calendar event creation when the caller doesn't specify one. */
  timezone: z.string().default('Asia/Kolkata'),
  /** When true, redirects real attendee emails to `mockedAttendeeEmail` (non-prod safety net). */
  mockAttendeesInNonProd: z.boolean().default(false),
  mockedAttendeeEmail: z.string().optional(),
});

export type MeetingModuleOptions = z.infer<typeof MeetingModuleOptionsSchema>;
export type MeetingModuleInput = z.input<typeof MeetingModuleOptionsSchema>;
