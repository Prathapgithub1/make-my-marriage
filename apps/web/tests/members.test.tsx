import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { MembersPage } from '../src/features/members/MembersPage';
import { AcceptInvitationPage } from '../src/features/members/AcceptInvitationPage';

function renderPage(ui: ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Members & Team Invitations Frontend', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'test-user', email: 'akshitha@example.com', name: 'Akshitha Rao' },
      hasWedding: true,
      membership: { role: 'ADMIN' },
      wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
    });
  });

  describe('MembersPage (/settings/members)', () => {
    it('renders the team header, active members list, and pending invitations', async () => {
      renderPage(<MembersPage />, ['/settings/members']);

      expect(screen.getByText('Wedding Team & Members')).toBeInTheDocument();
      expect(screen.getByText('Wedding Team & Family')).toBeInTheDocument();

      // Verify active members loaded from mock
      const akshithaMatches = await screen.findAllByText('Akshitha Rao');
      expect(akshithaMatches[0]).toBeInTheDocument();
      expect(screen.getByText('akshitha@example.com')).toBeInTheDocument();
      expect(screen.getByText('Rohan Sharma')).toBeInTheDocument();
      expect(screen.getByText('manager@example.com')).toBeInTheDocument();
      expect(screen.getAllByText('Admin')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Manager')[0]).toBeInTheDocument();
    });

    it('opens the invite modal and allows sending an invitation', async () => {
      const user = userEvent.setup();
      renderPage(<MembersPage />, ['/settings/members']);

      // Click invite button
      const inviteBtn = await screen.findByRole('button', { name: /Invite Family \/ Organizer/i });
      await user.click(inviteBtn);

      // Verify modal opened
      expect(screen.getByText('Add Family or Organizer')).toBeInTheDocument();
      const emailInput = screen.getByPlaceholderText(/e\.g\. brother@example\.com/i);
      expect(emailInput).toBeInTheDocument();

      // Type email and submit
      await user.type(emailInput, 'cousin@example.com');
      const submitInviteBtn = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitInviteBtn);

      // Verify success state with copyable link and WhatsApp share
      expect(await screen.findByText(/Invitation created successfully!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Share Invitation on WhatsApp/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
    });

    it('renders the manager view without invite button or admin action controls', async () => {
      queryClient.setQueryData(['auth', 'me'], {
        user: { id: 'manager-user-id', email: 'manager@example.com', name: 'Rohan Sharma' },
        hasWedding: true,
        membership: { role: 'MANAGER' },
        wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
      });

      renderPage(<MembersPage />, ['/settings/members']);

      expect(screen.getByText('Wedding Team & Members')).toBeInTheDocument();
      expect(await screen.findByText('Rohan Sharma')).toBeInTheDocument();
      expect(screen.getByText('Manager view (Admins manage team members)')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Invite Family \/ Organizer/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Pending Invitations/i)).not.toBeInTheDocument();
    });
  });

  describe('AcceptInvitationPage (/invitations/members/:token)', () => {
    beforeEach(() => {
      queryClient.clear();
      queryClient.setQueryData(['auth', 'me'], null);
    });

    it('renders the public invitation preview with wedding and inviter info', async () => {
      render(
        <MemoryRouter initialEntries={['/invitations/members/sample-token']}>
          <AppProviders>
            <Routes>
              <Route path="/invitations/members/:token" element={<AcceptInvitationPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>,
      );

      expect(screen.getByText('Accept Wedding Invitation')).toBeInTheDocument();

      // Wait for invitation details
      expect(await screen.findByText("Prathap & Akshitha's Wedding")).toBeInTheDocument();
      expect(screen.getByText('Akshitha Rao')).toBeInTheDocument();
      expect(
        screen.getByText(/has invited you to join the wedding planning team/i),
      ).toBeInTheDocument();
      expect(screen.getAllByText('vikram@example.com')[0]).toBeInTheDocument();

      // Check for Create Account / Sign In buttons when unauthenticated
      expect(screen.getByRole('link', { name: /Create Account to Accept/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
    });
  });
});
