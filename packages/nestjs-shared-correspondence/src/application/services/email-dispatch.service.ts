import { Inject, Injectable, Optional } from '@nestjs/common';
import Handlebars from 'handlebars';
import { ITemplatePort, TEMPLATE_PORT } from '../../domain/ports/template.port';
import { IEmailSenderPort, EMAIL_SENDER_PORT, EmailMessage } from '../../domain/ports/email-sender.port';
import { TemplateNotFoundError } from '../../domain/errors/correspondence.errors';
import { IEmailDispatchPort, EmailDispatchInput } from '../ports/email-dispatch.port';

export type { EmailDispatchInput };

@Injectable()
export class EmailDispatchService implements IEmailDispatchPort {
  constructor(
    @Optional() @Inject(TEMPLATE_PORT)
    private readonly templatePort: ITemplatePort,
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: IEmailSenderPort,
  ) {}

  async sendFromTemplate(input: EmailDispatchInput): Promise<void> {
    const template = await this.templatePort.findByKey(input.templateKey);
    if (!template) {
      throw new TemplateNotFoundError(input.templateKey);
    }

    const data = { ...(template.defaultData ?? {}), ...(input.templateData ?? {}) };
    const compiledHtml = Handlebars.compile(template.htmlTemplate)(data);
    const compiledText = template.textTemplate
      ? Handlebars.compile(template.textTemplate)(data)
      : undefined;

    const message: EmailMessage = {
      to: input.to,
      cc: input.cc,
      subject: input.subject ?? template.subject,
      html: compiledHtml,
      text: compiledText,
    };

    await this.emailSender.send(message);
  }
}
