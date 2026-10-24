import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SignupPage } from '../src/features/auth/SignupPage';
import { AppProviders } from '../src/app/providers';
import { queryClient } from '../src/app/providers';

describe('SignupPage', () => {
  beforeEach(() => queryClient.clear());

  it('renders name, email, password, and confirm-password fields', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AppProviders>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/wedding/setup" element={<h1>Protected wedding setup</h1>} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('shows field errors when required values are missing', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppProviders>
          <SignupPage />
        </AppProviders>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
  });

  it('shows an error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppProviders>
          <SignupPage />
        </AppProviders>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Name'), 'Aisha Rao');
    await user.type(screen.getByLabelText('Email address'), 'aisha@example.com');
    await user.type(screen.getByLabelText('Password'), 'example-password');
    await user.type(screen.getByLabelText('Confirm password'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('rejects a malformed email address', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppProviders>
          <SignupPage />
        </AppProviders>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Name'), 'Aisha Rao');
    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'example-password');
    await user.type(screen.getByLabelText('Confirm password'), 'example-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('sends the validated name, email, and password to the backend and navigates to wedding setup', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AppProviders>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/wedding/setup" element={<h1>Protected wedding setup</h1>} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Name'), '  Aisha Rao  ');
    await user.type(screen.getByLabelText('Email address'), '  Aisha@example.com  ');
    await user.type(screen.getByLabelText('Password'), 'example-password');
    await user.type(screen.getByLabelText('Confirm password'), 'example-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Protected wedding setup' }),
    ).toBeInTheDocument();
    const signupRequest = jest
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/auth/signup'));
    expect(JSON.parse(String(signupRequest?.[1]?.body))).toEqual({
      name: 'Aisha Rao',
      email: 'Aisha@example.com',
      password: 'example-password',
    });
  });

  it('shows a duplicate-email response from the backend', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppProviders>
          <SignupPage />
        </AppProviders>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Name'), 'Aisha Rao');
    await user.type(screen.getByLabelText('Email address'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'example-password');
    await user.type(screen.getByLabelText('Confirm password'), 'example-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
  });

  it('can show and hide the password', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppProviders>
          <SignupPage />
        </AppProviders>
      </MemoryRouter>,
    );

    const password = screen.getByLabelText('Password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
