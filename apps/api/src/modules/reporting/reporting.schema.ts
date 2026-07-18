import { z } from 'zod';

const ReportDefinitionItemSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  approverRoles: z.array(z.string()).default([]),
  visibleToRoles: z.array(z.string()).default([]),
});

export const ReportDefinitionsPayloadSchema = z.object({
  items: z.array(ReportDefinitionItemSchema).min(1),
});

export type ReportDefinitionsPayload = z.infer<typeof ReportDefinitionsPayloadSchema>;
