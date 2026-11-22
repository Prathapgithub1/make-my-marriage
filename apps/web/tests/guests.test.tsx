import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { GuestsPage } from '../src/features/guests/GuestsPage';
import { PublicInvitationPage } from '../src/features/invitations/PublicInvitationPage';

function renderWithProviders(ui: ReactNode, initialEntries = ['/guests']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Guest Management & RSVP Frontend', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'test-user', email: 'akshitha@example.com', name: 'Akshitha Rao' },
      hasWedding: true,
      membership: { role: 'ADMIN' },
      wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
    });
  });

  describe('GuestsPage (/guests)', () => {
    it('renders header, informational KPI metrics, status filters, and guest table', async () => {
      renderWithProviders(<GuestsPage />);

      // Verify Header
      expect(screen.getByText('Guests & RSVP')).toBeInTheDocument();
      expect(screen.getByText(/Manage your guest roster/i)).toBeInTheDocument();

      // Verify KPI Metrics
      expect(screen.getByText('Total Parties')).toBeInTheDocument();
      expect(screen.getByText('Pending RSVP')).toBeInTheDocument();

      // Wait for guests to load from mock
      expect(await screen.findByText('Aarav Sharma')).toBeInTheDocument();
      expect(screen.getByText('Pooja Verma')).toBeInTheDocument();
      expect(screen.getByText('aarav@example.com')).toBeInTheDocument();

      // Verify Status Badges
      expect(screen.getAllByText('Attending').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });

    it('opens the Add Guest modal and allows submitting a new guest', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<GuestsPage />);

      // Click Add Guest button
      const addBtn = screen.getByRole('button', { name: /Add Guest/i });
      await user.click(addBtn);

      // Verify modal is open
      expect(screen.getByText('Add New Guest')).toBeInTheDocument();

      // Fill in Name
      const nameInput = screen.getByLabelText(/Guest \/ Family Name/i);
      await user.type(nameInput, 'Rohan Kapoor');

      // Click Save Guest button
      const saveBtn = screen.getByRole('button', { name: /^Save Guest$/i });
      await user.click(saveBtn);

      // Verify modal closed
      await waitFor(() => {
        expect(screen.queryByText('Add New Guest')).not.toBeInTheDocument();
      });
    });

    it('opens the Send Reminders modal', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<GuestsPage />);

      const remindersBtn = await screen.findByRole('button', { name: /Send Reminders/i });
      await user.click(remindersBtn);

      expect(screen.getByText('Send RSVP Reminders')).toBeInTheDocument();
      expect(screen.getByText(/Follow up with pending guests/i)).toBeInTheDocument();
    });

    it('opens the Guest Detail modal when clicking on a guest row', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<GuestsPage />);

      const guestRow = await screen.findByText('Aarav Sharma');
      await user.click(guestRow);

      // Verify Detail Modal opened
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.getByText('Edit Details')).toBeInTheDocument();
      expect(screen.getByText('Copy Link')).toBeInTheDocument();
      expect(screen.getByText('Share on WhatsApp')).toBeInTheDocument();
    });
  });

  describe('PublicInvitationPage (/invite/:token)', () => {
    it('renders couple names, wedding schedule, and allows submitting RSVP response', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <MemoryRouter initialEntries={['/invite/test-invite-token-1']}>
          <AppProviders>
            <Routes>
              <Route path="/invite/:token" element={<PublicInvitationPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      // Verify Wedding Couple Header
      expect(await screen.findByText('Akshitha & Prathap')).toBeInTheDocument();
      expect(screen.getByText(/॥ श्री गणेशाय नमः ॥/i)).toBeInTheDocument();
      expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();

      // Verify Scheduled Ceremonies
      expect(screen.getByText('Sangeet & Cocktail')).toBeInTheDocument();
      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();

      // Verify RSVP Form options
      expect(screen.getByText('Joyfully Accept')).toBeInTheDocument();
      expect(screen.getByText('Regretfully Decline')).toBeInTheDocument();

      // Submit RSVP
      const submitBtn = screen.getByRole('button', { name: /Confirm RSVP/i });
      await user.click(submitBtn);

      // Verify success feedback
      expect(await screen.findByText(/Thank you! Your RSVP is saved./i)).toBeInTheDocument();
    });
  });
});
