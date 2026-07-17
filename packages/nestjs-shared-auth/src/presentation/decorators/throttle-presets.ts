import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

function clientIp(req: Record<string, unknown>): string {
  return (req.ip as string | undefined) ?? 'unknown';
}

const publicGetTracker = (req: Record<string, unknown>) => {
  const headers = req.headers as Record<string, string | undefined>;
  const apiKey = headers['x-api-key'] ?? 'no-key';
  return `publicGet:${apiKey}:${clientIp(req)}`;
};

const publicFormPostTracker = (req: Record<string, unknown>) =>
  `publicFormPost:${clientIp(req)}`;

const publicPostGlobalTracker = (req: Record<string, unknown>) =>
  `publicPostGlobal:${clientIp(req)}`;

const newsletterTracker = (req: Record<string, unknown>) => {
  const body = req.body as { email?: string } | undefined;
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : 'no-email';
  return `newsletter:${clientIp(req)}:${email}`;
};

export const StrictThrottle = () => Throttle({ default: { limit: 5, ttl: 60_000 } });
export const DefaultThrottle = () => Throttle({ default: { limit: 30, ttl: 60_000 } });

export const PublicGetThrottle = () =>
  Throttle({
    publicGet: { limit: 60, ttl: 60_000, getTracker: publicGetTracker },
  });

export const PublicFormPostThrottle = () =>
  Throttle({
    publicFormPost: { limit: 10, ttl: 60_000, getTracker: publicFormPostTracker },
    publicPostGlobal: { limit: 100, ttl: 3_600_000, getTracker: publicPostGlobalTracker },
  });

export const NewsletterThrottle = () =>
  Throttle({
    newsletter: { limit: 3, ttl: 3_600_000, getTracker: newsletterTracker },
    publicPostGlobal: { limit: 100, ttl: 3_600_000, getTracker: publicPostGlobalTracker },
  });
