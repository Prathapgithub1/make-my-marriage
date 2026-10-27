import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  BrandMark,
  BrandLockup,
  getPageSubtitle,
  DEFAULT_BRAND_SUBTITLE,
} from '../src/components/BrandMark';

describe('Brand Components & Dynamic Subtitles', () => {
  describe('BrandMark', () => {
    it('renders the approved M-and-heart SVG symbol', () => {
      const { container } = render(<BrandMark />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 64 59');
    });

    it('supports compact prop styling', () => {
      const { container } = render(<BrandMark compact />);
      const wrapper = container.querySelector('span');
      expect(wrapper?.className).toContain('w-7');
    });
  });

  describe('getPageSubtitle mapping logic', () => {
    it('returns public home page subtitle for /', () => {
      expect(getPageSubtitle('/')).toBe('WEDDING PLANNING, BEAUTIFULLY ORGANIZED');
    });

    it('returns WELCOME BACK for /login', () => {
      expect(getPageSubtitle('/login')).toBe('WELCOME BACK');
    });

    it('returns CREATE YOUR ACCOUNT for /signup', () => {
      expect(getPageSubtitle('/signup')).toBe('CREATE YOUR ACCOUNT');
    });

    it('returns VERIFY YOUR EMAIL for /verify-email', () => {
      expect(getPageSubtitle('/verify-email')).toBe('VERIFY YOUR EMAIL');
    });

    it('returns RESET YOUR PASSWORD for /forgot-password', () => {
      expect(getPageSubtitle('/forgot-password')).toBe('RESET YOUR PASSWORD');
    });

    it('returns SECURE ACCOUNT RECOVERY for /reset-password', () => {
      expect(getPageSubtitle('/reset-password')).toBe('SECURE ACCOUNT RECOVERY');
    });

    it('returns YOUR WEDDING JOURNEY STARTS HERE for /wedding/setup', () => {
      expect(getPageSubtitle('/wedding/setup')).toBe('YOUR WEDDING JOURNEY STARTS HERE');
    });

    it('returns YOUR WEDDING WORKSPACE for /dashboard', () => {
      expect(getPageSubtitle('/dashboard')).toBe('YOUR WEDDING WORKSPACE');
    });

    it('returns GUEST MANAGEMENT for /guests', () => {
      expect(getPageSubtitle('/guests')).toBe('GUEST MANAGEMENT');
    });

    it('returns YOUR WEDDING CHECKLIST for /checklist and /tasks', () => {
      expect(getPageSubtitle('/checklist')).toBe('YOUR WEDDING CHECKLIST');
      expect(getPageSubtitle('/tasks')).toBe('YOUR WEDDING CHECKLIST');
    });

    it('returns WEDDING EVENTS for /events', () => {
      expect(getPageSubtitle('/events')).toBe('WEDDING EVENTS');
    });

    it('returns WEDDING BUDGET for /budget and /expenses', () => {
      expect(getPageSubtitle('/budget')).toBe('WEDDING BUDGET');
      expect(getPageSubtitle('/expenses')).toBe('WEDDING BUDGET');
    });

    it('returns YOUR WEDDING VENDORS for /vendors', () => {
      expect(getPageSubtitle('/vendors')).toBe('YOUR WEDDING VENDORS');
    });

    it('returns INVITATIONS & RSVPS for /invitations and /rsvps', () => {
      expect(getPageSubtitle('/invitations')).toBe('INVITATIONS & RSVPS');
      expect(getPageSubtitle('/rsvps')).toBe('INVITATIONS & RSVPS');
    });

    it('returns YOUR WEDDING WEBSITE for /website', () => {
      expect(getPageSubtitle('/website')).toBe('YOUR WEDDING WEBSITE');
    });

    it('returns YOUR WEDDING MEMORIES for /gallery and /photos', () => {
      expect(getPageSubtitle('/gallery')).toBe('YOUR WEDDING MEMORIES');
      expect(getPageSubtitle('/photos')).toBe('YOUR WEDDING MEMORIES');
    });

    it('returns WORKSPACE SETTINGS for /settings', () => {
      expect(getPageSubtitle('/settings')).toBe('WORKSPACE SETTINGS');
    });

    it('handles nested routes by prefix matching', () => {
      expect(getPageSubtitle('/wedding/setup/step-1')).toBe('YOUR WEDDING JOURNEY STARTS HERE');
      expect(getPageSubtitle('/dashboard/metrics')).toBe('YOUR WEDDING WORKSPACE');
    });

    it('prefers explicit subtitle override when supplied', () => {
      expect(getPageSubtitle('/dashboard', 'CUSTOM SUBTITLE')).toBe('CUSTOM SUBTITLE');
    });

    it('provides sensible default fallback for unmatched routes', () => {
      expect(getPageSubtitle('/some-unmapped-route')).toBe(DEFAULT_BRAND_SUBTITLE);
    });
  });

  describe('BrandLockup rendering in Router', () => {
    it('renders Make My Marriage brand wordmark and dynamic subtitle on /login', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <BrandLockup />
        </MemoryRouter>,
      );

      expect(screen.getByText('Make My Marriage')).toBeInTheDocument();
      expect(screen.getByText('WELCOME BACK')).toBeInTheDocument();
    });

    it('renders Make My Marriage and dynamic subtitle on /wedding/setup', () => {
      render(
        <MemoryRouter initialEntries={['/wedding/setup']}>
          <BrandLockup />
        </MemoryRouter>,
      );

      expect(screen.getByText('Make My Marriage')).toBeInTheDocument();
      expect(screen.getByText('YOUR WEDDING JOURNEY STARTS HERE')).toBeInTheDocument();
    });

    it('renders Make My Marriage and dynamic subtitle on /dashboard', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <BrandLockup />
        </MemoryRouter>,
      );

      expect(screen.getByText('Make My Marriage')).toBeInTheDocument();
      expect(screen.getByText('YOUR WEDDING WORKSPACE')).toBeInTheDocument();
    });

    it('renders explicit subtitle prop over route default when provided', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <BrandLockup subtitle="CONCIERGE WORKSPACE" />
        </MemoryRouter>,
      );

      expect(screen.getByText('Make My Marriage')).toBeInTheDocument();
      expect(screen.getByText('CONCIERGE WORKSPACE')).toBeInTheDocument();
    });

    it('hides subtitle when hideSubtitle is true', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <BrandLockup hideSubtitle />
        </MemoryRouter>,
      );

      expect(screen.getByText('Make My Marriage')).toBeInTheDocument();
      expect(screen.queryByText('YOUR WEDDING WORKSPACE')).not.toBeInTheDocument();
    });
  });
});
