import { SetMetadata } from '@nestjs/common';

export type ThrottleTrackerStrategy =
  | 'default'
  | 'publicGet'
  | 'publicFormPost'
  | 'newsletter'
  | 'publicPostGlobal';

export const THROTTLE_TRACKER_STRATEGY_KEY = 'throttleTrackerStrategy';

export const ThrottleTracker = (strategy: ThrottleTrackerStrategy) =>
  SetMetadata(THROTTLE_TRACKER_STRATEGY_KEY, strategy);
