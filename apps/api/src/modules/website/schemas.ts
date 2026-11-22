import { z } from 'zod';
import { WebsiteTheme } from '../../generated/prisma/client';

export const WEBSITE_THEMES = ['CLASSIC', 'MINIMAL', 'MODERN'] as const;

export const TEMPLATE_IDS = [
  'royal-heritage',
  'modern-minimal',
  'floral-romance',
  'bohemian-sunset',
] as const;

export const SECTION_TYPES = [
  'HERO',
  'COUPLE',
  'STORY',
  'EVENTS',
  'VENUE',
  'GALLERY',
  'FAMILY',
  'TRAVEL',
  'RSVP',
  'CONTACT',
  'FOOTER',
] as const;

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const websiteSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SECTION_TYPES),
  title: z.string().min(1).max(120),
  isEnabled: z.boolean().default(true),
  order: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()).default({}),
});

export const themePaletteSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  card: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const themeTypographySchema = z.object({
  headingFont: z.string().min(1).max(64),
  bodyFont: z.string().min(1).max(64),
  headingScale: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
});

export const themeButtonStyleSchema = z.object({
  shape: z.enum(['pill', 'soft', 'square']).default('pill'),
  variant: z.enum(['filled', 'outline', 'soft']).default('filled'),
});

export const themeCardStyleSchema = z.object({
  borderRadius: z.enum(['sm', 'md', 'lg', 'xl', 'none']).default('lg'),
  elevation: z.enum(['flat', 'raised', 'ambient']).default('ambient'),
});

export const themeCustomizationSchema = z.object({
  palette: themePaletteSchema,
  typography: themeTypographySchema,
  buttonStyle: themeButtonStyleSchema.optional(),
  cardStyle: themeCardStyleSchema.optional(),
  backgroundPattern: z.enum(['none', 'subtle-paper', 'floral-filigree', 'royal-damask']).optional(),
});

export const websiteSettingsMetaSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  tagline: z.string().max(250).optional().nullable(),
  coupleNamesOverride: z.string().max(160).optional().nullable(),
  weddingDateOverride: z.string().max(64).optional().nullable(),
  locationOverride: z.string().max(200).optional().nullable(),
  seoTitle: z.string().max(160).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  socialImageUrl: z.string().url().max(1000).optional().nullable().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PASSWORD_PROTECTED', 'UNLISTED']).default('PUBLIC'),
  password: z.string().max(64).optional().nullable(),
  allowOpenRsvp: z.boolean().default(true),
  showCountdown: z.boolean().default(true),
});

export const websiteContentSchema = z.object({
  templateId: z.enum(TEMPLATE_IDS).default('royal-heritage'),
  sections: z.array(websiteSectionSchema),
  theme: themeCustomizationSchema,
  settings: websiteSettingsMetaSchema.optional(),
});

export const updateWebsiteSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(slugRegex, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
  theme: z.enum(WEBSITE_THEMES).optional(),
  templateId: z.enum(TEMPLATE_IDS).optional(),
  isPublished: z.boolean().optional(),
  content: websiteContentSchema.partial().optional(),
});

export const applyTemplateSchema = z.object({
  templateId: z.enum(TEMPLATE_IDS),
});

export const publishWebsiteSchema = z.object({
  isPublished: z.boolean(),
});

export const publicRsvpSubmissionSchema = z.object({
  token: z.string().trim().optional(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(32).optional().nullable().or(z.literal('')),
  rsvpStatus: z.enum(['ATTENDING', 'NOT_ATTENDING']),
  attendingCount: z.coerce.number().int().min(0).max(20).default(1),
  dietaryPreferences: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  selectedEventIds: z.array(z.string().uuid()).optional(),
});

export const lookupRsvpSchema = z.object({
  token: z.string().trim().optional(),
  nameOrEmail: z.string().trim().min(2, 'Search query must be at least 2 characters').optional(),
});

export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
export type PublishWebsiteInput = z.infer<typeof publishWebsiteSchema>;
export type PublicRsvpSubmissionInput = z.infer<typeof publicRsvpSubmissionSchema>;
export type LookupRsvpInput = z.infer<typeof lookupRsvpSchema>;
export type WebsiteContent = z.infer<typeof websiteContentSchema>;
