export interface EmailDispatchInput {
  templateKey: string;
  templateData?: Record<string, any>;
  subject?: string;
  to: string[];
  cc?: string[];
}

export const IEmailDispatchPort = Symbol('IEmailDispatchPort');

export interface IEmailDispatchPort {
  sendFromTemplate(input: EmailDispatchInput): Promise<void>;
}
