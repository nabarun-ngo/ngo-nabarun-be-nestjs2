import { z } from 'zod';
import { QueueOptionsSchema } from '@ce/nestjs-shared-queue';

export const Correspondence2OptionsSchema = z.object({
  appName: z.string().optional(),
  environment: z.string(),
  email: z
    .object({
      fromName: z.string().optional(),
      fromAddress: z.string().email().optional(),
      enableProdMode: z.coerce.boolean().default(false),
      enableMocking: z.coerce.boolean().default(false),
      mockedAddress: z.string().email().optional(),
      smtp: z
        .object({
          host: z.string(),
          port: z.coerce.number().default(587),
          secure: z.coerce.boolean().default(false),
          user: z.string().optional(),
          password: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  push: z
    .object({
      oneSignal: z
        .object({
          appId: z.string(),
          apiKey: z.string(),
        })
        .optional(),
    })
    .optional(),
  retention: z
    .object({
      /** Days after which old notifications are deleted. Default 90 */
      notificationRetentionDays: z.coerce.number().default(90),
      /** Days after which inactive subscriptions are purged. Default 180 */
      inactiveSubscriptionRetentionDays: z.coerce.number().default(180),
    })
    .optional(),
  /** BullMQ connection used for async dispatch and retention jobs. */
  queue: QueueOptionsSchema,
});
