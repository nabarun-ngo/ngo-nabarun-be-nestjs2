import { z } from 'zod';

export const Auth2OptionsSchema = z.object({
  jwt: z.object({
    jwksUri: z.string().url(),
    issuer: z.string().min(1),
    audience: z.string().min(1),
  }),
  recaptcha: z
    .object({
      secretKey: z.string().min(1),
      minScore: z.coerce.number().min(0).max(1).optional(),
    })
    .optional(),
  apiKey: z
    .object({
      headerName: z.string().min(1).optional(),
    })
    .optional(),
  cache: z
    .object({
      userAccessTtlMs: z.coerce.number().positive().optional(),
      apiKeyTtlMs: z.coerce.number().positive().optional(),
    })
    .optional(),
});

export type Auth2ModuleOptions = z.infer<typeof Auth2OptionsSchema>;
