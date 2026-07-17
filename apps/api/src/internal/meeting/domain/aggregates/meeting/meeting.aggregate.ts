import { randomUUID } from 'crypto';
import { AggregateRoot, BusinessException } from '@ce/nestjs-shared-core';
import { MeetingType } from '../../enums/meeting-type.enum';

export interface MeetingParticipant {
  id?: string;
  name?: string;
  email: string;
  attended?: string;
}

export interface MeetingAgendaItem {
  agenda: string;
  outcomes?: string;
}

export interface MeetingFilter {
  createdById?: string;
  participantId?: string;
  participantEmail?: string;
}

export interface MeetingCreateProps {
  summary: string;
  type: MeetingType;
  status: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  agenda?: MeetingAgendaItem[];
  location?: string;
  attendees?: MeetingParticipant[];
  hostEmail?: string;
  createdById?: string;
}

export interface MeetingUpdateProps {
  summary?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  agenda?: MeetingAgendaItem[];
  status?: string;
  location?: string;
  attendees?: MeetingParticipant[];
  outcomes?: string;
}

export interface FathomMeetingData {
  recordingUrl?: string;
  meetingNotes?: string;
  meetingTranscript?: string;
  meetingActionItems?: string;
}

export class Meeting extends AggregateRoot<string> {
  #summary: string;
  #type: MeetingType;
  #status: string;
  #startTime: Date;
  #endTime: Date;
  #description?: string;
  #agenda: MeetingAgendaItem[];
  #outcomes?: string;
  #location?: string;
  #attendees: MeetingParticipant[];
  #hostEmail?: string;
  #createdById?: string;
  #extMeetingId?: string;
  #meetLink?: string;
  #calendarLink?: string;
  #recordingUrl?: string;
  #meetingNotes?: string;
  #meetingTranscript?: string;
  #meetingActionItems?: string;

  constructor(
    id: string,
    summary: string,
    type: MeetingType,
    status: string,
    startTime: Date,
    endTime: Date,
    description: string | undefined,
    agenda: MeetingAgendaItem[] | undefined,
    outcomes: string | undefined,
    location: string | undefined,
    attendees: MeetingParticipant[] | undefined,
    hostEmail: string | undefined,
    createdById: string | undefined,
    extMeetingId: string | undefined,
    meetLink: string | undefined,
    calendarLink: string | undefined,
    recordingUrl: string | undefined,
    meetingNotes: string | undefined,
    meetingTranscript: string | undefined,
    meetingActionItems: string | undefined,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#summary = summary;
    this.#type = type;
    this.#status = status;
    this.#startTime = startTime;
    this.#endTime = endTime;
    this.#description = description;
    this.#agenda = agenda ?? [];
    this.#outcomes = outcomes;
    this.#location = location;
    this.#attendees = attendees ?? [];
    this.#hostEmail = hostEmail;
    this.#createdById = createdById;
    this.#extMeetingId = extMeetingId;
    this.#meetLink = meetLink;
    this.#calendarLink = calendarLink;
    this.#recordingUrl = recordingUrl;
    this.#meetingNotes = meetingNotes;
    this.#meetingTranscript = meetingTranscript;
    this.#meetingActionItems = meetingActionItems;
  }

  static create(props: MeetingCreateProps): Meeting {
    if (!props.summary) {
      throw new BusinessException('Meeting summary is required');
    }
    if (props.endTime.getTime() <= props.startTime.getTime()) {
      throw new BusinessException('End time must be after start time');
    }
    return new Meeting(
      randomUUID(),
      props.summary,
      props.type,
      props.status,
      props.startTime,
      props.endTime,
      props.description,
      props.agenda,
      undefined,
      props.location,
      props.attendees,
      props.hostEmail,
      props.createdById,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  /** Applies a partial update and reports whether the change requires a Google Calendar sync. */
  update(props: MeetingUpdateProps): boolean {
    if (props.startTime && props.endTime && props.endTime.getTime() <= props.startTime.getTime()) {
      throw new BusinessException('End time must be after start time');
    }

    const currentAttendeeEmails = this.#attendees.map((a) => a.email);
    const attendeesChanged =
      props.attendees !== undefined && props.attendees.some((a) => !currentAttendeeEmails.includes(a.email));

    const currentAgendaItems = this.#agenda.map((a) => a.agenda);
    const agendaChanged = props.agenda !== undefined && props.agenda.some((a) => !currentAgendaItems.includes(a.agenda));

    const needsExternalSync =
      (props.summary !== undefined && props.summary !== this.#summary) ||
      agendaChanged ||
      (props.description !== undefined && props.description !== this.#description) ||
      (props.startTime !== undefined && props.startTime.getTime() !== this.#startTime.getTime()) ||
      (props.endTime !== undefined && props.endTime.getTime() !== this.#endTime.getTime()) ||
      (props.location !== undefined && props.location !== this.#location) ||
      attendeesChanged;

    if (props.summary !== undefined) this.#summary = props.summary;
    if (props.agenda !== undefined) this.#agenda = props.agenda;
    if (props.description !== undefined) this.#description = props.description;
    if (props.startTime !== undefined) this.#startTime = props.startTime;
    if (props.endTime !== undefined) this.#endTime = props.endTime;
    if (props.status !== undefined) this.#status = props.status;
    if (props.location !== undefined) this.#location = props.location;
    if (props.attendees !== undefined) this.#attendees = props.attendees;
    if (props.outcomes !== undefined) this.#outcomes = props.outcomes;
    this.touch();
    return needsExternalSync;
  }

  cancel(): void {
    this.#status = 'cancelled';
    this.touch();
  }

  linkExternalEvent(extMeetingId: string, meetLink: string | undefined, calendarLink: string | undefined): void {
    this.#extMeetingId = extMeetingId;
    this.#meetLink = meetLink;
    this.#calendarLink = calendarLink;
    this.touch();
  }

  applyFathomData(data: FathomMeetingData): void {
    this.#recordingUrl = data.recordingUrl ?? this.#recordingUrl;
    this.#meetingNotes = data.meetingNotes ?? this.#meetingNotes;
    this.#meetingTranscript = data.meetingTranscript ?? this.#meetingTranscript;
    this.#meetingActionItems = data.meetingActionItems ?? this.#meetingActionItems;
    this.touch();
  }

  get summary(): string { return this.#summary; }
  get type(): MeetingType { return this.#type; }
  get status(): string { return this.#status; }
  get startTime(): Date { return this.#startTime; }
  get endTime(): Date { return this.#endTime; }
  get description(): string | undefined { return this.#description; }
  get agenda(): MeetingAgendaItem[] { return [...this.#agenda]; }
  get outcomes(): string | undefined { return this.#outcomes; }
  get location(): string | undefined { return this.#location; }
  get attendees(): MeetingParticipant[] { return [...this.#attendees]; }
  get hostEmail(): string | undefined { return this.#hostEmail; }
  get createdById(): string | undefined { return this.#createdById; }
  get extMeetingId(): string | undefined { return this.#extMeetingId; }
  get meetLink(): string | undefined { return this.#meetLink; }
  get calendarLink(): string | undefined { return this.#calendarLink; }
  get recordingUrl(): string | undefined { return this.#recordingUrl; }
  get meetingNotes(): string | undefined { return this.#meetingNotes; }
  get meetingTranscript(): string | undefined { return this.#meetingTranscript; }
  get meetingActionItems(): string | undefined { return this.#meetingActionItems; }
}
