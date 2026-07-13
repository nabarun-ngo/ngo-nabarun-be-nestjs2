export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailSenderPort {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_SENDER_PORT = Symbol('IEmailSenderPort');
