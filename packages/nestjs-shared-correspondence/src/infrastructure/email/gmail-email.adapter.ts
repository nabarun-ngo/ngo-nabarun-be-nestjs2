import { gmail as googleMail } from '@googleapis/gmail';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TOKEN_VAULT_FACADE, TokenVaultFacade } from '@ce/nestjs-shared-token-vault';
import { GOOGLE_SCOPES } from '@ce/nestjs-shared-token-vault';
import { OAuth2Client } from 'googleapis-common';
import { IEmailSenderPort, EmailMessage } from '../../domain/ports/email-sender.port';
import { CORRESPONDENCE2_OPTIONS } from '../../correspondence-options.token';
import type { Correspondence2ModuleOptions } from '../../correspondence.module';

@Injectable()
export class GmailEmailAdapter implements IEmailSenderPort {
  private readonly logger = new Logger(GmailEmailAdapter.name);

  constructor(
    @Inject(TOKEN_VAULT_FACADE)
    private readonly tokenVault: TokenVaultFacade,
    @Inject(CORRESPONDENCE2_OPTIONS)
    private readonly options: Correspondence2ModuleOptions,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const accessToken = await this.tokenVault.getAccessToken({
      provider: 'google',
      scope: GOOGLE_SCOPES.gmailSend,
    });

    const authClient = new OAuth2Client();
    authClient.setCredentials({ access_token: accessToken });

    const fromEmail = this.options.email?.fromAddress ?? 'noreply@example.com';
    const fromName = this.options.email?.fromName ?? this.options.appName ?? '';

    const gmail = googleMail({ version: 'v1', auth: authClient });
    const raw = this.buildRawMessage(message, fromEmail, fromName);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    this.logger.log(
      `Gmail sent messageId=${response.data.id} to=${message.to.join(', ')}`,
    );
  }

  private buildRawMessage(
    message: EmailMessage,
    fromEmail: string,
    fromName: string,
  ): string {
    const lines: string[] = [];
    lines.push(`From: "${fromName}" <${fromEmail}>`);
    lines.push(`To: ${message.to.join(', ')}`);
    if (message.cc?.length) lines.push(`Cc: ${message.cc.join(', ')}`);
    if (message.bcc?.length) lines.push(`Bcc: ${message.bcc.join(', ')}`);
    lines.push(`Subject: ${message.subject}`);
    lines.push(`Date: ${new Date().toUTCString()}`);
    lines.push('MIME-Version: 1.0');

    if (message.text) {
      const boundary = `boundary_${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('');
      lines.push(message.text);
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('');
      lines.push(message.html);
      lines.push(`--${boundary}--`);
    } else {
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('');
      lines.push(message.html);
    }

    return Buffer.from(lines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
