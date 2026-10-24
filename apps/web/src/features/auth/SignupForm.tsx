import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { ApiRequestError } from '../../lib/api-client';
import { createAccount, isSignupDemoMode } from './signupApi';
import { signupSchema } from './signupSchema';
import type { SignupFormValues } from './signupSchema';

const inputClasses =
  'mt-1.5 block min-h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-[#8c8e87] focus:border-primary focus:ring-4 focus:ring-primary/10';

export function SignupForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const submitSignup: SubmitHandler<SignupFormValues> = async (values) => {
    setFeedback(null);

    try {
      const { account, mode } = await createAccount(values);
      if (mode === 'api') {
        queryClient.setQueryData(['auth', 'me'], {
          user: account.user,
          hasWedding: account.hasWedding,
          membership: null,
          wedding: null,
        });
        navigate(account.hasWedding ? '/dashboard' : '/wedding/setup', { replace: true });
        return;
      }
      reset({ name: values.name, email: account.user.email, password: '', confirmPassword: '' });
      setFeedback({
        kind: 'success',
        message:
          mode === 'demo'
            ? 'Demo response only. Account creation will be available when the backend is connected; nothing was created or saved.'
            : `Account created for ${account.user.email}. Your wedding workspace setup is next.`,
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
        return;
      }

      setFeedback({
        kind: 'error',
        message:
          error instanceof ApiRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'We could not create your account right now. Please try again.',
      });
    }
  };

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(submitSignup)}>
      {feedback && (
        <p
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm leading-6 ${
            feedback.kind === 'error'
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-[#c9d4c2] bg-[#eef2e9] text-sage'
          }`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}

      <div>
        <label className="block text-[13px] font-semibold text-ink" htmlFor="signup-name">
          Name
        </label>
        <input
          {...register('name', { onChange: () => setFeedback(null) })}
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className={`${inputClasses} ${errors.name ? 'border-red-700' : 'border-outline'}`}
          id="signup-name"
          maxLength={120}
          placeholder="Your name"
          type="text"
        />
        {errors.name && <FieldError id="signup-name-error">{errors.name.message}</FieldError>}
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink" htmlFor="signup-email">
          Email address
        </label>
        <input
          {...register('email', { onChange: () => setFeedback(null) })}
          aria-describedby={errors.email ? 'signup-email-error' : 'signup-email-hint'}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={`${inputClasses} ${errors.email ? 'border-red-700' : 'border-outline'}`}
          id="signup-email"
          placeholder="you@example.com"
          type="email"
        />
        {errors.email ? (
          <FieldError id="signup-email-error">{errors.email.message}</FieldError>
        ) : (
          <p className="mt-1.5 text-[11px] leading-4 text-muted" id="signup-email-hint">
            {isSignupDemoMode
              ? 'Demo: use existing@example.com to preview the duplicate-email response.'
              : 'We’ll use this email for your account.'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink" htmlFor="signup-password">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', { onChange: () => setFeedback(null) })}
            aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-hint'}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            className={`${inputClasses} pr-16 ${errors.password ? 'border-red-700' : 'border-outline'}`}
            id="signup-password"
            type={passwordVisible ? 'text' : 'password'}
          />
          <button
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            className="absolute inset-y-2 right-2 rounded-md px-3 text-sm font-medium text-primary hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password ? (
          <FieldError id="signup-password-error">{errors.password.message}</FieldError>
        ) : (
          <p className="mt-1.5 text-[11px] leading-4 text-muted" id="signup-password-hint">
            Use at least 12 characters. No character-composition rules are required.
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-[13px] font-semibold text-ink"
          htmlFor="signup-confirm-password"
        >
          Confirm password
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword', { onChange: () => setFeedback(null) })}
            aria-describedby={errors.confirmPassword ? 'signup-confirm-password-error' : undefined}
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            className={`${inputClasses} pr-16 ${errors.confirmPassword ? 'border-red-700' : 'border-outline'}`}
            id="signup-confirm-password"
            type={passwordVisible ? 'text' : 'password'}
          />
        </div>
        {errors.confirmPassword && (
          <FieldError id="signup-confirm-password-error">
            {errors.confirmPassword.message}
          </FieldError>
        )}
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-[11px] leading-4 text-muted">
        {isSignupDemoMode
          ? 'Demo mode: the form uses a local mock response. No account or password is stored.'
          : 'Your password is sent only to the configured API over this request.'}
      </p>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: string | undefined }) {
  return (
    <p className="mt-1.5 text-sm text-red-700" id={id} role="alert">
      {children}
    </p>
  );
}
