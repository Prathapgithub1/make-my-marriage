import { email, object, string } from 'zod/v4';
import type { infer as Infer } from 'zod/v4';

export const signupSchema = object({
  name: string().trim().min(1, 'Enter your name.').max(120, 'Use 120 characters or fewer.'),
  email: string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(email('Enter a valid email address.')),
  password: string()
    .min(12, 'Use at least 12 characters.')
    .max(128, 'Use 128 characters or fewer.'),
  confirmPassword: string().min(1, 'Confirm your password.'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

export type SignupFormValues = Infer<typeof signupSchema>;
