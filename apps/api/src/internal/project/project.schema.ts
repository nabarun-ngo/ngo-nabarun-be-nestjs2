import { z } from 'zod';

export const ProjectModuleOptionsSchema = z.object({}).passthrough();
export type ProjectModuleOptions = z.infer<typeof ProjectModuleOptionsSchema>;
export type ProjectModuleInput = z.input<typeof ProjectModuleOptionsSchema>;
