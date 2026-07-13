import { Inject, Injectable, Logger } from '@nestjs/common';
import { TokenVaultFacade, TOKEN_VAULT_FACADE } from '@ce/nestjs-shared-token-vault';
import { GOOGLE_SCOPES } from '@ce/nestjs-shared-token-vault';
import { IEmailSenderPort, EmailMessage } from '../../domain/ports/email-sender.port';
import { GmailEmailAdapter } from './gmail-email.adapter';
import { SmtpEmailAdapter } from './smtp-email.adapter';

/**
 * Primary port implementation.
 * Tries Gmail first (via token-vault). If the token is unavailable or
 * Gmail send fails, falls back to SMTP (Nodemailer).
 */
@Injectable()
export class FallbackEmailAdapter implements IEmailSenderPort {
  private readonly logger = new Logger(FallbackEmailAdapter.name);

  constructor(
    @Inject(TOKEN_VAULT_FACADE)
    private readonly tokenVault: TokenVaultFacade,
    private readonly gmailAdapter: GmailEmailAdapter,
    private readonly smtpAdapter: SmtpEmailAdapter,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    let tokenAvailable = false;
    try {
      await this.tokenVault.getAccessToken({
        provider: 'google',
        scope: GOOGLE_SCOPES.gmailSend,
      });
      tokenAvailable = true;
    } catch {
      this.logger.warn('Gmail token unavailable — falling back to SMTP.');
    }

    if (tokenAvailable) {
      try {
        await this.gmailAdapter.send(message);
        return;
      } catch (err) {
        this.logger.error(
          `Gmail send failed — falling back to SMTP. reason=${(err as Error).message}`,
        );
      }
    }

    await this.smtpAdapter.send(message);
  }
}
