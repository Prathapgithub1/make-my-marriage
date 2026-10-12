import { render, screen } from '@testing-library/react';
import { App } from '../src/app/App';

describe('App', () => {
  it('renders the initial foundation page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /wedding planning workspace starts here/i }),
    ).toBeInTheDocument();
  });
});
