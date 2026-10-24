import { render, screen } from '@testing-library/react';
import { AppRouter } from '../src/app/router';
import { AppProviders, queryClient } from '../src/app/providers';

describe('App', () => {
  beforeEach(() => {
    queryClient.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders the public wedding-planning homepage', () => {
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', { name: /one place for every part of your wedding/i }),
    ).toBeInTheDocument();
  });
});
