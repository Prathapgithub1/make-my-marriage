import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '../../lib/api-client';
import { resetPassword } from './authApi';
import { AuthPageLayout } from './AuthPageLayout';
import { resetPasswordFormSchema } from './authFormSchemas';
import type { ResetPasswordFormValues } from './authFormSchemas';

function readResetToken() {
  const fragment = window.location.hash.slice(1);
  const token = new URLSearchParams(fragment).get('token') ?? '';
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  return token;
}

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-outline bg-white px-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';

export function ResetPasswordPage() {
  const [token] = useState(readResetToken);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onBlur',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const submit: SubmitHandler<ResetPasswordFormValues> = async ({ password }) => {
    setServerError('');
    try {
      await resetPassword(token, password);
      navigate('/login?passwordReset=1', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiRequestError
          ? error.message
          : 'We could not reset your password. Please request a new link.',
      );
    }
  };

  return (
    <AuthPageLayout
      id="reset-password-main"
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Use at least 12 characters."
      intro="Your reset link is private to you and expires after 30 minutes."
      footer={
        <>
          Need a new link?{' '}
          <Link className="font-semibold text-primary" to="/forgot-password">
            Request another reset
          </Link>
        </>
      }
    >
      {!token ? (
        <p
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          This reset link is missing or invalid. Request a new one to continue.
        </p>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          {serverError && (
            <p
              aria-live="polite"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {serverError}
            </p>
          )}
          <Field id="reset-password" label="New password" error={errors.password?.message}>
            <input
              {...register('password')}
              aria-describedby={errors.password ? 'reset-password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete="new-password"
              className={inputClass}
              id="reset-password"
              type="password"
            />
          </Field>
          <Field
            id="reset-confirm-password"
            label="Confirm new password"
            error={errors.confirmPassword?.message}
          >
            <input
              {...register('confirmPassword')}
              aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
              aria-invalid={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              className={inputClass}
              id="reset-confirm-password"
              type="password"
            />
          </Field>
          <button
            className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthPageLayout>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-700" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
