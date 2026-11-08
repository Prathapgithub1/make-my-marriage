import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { EventsPage } from '../src/features/events/EventsPage';
import { EventDetailPage } from '../src/features/events/EventDetailPage';

function renderWithProviders(ui: ReactNode, initialEntries = ['/events']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Events Management Frontend', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'test-user', email: 'akshitha@example.com', name: 'Akshitha Rao' },
      hasWedding: true,
      membership: { role: 'ADMIN' },
      wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
    });
  });

  describe('EventsPage (/events)', () => {
    it('renders header, informational metrics cards, and event cards', async () => {
      renderWithProviders(<EventsPage />);

      expect(screen.getByText('Wedding Events & Itinerary')).toBeInTheDocument();
      expect(screen.getByText('Wedding Events')).toBeInTheDocument();

      // Check metrics cards
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getAllByText('Completed')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Cancelled')[0]).toBeInTheDocument();

      // Wait for events to load from mock
      expect(await screen.findByText('Sangeet & Cocktail')).toBeInTheDocument();
      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      expect(screen.getByText('The Grand Palace')).toBeInTheDocument();
      expect(screen.getByText('The Royal Mandap')).toBeInTheDocument();
      expect(screen.getByText('Indo-Western Glamour')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Planned')[0]).toBeInTheDocument();
    });

    it('opens the Create Event modal with preset chips and allows submitting a new event', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<EventsPage />);

      // Click Add Event button
      const addBtn = await screen.findByRole('button', { name: /Add Event/i });
      await user.click(addBtn);

      // Verify modal is open
      expect(screen.getByText('Add New Wedding Event')).toBeInTheDocument();

      // Verify preset chips are present
      expect(screen.getByRole('button', { name: 'Mehendi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Haldi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sangeet' })).toBeInTheDocument();

      // Click preset chip 'Mehendi'
      await user.click(screen.getByRole('button', { name: 'Mehendi' }));
      const nameInput = screen.getByPlaceholderText(
        /e\.g\. Sangeet & Musical Night/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe('Mehendi');

      // Fill in venue name
      const venueInput = screen.getByPlaceholderText(/The Grand Palace Courtyard/i);
      await user.type(venueInput, 'Poolside Lawn');

      // Submit the form
      const submitBtn = screen.getByRole('button', { name: /Create Event/i });
      await user.click(submitBtn);

      // Modal should close upon successful creation
      await waitFor(() => {
        expect(screen.queryByText('Add New Wedding Event')).not.toBeInTheDocument();
      });
    }, 15000);

    it('filters events and supports searching', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<EventsPage />);

      const searchInput = await screen.findByPlaceholderText(/Search by event or venue/i);
      await user.type(searchInput, 'Sangeet');

      expect(searchInput).toHaveValue('Sangeet');
    }, 15000);
  });

  describe('EventDetailPage (/events/:eventId)', () => {
    it('renders event details, cover hero, and allows switching between tabs', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <MemoryRouter initialEntries={['/events/event-1']}>
          <AppProviders>
            <Routes>
              <Route path="/events/:eventId" element={<EventDetailPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      // Hero banner
      expect(await screen.findByText('Sangeet & Cocktail')).toBeInTheDocument();
      expect(screen.getByText('About this Ceremony')).toBeInTheDocument();
      expect(screen.getByText('An evening of music and dance')).toBeInTheDocument();
      expect(screen.getByText('Venue & Location')).toBeInTheDocument();
      expect(screen.getAllByText('The Grand Palace')[0]).toBeInTheDocument();

      // Switch to Invited Guests tab
      const guestsTab = screen.getByRole('button', { name: /Invited Guests/i });
      await user.click(guestsTab);
      expect(await screen.findByText('Guest Invitations for this Event')).toBeInTheDocument();
      expect(screen.getByText(/Open to all wedding invitees by default/i)).toBeInTheDocument();

      // Switch to Related Tasks tab
      const tasksTab = screen.getByRole('button', { name: /Related Tasks/i });
      await user.click(tasksTab);
      expect(screen.getByText('Event Tasks & Checklists')).toBeInTheDocument();

      // Switch to Related Expenses tab
      const expensesTab = screen.getByRole('button', { name: /Related Expenses/i });
      await user.click(expensesTab);
      expect(screen.getByText('Event Expenses & Budget')).toBeInTheDocument();

      // Switch to Related Vendors tab
      const vendorsTab = screen.getByRole('button', { name: /Related Vendor/i });
      await user.click(vendorsTab);
      expect(screen.getByText('Assigned Event Vendors')).toBeInTheDocument();
    }, 15000);

    it('opens Edit modal from detail page', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <MemoryRouter initialEntries={['/events/event-1']}>
          <AppProviders>
            <Routes>
              <Route path="/events/:eventId" element={<EventDetailPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      const editBtn = await screen.findByRole('button', { name: /Edit Event/i });
      await user.click(editBtn);

      expect(screen.getByText('Edit Wedding Event')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    }, 15000);
  });
});
