import { z } from 'zod';

const KeyValueOptionSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const ProjectReferenceDataPayloadSchema = z
  .object({ items: z.array(KeyValueOptionSchema).min(1) })
  .passthrough();

export type ProjectReferenceDataPayload = z.infer<typeof ProjectReferenceDataPayloadSchema>;
