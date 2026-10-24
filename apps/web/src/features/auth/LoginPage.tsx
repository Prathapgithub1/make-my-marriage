import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '../../lib/api-client';
import { signIn } from './authApi';
import { AuthPageLayout } from './AuthPageLayout';
import { loginFormSchema } from './authFormSchemas';
import type { LoginFormValues } from './authFormSchemas';

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-outline bg-white px-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';

export function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const passwordResetSuccess = searchParams.get('passwordReset') === '1';
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const submit: SubmitHandler<LoginFormValues> = async ({ email, password }) => {
    setServerError('');
    try {
      const account = await signIn(email, password);
      queryClient.setQueryData(['auth', 'me'], {
        user: account.user,
        hasWedding: account.hasWedding,
        membership: null,
        wedding: null,
      });
      navigate(account.hasWedding ? '/dashboard' : '/wedding/setup', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'VALIDATION_ERROR') {
        setError('email', { type: 'server', message: error.message });
      } else {
        setServerError(
          error instanceof ApiRequestError
            ? error.message
            : 'We could not sign you in. Please try again.',
        );
      }
    }
  };

  return (
    <AuthPageLayout
      id="login-main"
      eyebrow="Serene wedding planning"
      title="Welcome back"
      subtitle="Sign in to continue planning your wedding."
      intro="Sign in to continue organizing your wedding, managing the details, and keeping everything connected."
      footer={
        <>
          New to Make My Marriage?{' '}
          <Link className="font-semibold text-primary" to="/signup">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        {passwordResetSuccess && !serverError && (
          <p
            aria-live="polite"
            className="rounded-lg border border-[#c9d4c2] bg-[#eef2e9] px-4 py-3 text-sm leading-6 text-sage"
            role="status"
          >
            Your password has been reset. Sign in with your new password.
          </p>
        )}
        {serverError && (
          <div
            aria-live="polite"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{serverError}</p>
          </div>
        )}
        <FormField id="login-email" label="Email address" error={errors.email?.message}>
          <input
            {...register('email')}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={inputClass}
            id="login-email"
            type="email"
          />
        </FormField>
        <FormField id="login-password" label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register('password')}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              className={`${inputClass} pr-20`}
              id="login-password"
              type={passwordVisible ? 'text' : 'password'}
            />
            <button
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              className="absolute inset-y-2 right-2 rounded-md px-3 text-sm font-medium text-primary"
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              {passwordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        </FormField>
        <div className="-mt-2 text-right">
          <Link className="text-sm font-medium text-primary hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <button
          className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-xs leading-5 text-muted">
          Protected by a server-managed session. Your password is never stored in this browser.
        </p>
      </form>
    </AuthPageLayout>
  );
}

function FormField({
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
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-700" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
