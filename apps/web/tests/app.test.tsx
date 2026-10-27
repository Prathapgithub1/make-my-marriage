import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { AppRouter } from '../src/app/router';
import { AppProviders, queryClient } from '../src/app/providers';
import { ErrorBoundary } from '../src/app/ErrorBoundary';

function BuggyComponent(): ReactElement {
  throw new Error('Test crash in child component');
}

describe('App', () => {
  beforeEach(() => {
    queryClient.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders the public wedding-planning homepage', () => {
    render(
      <ErrorBoundary>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: /one place for every part of your wedding/i }),
    ).toBeInTheDocument();
  });

  it('renders the not-found 404 page for unmatched routes', () => {
    window.history.replaceState({}, '', '/unknown-url-path');

    render(
      <ErrorBoundary>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: /looking for a different celebration/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to home/i })).toBeInTheDocument();
  });

  it('catches runtime errors gracefully via ErrorBoundary', () => {
    // Suppress console.error in test output for intentional throw
    const originalConsoleError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/test crash in child component/i)).toBeInTheDocument();

    console.error = originalConsoleError;
  });
});
