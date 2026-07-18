import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Configkey } from '../../../../shared/config-keys';

const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

/**
 * Verifies Fathom's Svix-style webhook signature (webhook-id / webhook-timestamp /
 * webhook-signature headers). Requires `app.enableRawBody` (or equivalent) so that
 * `request.rawBody` is populated — not enabled by default in main.ts today.
 */
@Injectable()
export class FathomWebhookGuard implements CanActivate {
  private readonly logger = new Logger(FathomWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const webhookId = request.headers['webhook-id'];
    const webhookTimestamp = request.headers['webhook-timestamp'];
    const webhookSignature = request.headers['webhook-signature'];

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      this.logger.warn('Missing required Fathom webhook headers');
      throw new UnauthorizedException('Missing required headers');
    }

    const timestamp = parseInt(webhookTimestamp as string, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTimestamp - timestamp) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) {
      this.logger.warn(`Webhook timestamp out of acceptable range. TS: ${timestamp}, Current: ${currentTimestamp}`);
      throw new UnauthorizedException('Timestamp validation failed');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('Raw body is not available on the request. Enable rawBody capture in main.ts.');
      throw new UnauthorizedException('Raw body missing');
    }

    const secret = this.configService.get<string>(Configkey.FATHOM_WEBHOOK_SECRET);
    if (!secret) {
      this.logger.error('FATHOM_WEBHOOK_SECRET is not configured');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    try {
      const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody.toString()}`;

      const secretBytes = secret.startsWith('whsec_')
        ? Buffer.from(secret.split('_')[1], 'base64')
        : Buffer.from(secret, 'base64');

      const expectedSignature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

      const signatures = (webhookSignature as string).split(' ').map((sig) => {
        const parts = sig.split(',');
        return parts.length > 1 ? parts[1] : parts[0];
      });

      const isValid = signatures.some((sig) => {
        try {
          const sigBuffer = Buffer.from(sig);
          const expectedBuffer = Buffer.from(expectedSignature);
          if (sigBuffer.length !== expectedBuffer.length) return false;
          return crypto.timingSafeEqual(expectedBuffer, sigBuffer);
        } catch {
          return false;
        }
      });

      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
        throw new UnauthorizedException('Invalid signature');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Error verifying webhook signature: ${(error as Error).message}`);
      throw new UnauthorizedException('Signature verification failed');
    }
  }
}
