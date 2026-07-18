import { z } from 'zod';

export const FinanceModuleOptionsSchema = z.object({
  defaultDonationAmount: z.coerce.number().positive().optional().default(500),
});

export type FinanceModuleOptions = z.infer<typeof FinanceModuleOptionsSchema>;
export type FinanceModuleInput = z.input<typeof FinanceModuleOptionsSchema>;
