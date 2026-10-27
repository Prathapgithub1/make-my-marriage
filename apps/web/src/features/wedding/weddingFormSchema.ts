import { object, string } from 'zod/v4';
import type { infer as Infer } from 'zod/v4';

export const weddingSetupSchema = object({
  title: string()
    .trim()
    .min(2, 'Please enter a wedding name (at least 2 characters)')
    .max(160, 'Wedding name cannot exceed 160 characters'),
  brideName: string()
    .trim()
    .min(1, 'Please enter Partner 1 name')
    .max(120, 'Name cannot exceed 120 characters'),
  groomName: string()
    .trim()
    .min(1, 'Please enter Partner 2 name')
    .max(120, 'Name cannot exceed 120 characters'),
  weddingDate: string()
    .trim()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Please enter a valid wedding date',
    }),
  location: string().trim().max(255).optional(),
  city: string().trim().max(120).optional(),
  state: string().trim().max(120).optional(),
  country: string().trim().max(120).optional(),
  description: string().trim().max(2000).optional(),
});

export type WeddingSetupFormValues = Infer<typeof weddingSetupSchema>;
