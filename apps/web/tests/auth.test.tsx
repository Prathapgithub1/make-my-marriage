import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { ForgotPasswordPage } from '../src/features/auth/ForgotPasswordPage';
import { LoginPage } from '../src/features/auth/LoginPage';
import { ProtectedRoute } from '../src/features/auth/ProtectedRoute';

function renderPage(page: ReactNode) {
  return render(
    <MemoryRouter>
      <AppProviders>{page}</AppProviders>
    </MemoryRouter>,
  );
}

describe('authentication screens', () => {
  beforeEach(() => queryClient.clear());

  it('validates login fields accessibly before sending a request', async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });

  it('shows invalid credentials returned by the API', async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />);
    await user.type(screen.getByLabelText('Email address'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'incorrect-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('signs in through the API and redirects to the protected wedding setup page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppProviders>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/wedding/setup"
              element={
                <ProtectedRoute requireWedding={false}>
                  <h1>Protected wedding setup</h1>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Email address'), 'aisha@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Protected wedding setup' }),
    ).toBeInTheDocument();
    const loginRequest = jest
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/auth/login'));
    expect(JSON.parse(String(loginRequest?.[1]?.body))).toEqual({
      email: 'aisha@example.com',
      password: 'correct-password',
    });
  });

  it('validates forgot-password email input', async () => {
    const user = userEvent.setup();
    renderPage(<ForgotPasswordPage />);
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('shows an API error when reset email is not configured', async () => {
    const user = userEvent.setup();
    renderPage(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText('Email address'), 'unconfigured@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));
    expect(
      await screen.findByText(
        'Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the API .env file, then restart the backend.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor away from protected pages', async () => {
    queryClient.clear();
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AppProviders>
          <Routes>
            <Route
              path="/private"
              element={
                <ProtectedRoute>
                  <h1>Private workspace</h1>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<h1>Sign in required</h1>} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sign in required')).toBeInTheDocument();
    expect(screen.queryByText('Private workspace')).not.toBeInTheDocument();
  });
});
