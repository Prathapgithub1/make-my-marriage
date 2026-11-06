import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { ForgotPasswordPage } from '../src/features/auth/ForgotPasswordPage';
import { LoginPage } from '../src/features/auth/LoginPage';
import { ProtectedRoute } from '../src/features/auth/ProtectedRoute';
import { useAuth } from '../src/features/auth/AuthProvider';
import { sanitizeRedirectUrl } from '../src/lib/api-client';

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

  it('clears session and query state on logout even when signOut fails', async () => {
    function TestLogoutComponent() {
      const { session, logout } = useAuth();
      return (
        <div>
          <span>{session ? `Logged in: ${session.user.email}` : 'Logged out'}</span>
          <button type="button" onClick={() => void logout()}>
            Do Logout
          </button>
        </div>
      );
    }

    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'user-1', email: 'test@example.com', name: 'Tester' },
      hasWedding: false,
      membership: null,
      wedding: null,
    });

    const fetchMock = jest.mocked(fetch);
    const originalImplementation = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/logout')) {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            error: {
              code: 'CSRF_REJECTED',
              message: 'Request could not be verified. Refresh the page and try again.',
            },
          }),
        } as Response;
      }
      return originalImplementation
        ? originalImplementation(input, init)
        : ({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    const user = userEvent.setup();
    renderPage(<TestLogoutComponent />);
    expect(screen.getByText('Logged in: test@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Do Logout' }));

    expect(await screen.findByText('Logged out')).toBeInTheDocument();
    expect(queryClient.getQueryData(['auth', 'me'])).toBeNull();

    if (originalImplementation) {
      fetchMock.mockImplementation(originalImplementation);
    }
  });

  describe('open redirect protection (CWE-601)', () => {
    it('sanitizes redirect URLs to permit only safe relative paths', () => {
      // Safe relative paths
      expect(sanitizeRedirectUrl('/dashboard')).toBe('/dashboard');
      expect(sanitizeRedirectUrl('/wedding/setup')).toBe('/wedding/setup');
      expect(sanitizeRedirectUrl('/invitations/members/sample-token')).toBe(
        '/invitations/members/sample-token',
      );
      expect(sanitizeRedirectUrl('  /settings/members  ')).toBe('/settings/members');

      // Malicious external and protocol-relative targets
      expect(sanitizeRedirectUrl('https://evil.com')).toBeNull();
      expect(sanitizeRedirectUrl('http://attacker.com/steal')).toBeNull();
      expect(sanitizeRedirectUrl('//evil.com')).toBeNull();
      expect(sanitizeRedirectUrl('/\\evil.com')).toBeNull();
      expect(sanitizeRedirectUrl('/path\\evil.com')).toBeNull();
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeRedirectUrl('')).toBeNull();
      expect(sanitizeRedirectUrl(null)).toBeNull();
      expect(sanitizeRedirectUrl(undefined)).toBeNull();
    });

    it('ignores malicious redirect params in LoginPage and falls back safely', async () => {
      render(
        <MemoryRouter initialEntries={['/login?redirect=https://evil.com&email=test@example.com']}>
          <AppProviders>
            <LoginPage />
          </AppProviders>
        </MemoryRouter>,
      );

      // Verify email was prefilled safely
      const emailInput = screen.getByLabelText(/Email address/i) as HTMLInputElement;
      expect(emailInput.value).toBe('test@example.com');

      // The create account link should NOT forward the malicious redirect target
      const createAccountLink = screen.getByRole('link', { name: /Create an account/i });
      expect(createAccountLink.getAttribute('href')).not.toContain('evil.com');
      expect(createAccountLink.getAttribute('href')).toContain('/signup?email=test%40example.com');
    });
  });
});
