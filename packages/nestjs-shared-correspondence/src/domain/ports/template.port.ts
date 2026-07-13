export interface EmailTemplateData {
  subject: string;
  /** Handlebars template string for the HTML body */
  htmlTemplate: string;
  textTemplate?: string;
  defaultData?: Record<string, any>;
}

export interface ITemplatePort {
  findByKey(key: string): Promise<EmailTemplateData | null>;
}

export const TEMPLATE_PORT = Symbol('ITemplatePort');
