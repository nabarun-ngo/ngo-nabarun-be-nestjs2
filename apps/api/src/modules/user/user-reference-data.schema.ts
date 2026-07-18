import { z } from 'zod';

const KeyValueOptionSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  countryCode: z.string().optional(),
  stateCode: z.string().optional(),
});

/** Payload shape for user-reference-data documents stored in json-store. */
export const UserReferenceDataPayloadSchema = z
  .object({
    items: z.array(KeyValueOptionSchema).min(1),
  })
  .passthrough();

export type UserReferenceDataPayload = z.infer<typeof UserReferenceDataPayloadSchema>;
