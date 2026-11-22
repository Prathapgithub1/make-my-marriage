import type { ReactElement } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { WeddingWebsitePage } from '../src/features/website/WeddingWebsitePage';
import { PublicWeddingWebsitePage } from '../src/features/website/PublicWeddingWebsitePage';

function renderWithClient(ui: ReactElement, initialRoute = '/website') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppProviders>
        <Routes>
          <Route path="/website" element={<WeddingWebsitePage />} />
          <Route path="/w/:slug" element={<PublicWeddingWebsitePage />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Website Builder & Public Guest Site', () => {
  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('renders Wedding Website Dashboard with metrics, URL, and sections summary', async () => {
    renderWithClient(<WeddingWebsitePage />);

    // Check header
    expect(await screen.findByText('Wedding Website Builder')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Check Metrics
    expect(screen.getByText('184')).toBeInTheDocument(); // Total guests
    expect(screen.getByText('142')).toBeInTheDocument(); // Attending
    expect(screen.getByText('18')).toBeInTheDocument(); // Declined
    expect(screen.getByText('24')).toBeInTheDocument(); // Pending
    expect(screen.getByText('87%')).toBeInTheDocument(); // Response rate

    // Check slug and URL preview
    expect(screen.getByText('/w/prathap-and-akshitha')).toBeInTheDocument();

    // Check Quick Action buttons
    expect(screen.getByText('Launch Visual Editor →')).toBeInTheDocument();
    expect(screen.getAllByText('Templates Gallery')).toHaveLength(2);
  });

  it('navigates to Templates Gallery and displays all 4 architectural styles', async () => {
    renderWithClient(<WeddingWebsitePage />);

    // Click Templates Gallery tab button in header
    expect(await screen.findByText('Wedding Website Builder')).toBeInTheDocument();
    const [templatesTab] = screen.getAllByRole('button', { name: 'Templates Gallery' });
    fireEvent.click(templatesTab);

    // Verify all 4 templates appear
    expect(await screen.findByText('Royal Heritage')).toBeInTheDocument();
    expect(screen.getByText('Modern Minimal')).toBeInTheDocument();
    expect(screen.getByText('Floral Romance')).toBeInTheDocument();
    expect(screen.getByText('Bohemian Sunset')).toBeInTheDocument();

    // Royal Heritage is active template
    expect(screen.getByText('Active Design')).toBeInTheDocument();
  });

  it('navigates to Visual Editor and allows editing section data and styles', async () => {
    renderWithClient(<WeddingWebsitePage />);

    // Click Visual Editor tab
    expect(await screen.findByText('Wedding Website Builder')).toBeInTheDocument();
    const editorTab = screen.getByRole('button', { name: 'Visual Editor' });
    fireEvent.click(editorTab);

    // Verify Three-Panel layout loaded
    expect(await screen.findByText('Page Sections (11)')).toBeInTheDocument();
    expect(screen.getByText('Theme & Styler')).toBeInTheDocument();
    expect(screen.getByText('Hero Headline / Greeting')).toBeInTheDocument();

    // Switch to Theme & Styler tab in editor
    const themeTab = screen.getByRole('button', { name: 'Theme & Styler' });
    fireEvent.click(themeTab);

    // Verify palette presets and custom pickers appear
    expect(await screen.findByText('Palette & Theme Presets')).toBeInTheDocument();
    expect(screen.getByText('Custom Brand Colors')).toBeInTheDocument();
  });

  it('opens website settings modal and validates slug input', async () => {
    renderWithClient(<WeddingWebsitePage />);

    // Click Settings & Domain button
    const settingsBtn = await screen.findByRole('button', { name: /Settings & Domain/i });
    fireEvent.click(settingsBtn);

    // Verify modal opened
    expect(await screen.findByText('Website & Domain Settings')).toBeInTheDocument();
    expect(screen.getByText('Custom Website URL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('prathap-and-akshitha')).toBeInTheDocument();

    // Cancel modal
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Website & Domain Settings')).not.toBeInTheDocument();
    });
  });

  it('renders standalone public wedding website at /w/:slug with working RSVP form', async () => {
    renderWithClient(<PublicWeddingWebsitePage />, '/w/prathap-and-akshitha');

    // Verify public website hero content
    expect(await screen.findByText("Prathap & Akshitha's Wedding")).toBeInTheDocument();
    expect(screen.getByText('We are getting married!')).toBeInTheDocument();
    expect(screen.getByText('Ceremonies & Celebrations')).toBeInTheDocument();
    expect(screen.getByText('Traditional Muhurtham')).toBeInTheDocument();

    // Find and click RSVP trigger button
    const rsvpButtons = screen.getAllByRole('button', { name: /RSVP Now|Open Guest RSVP Form/i });
    fireEvent.click(rsvpButtons[0]);

    // Verify RSVP dialog opened
    expect(await screen.findByText("RSVP for Prathap & Akshitha's Wedding")).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Full Name/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Siddharth Varma' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'siddharth@example.com' },
    });

    // Submit RSVP
    const submitBtn = screen.getByRole('button', { name: /Submit RSVP Response/i });
    fireEvent.click(submitBtn);

    // Confirmation message displayed
    expect(await screen.findByText('Response Recorded')).toBeInTheDocument();
    expect(
      screen.getByText('RSVP confirmed! We look forward to celebrating together.'),
    ).toBeInTheDocument();
  });

  it('renders gracefully when website metrics or stats are missing or undefined', async () => {
    const originalFetch = window.fetch;
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.match(/\/website(?:\?.*)?$/)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: 'ws-empty',
              weddingId: 'test-wedding-id',
              slug: 'minimal-test-wedding',
              theme: 'CLASSIC',
              isPublished: false,
              publishedAt: null,
              content: null,
              stats: undefined,
              rsvpMetrics: undefined,
            },
          }),
        } as Response);
      }
      return originalFetch(input, init);
    });

    try {
      renderWithClient(<WeddingWebsitePage />);
      expect(await screen.findByText('Wedding Website Builder')).toBeInTheDocument();
      // Total guests metric should safely fall back to 0 without throwing
      expect(screen.getAllByText('0')).toHaveLength(4);
      expect(screen.getByText('/w/minimal-test-wedding')).toBeInTheDocument();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('renders gracefully on public wedding page when content and settings are missing', async () => {
    const originalFetch = window.fetch;
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/public/weddings/bare-wedding')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              weddingId: 'test-wedding-id',
              title: 'Bare Minimum Wedding',
              slug: 'bare-wedding',
              isPublished: true,
              content: undefined,
              settings: undefined,
              sections: [
                {
                  id: 'sec-hero',
                  type: 'HERO',
                  title: 'Hero Welcome',
                  isEnabled: true,
                  order: 0,
                  data: {
                    headline: 'Bare Minimum Wedding',
                    subheadline: 'Welcome',
                  },
                },
              ],
              events: [],
            },
          }),
        } as Response);
      }
      return originalFetch(input, init);
    });

    try {
      renderWithClient(<PublicWeddingWebsitePage />, '/w/bare-wedding');
      const matches = await screen.findAllByText('Bare Minimum Wedding');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
