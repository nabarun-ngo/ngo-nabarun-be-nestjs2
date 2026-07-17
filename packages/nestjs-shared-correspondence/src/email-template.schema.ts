import { z } from 'zod';

/** Payload shape for correspondence email templates stored in json-store. */
export const EmailTemplatePayloadSchema = z.object({
  subject: z.string().min(1),
  htmlTemplate: z.string().min(1),
  textTemplate: z.string().optional(),
  defaultData: z.record(z.string(), z.unknown()).optional(),
});

export type EmailTemplatePayload = z.infer<typeof EmailTemplatePayloadSchema>;
