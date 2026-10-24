import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '../../lib/api-client';
import { requestPasswordReset } from './authApi';
import { AuthPageLayout } from './AuthPageLayout';
import { forgotPasswordFormSchema } from './authFormSchemas';
import type { ForgotPasswordFormValues } from './authFormSchemas';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const submit: SubmitHandler<ForgotPasswordFormValues> = async ({ email }) => {
    setMessage('');
    setError('');
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : 'We could not process your request. Please try again.',
      );
    }
  };

  return (
    <AuthPageLayout
      id="forgot-password-main"
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="We'll send instructions if an account matches."
      intro="Use the email address connected to your account. For privacy, we show the same confirmation whether or not an account exists. Your password is not changed until you use a valid reset link."
      footer={
        <>
          Remembered your password?{' '}
          <Link className="font-semibold text-primary" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        {message && (
          <p
            aria-live="polite"
            className="rounded-lg border border-[#c9d4c2] bg-[#eef2e9] px-4 py-3 text-sm leading-6 text-sage"
            role="status"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            aria-live="polite"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        <div>
          <label className="block text-[13px] font-semibold text-ink" htmlFor="forgot-email">
            Email address
          </label>
          <input
            {...register('email')}
            aria-describedby={errors.email ? 'forgot-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={`mt-1.5 block min-h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.email ? 'border-red-700' : 'border-outline'}`}
            id="forgot-email"
            type="email"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-700" id="forgot-email-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <button
          className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Sending...' : 'Send reset instructions'}
        </button>
      </form>
    </AuthPageLayout>
  );
}
