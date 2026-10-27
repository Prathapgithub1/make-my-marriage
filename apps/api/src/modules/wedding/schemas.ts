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
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = createWeddingSchema.partial();
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
