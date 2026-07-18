import { z } from 'zod';

const KeyValueOptionSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

/** Payload shape for finance-reference-data documents stored in json-store. */
export const FinanceReferenceDataPayloadSchema = z
  .object({
    items: z.array(KeyValueOptionSchema).min(1),
  })
  .passthrough();

export type FinanceReferenceDataPayload = z.infer<typeof FinanceReferenceDataPayloadSchema>;
