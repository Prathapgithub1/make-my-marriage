import { z } from 'zod';

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
] as const;

export const ACCEPTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/mpeg',
] as const;

export const ACCEPTED_MIME_TYPES = [
  ...ACCEPTED_IMAGE_MIME_TYPES,
  ...ACCEPTED_VIDEO_MIME_TYPES,
] as const;

export const createAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Album name is required.').max(160, 'Album name cannot exceed 160 characters.'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters.').optional(),
  eventId: z.string().uuid('Invalid event ID format.').optional(),
  coverImageKey: z.string().max(1024).optional(),
});

export const updateAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Album name is required.').max(160, 'Album name cannot exceed 160 characters.').optional(),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters.').nullable().optional(),
  eventId: z.string().uuid('Invalid event ID format.').nullable().optional(),
  coverImageKey: z.string().max(1024).nullable().optional(),
});

export const requestUploadUrlSchema = z.object({
  originalFileName: z.string().trim().min(1, 'File name is required.').max(255, 'File name cannot exceed 255 characters.'),
  mimeType: z.string().trim().refine(
    (val) => (ACCEPTED_MIME_TYPES as readonly string[]).includes(val.toLowerCase()),
    { message: 'Unsupported file type. Please upload JPEG, PNG, WebP, MP4, MOV, or WebM media.' },
  ),
  sizeBytes: z.coerce.number().int().positive('File size must be greater than 0 bytes.').max(
    104857600, // 100MB
    'File size exceeds the 100MB limit.',
  ),
  albumId: z.string().uuid('Invalid album ID format.').optional(),
  eventId: z.string().uuid('Invalid event ID format.').optional(),
  caption: z.string().trim().max(500, 'Caption cannot exceed 500 characters.').optional(),
});

export const confirmUploadSchema = z.object({
  mediaId: z.string().uuid('Invalid media ID format.'),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().optional(),
});

export const updateMediaSchema = z.object({
  caption: z.string().trim().max(500, 'Caption cannot exceed 500 characters.').nullable().optional(),
  albumId: z.string().uuid('Invalid album ID format.').nullable().optional(),
  eventId: z.string().uuid('Invalid event ID format.').nullable().optional(),
});

export const listMediaQuerySchema = z.object({
  albumId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const albumIdParamSchema = z.object({
  albumId: z.string().uuid('Invalid album ID format.'),
});

export const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid('Invalid media ID format.'),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;
