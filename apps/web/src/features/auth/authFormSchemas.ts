import { email, object, string } from 'zod/v4';
import type { infer as Infer } from 'zod/v4';

export const loginFormSchema = object({
  email: string().trim().pipe(email('Enter a valid email address.')),
  password: string().min(1, 'Enter your password.'),
});

export const forgotPasswordFormSchema = object({
  email: string().trim().pipe(email('Enter a valid email address.')),
});

export const resetPasswordFormSchema = object({
  password: string()
    .min(12, 'Use at least 12 characters.')
    .max(128, 'Use 128 characters or fewer.'),
  confirmPassword: string().min(1, 'Confirm your password.'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

export type LoginFormValues = Infer<typeof loginFormSchema>;
export type ForgotPasswordFormValues = Infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = Infer<typeof resetPasswordFormSchema>;
