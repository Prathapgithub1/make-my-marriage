import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((email) => email.toLowerCase());

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: z.string().min(12).max(128),
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  newPassword: z.string().min(12).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
