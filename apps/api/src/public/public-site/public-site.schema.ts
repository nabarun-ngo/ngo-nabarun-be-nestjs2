import { z } from 'zod';

export const PublicSiteDynamicContentSchema = z.object({
  team: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      picture: z.string(),
      roleString: z.string(),
      email: z.string(),
      bio: z.string().optional(),
      socialLinks: z
        .object({
          facebook: z.string().optional(),
          twitter: z.string().optional(),
          linkedin: z.string().optional(),
          instagram: z.string().optional(),
        })
        .optional(),
      enabled: z.boolean().optional(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.string(),
      endDate: z.string().optional(),
      location: z.string(),
      image: z.string().optional(),
      registrationUrl: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  ),
});

export const PublicSiteStaticContentSchema = z.record(z.string(), z.unknown());

export type PublicSiteDynamicContent = z.infer<typeof PublicSiteDynamicContentSchema>;
