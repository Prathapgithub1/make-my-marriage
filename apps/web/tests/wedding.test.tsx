import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { WeddingSetupPage } from '../src/features/wedding/WeddingSetupPage';
import { DashboardPage } from '../src/features/wedding/DashboardPage';

function renderPage(ui: ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Onboarding and Workspace Dashboard', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('WeddingSetupPage (Screen 1)', () => {
    it('renders the setup form fields with Stitch styling and headers', () => {
      renderPage(<WeddingSetupPage />);

      expect(screen.getByText("Let's plan your special day")).toBeInTheDocument();
      expect(screen.getByLabelText(/Wedding name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Partner 1 \(You\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Partner 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Wedding Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Wedding Location \/ City/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Wedding Workspace/i })).toBeInTheDocument();
      expect(
        screen.getByText(/One central space for ceremonies, loved ones, and timeless memories/i),
      ).toBeInTheDocument();
    });

    it('validates required fields when submitted with empty inputs', async () => {
      const user = userEvent.setup();
      renderPage(<WeddingSetupPage />);

      const submitBtn = screen.getByRole('button', { name: /Create Wedding Workspace/i });
      await user.click(submitBtn);

      expect(await screen.findByText(/Please enter a wedding name/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter Partner 1 name/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter Partner 2 name/i)).toBeInTheDocument();
    });

    it('submits valid wedding data and navigates to the dashboard', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/wedding/setup']}>
          <AppProviders>
            <Routes>
              <Route path="/wedding/setup" element={<WeddingSetupPage />} />
              <Route path="/dashboard" element={<h1>Mock Dashboard Reached</h1>} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      await user.type(screen.getByLabelText(/Wedding name/i), "Prathap & Akshitha's Wedding");
      await user.type(screen.getByLabelText(/Partner 1 \(You\)/i), 'Akshitha Rao');
      await user.type(screen.getByLabelText(/Partner 2/i), 'Prathap Kumar');
      await user.type(
        screen.getByLabelText(/Wedding Location \/ City/i),
        'The Oberoi Udaivilas, Udaipur',
      );

      const submitBtn = screen.getByRole('button', { name: /Create Wedding Workspace/i });
      await user.click(submitBtn);

      expect(await screen.findByText('Mock Dashboard Reached')).toBeInTheDocument();
    });

    it('redirects to dashboard if user already has an existing wedding', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/wedding/setup']}>
          <AppProviders>
            <Routes>
              <Route path="/wedding/setup" element={<WeddingSetupPage />} />
              <Route path="/dashboard" element={<h1>Mock Dashboard Reached</h1>} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      // Triggering "Conflict" title invokes ALREADY_HAS_WEDDING in mock
      await user.type(screen.getByLabelText(/Wedding name/i), 'Conflict');
      await user.type(screen.getByLabelText(/Partner 1 \(You\)/i), 'Akshitha Rao');
      await user.type(screen.getByLabelText(/Partner 2/i), 'Prathap Kumar');

      await user.click(screen.getByRole('button', { name: /Create Wedding Workspace/i }));

      expect(await screen.findByText('Mock Dashboard Reached')).toBeInTheDocument();
    });
  });

  describe('DashboardPage (Screen 2)', () => {
    it('renders real wedding workspace details with honest empty states', async () => {
      renderPage(<DashboardPage />, ['/dashboard']);

      // Header and wedding title
      expect(await screen.findByText("Prathap & Akshitha's Wedding")).toBeInTheDocument();
      expect(screen.getByText(/120 days to go/i)).toBeInTheDocument();
      expect(screen.getAllByText('The Oberoi Udaivilas, Udaipur').length).toBeGreaterThanOrEqual(1);

      // Four metric cards
      expect(screen.getByText('Nov 14, 2025')).toBeInTheDocument();
      expect(screen.getByText('No events yet')).toBeInTheDocument();
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Not set up yet')).toBeInTheDocument();

      // Planning section empty states
      expect(screen.getByText('Your wedding events start here')).toBeInTheDocument();
      expect(screen.getByText('Keep your plans organized')).toBeInTheDocument();
      expect(screen.getByText('0 of 0 Completed')).toBeInTheDocument();

      // Next steps checklist
      expect(screen.getByText('Your next steps')).toBeInTheDocument();
      expect(screen.getByText('1. Add wedding events')).toBeInTheDocument();
      expect(screen.getByText('2. Create your first planning task')).toBeInTheDocument();
      expect(screen.getByText('3. Start building the guest list')).toBeInTheDocument();
      expect(screen.getByText('4. Set an initial budget')).toBeInTheDocument();

      // Quick actions
      expect(screen.getByText('Plan an Event')).toBeInTheDocument();
      expect(screen.getByText('Create a Task')).toBeInTheDocument();
      expect(screen.getByText('Manage Guests')).toBeInTheDocument();
      expect(screen.getByText('Track Expenses')).toBeInTheDocument();
      expect(screen.getByText('Explore Vendors')).toBeInTheDocument();
      expect(screen.getByText('Wedding Website')).toBeInTheDocument();
    });

    it('opens the edit details modal and allows updating details', async () => {
      const user = userEvent.setup();
      renderPage(<DashboardPage />, ['/dashboard']);

      const editBtn = await screen.findByRole('button', { name: /Edit wedding details/i });
      await user.click(editBtn);

      expect(screen.getByRole('heading', { name: /Edit wedding details/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Wedding Name/i)).toHaveValue("Prathap & Akshitha's Wedding");

      // Cancel closes modal
      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: /Edit wedding details/i }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
