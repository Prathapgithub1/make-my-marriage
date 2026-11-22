import { z } from 'zod';

export const createWeddingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Wedding name must be at least 2 characters')
    .max(160, 'Wedding name cannot exceed 160 characters'),
  brideName: z
    .string()
    .trim()
    .min(1, 'Partner 1 name is required')
    .max(120, 'Partner 1 name cannot exceed 120 characters'),
  groomName: z
    .string()
    .trim()
    .min(1, 'Partner 2 name is required')
    .max(120, 'Partner 2 name cannot exceed 120 characters'),
  weddingDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Enter a valid wedding date',
    }),
  location: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  coverImageKey: z.string().trim().max(1024).optional().nullable(),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = createWeddingSchema.partial();
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;

export const coverUploadUrlSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[\w\-.\s]+$/, 'Invalid file name characters'),
  contentType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
      {
        message: 'Unsupported image format. Allowed formats: JPEG, PNG, WebP',
      },
    ),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(15 * 1024 * 1024, 'Cover image file size cannot exceed 15MB'),
});

export type CoverUploadUrlInput = z.infer<typeof coverUploadUrlSchema>;
