import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailSenderPort, EmailMessage } from '../../domain/ports/email-sender.port';
import { CORRESPONDENCE2_OPTIONS } from '../../correspondence-options.token';
import type { Correspondence2ModuleOptions } from '../../correspondence.module';
import { EmailDeliveryFailedError } from '../../domain/errors/correspondence.errors';

@Injectable()
export class SmtpEmailAdapter implements IEmailSenderPort {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @Inject(CORRESPONDENCE2_OPTIONS)
    private readonly options: Correspondence2ModuleOptions,
  ) {}

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const smtp = this.options.email?.smtp;
      if (!smtp?.host) {
        throw new EmailDeliveryFailedError('SMTP is not configured (host is missing).');
      }
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port ?? 587,
        secure: smtp.secure ?? false,
        auth: smtp.user
          ? { user: smtp.user, pass: smtp.password }
          : undefined,
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    const fromName = this.options.email?.fromName ?? this.options.appName ?? '';
    const fromAddress = this.options.email?.fromAddress ?? this.options.email?.smtp?.user ?? 'noreply@example.com';

    const info = await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    this.logger.log(`SMTP sent messageId=${info.messageId} to=${message.to.join(', ')}`);
  }
}
