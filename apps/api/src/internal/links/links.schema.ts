import { z } from 'zod';

/** How the client should open the link (in-app viewer vs external browser/app). */
export const LINK_OPEN_TYPES = ['INTERNAL', 'EXTERNAL'] as const;
export type LinkOpenType = (typeof LINK_OPEN_TYPES)[number];

/** App-link platform/category for filtering (legacy Firebase APP_LINKS LINK_TYPE). */
export const APP_LINK_PLATFORMS = ['ANDROID_APP_LINK', 'IOS_APP_LINK', 'SUPPORT_LINK', 'SOCIAL_LINK'] as const;
export type AppLinkPlatform = (typeof APP_LINK_PLATFORMS)[number];

const tagsSchema = z.array(z.string().min(1)).optional();

const ContentLinkItemSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  linkType: z.enum(LINK_OPEN_TYPES),
  tags: tagsSchema,
  active: z.boolean().optional(),
});

const AppLinkItemSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  linkType: z.enum(LINK_OPEN_TYPES),
  platform: z.enum(APP_LINK_PLATFORMS),
  tags: tagsSchema,
  active: z.boolean().optional(),
});

export const ContentLinksPayloadSchema = z
  .object({
    items: z.array(ContentLinkItemSchema).min(1),
  })
  .passthrough();

export const AppLinksPayloadSchema = z
  .object({
    items: z.array(AppLinkItemSchema).min(1),
  })
  .passthrough();

const LinksReferenceItemSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
});

export const LinksReferenceDataPayloadSchema = z
  .object({
    items: z.array(LinksReferenceItemSchema).min(1),
  })
  .passthrough();

export const LinksPayloadSchema = z.union([ContentLinksPayloadSchema, AppLinksPayloadSchema]);

export type ContentLinksPayload = z.infer<typeof ContentLinksPayloadSchema>;
export type AppLinksPayload = z.infer<typeof AppLinksPayloadSchema>;
