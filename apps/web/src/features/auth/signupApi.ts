import { ApiRequestError, apiRequest } from '../../lib/api-client';
import type { SignupFormValues } from './signupSchema';

export type SignupAccount = {
  user: { id: string; email: string; name: string | null };
  hasWedding: boolean;
};

type SignupEnvelope = { data: SignupAccount };

export const isSignupDemoMode = process.env.AUTH_DEMO_MODE === 'true';
const duplicateEmailForDemo = 'existing@example.com';

export async function createAccount(
  values: SignupFormValues,
): Promise<{ account: SignupAccount; mode: 'demo' | 'api' }> {
  if (isSignupDemoMode) {
    return { account: await simulateSignup(values), mode: 'demo' };
  }

  const response = await apiRequest<SignupEnvelope>('auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: values.name,
      email: values.email,
      password: values.password,
    }),
  });

  return { account: response.data, mode: 'api' };
}

async function simulateSignup(values: SignupFormValues): Promise<SignupAccount> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (values.email.toLowerCase() === duplicateEmailForDemo) {
    throw new ApiRequestError(
      'An account with this email already exists.',
      409,
      'EMAIL_ALREADY_EXISTS',
    );
  }

  return {
    user: { id: 'demo-user', email: values.email, name: values.name },
    hasWedding: false,
  };
}
