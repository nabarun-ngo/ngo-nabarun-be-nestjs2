import { Throttle } from '@nestjs/throttler';

export const StrictThrottle = () => Throttle({ default: { limit: 5, ttl: 60_000 } });
export const DefaultThrottle = () => Throttle({ default: { limit: 30, ttl: 60_000 } });
