import { render, screen } from '@testing-library/react';
import { App } from '../src/app/App';

describe('App', () => {
  it('renders the public wedding-planning homepage', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /one place for every part of your wedding/i }),
    ).toBeInTheDocument();
  });
});
