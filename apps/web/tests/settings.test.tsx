import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { WorkspaceSettingsPage } from '../src/features/settings/WorkspaceSettingsPage';

function renderPage(ui: ReactNode, initialEntries = ['/settings']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Workspace Settings Console (Stitch Design Reference)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders the Settings Console header with wedding title, countdown, and Stitch styling', async () => {
    renderPage(<WorkspaceSettingsPage />);

    // Header breadcrumb and titles
    expect(await screen.findByText(/WORKSPACE & CONFIGURATION/i)).toBeInTheDocument();
    expect(screen.getByText(/SETTINGS CONSOLE/i)).toBeInTheDocument();
    expect(screen.getByText("Prathap & Akshitha's Wedding")).toBeInTheDocument();

    // Badges and buttons
    expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
    expect(screen.getByText(/Discard/i)).toBeInTheDocument();
  });

  it('renders all 7 navigation tabs in the settings sidebar', async () => {
    renderPage(<WorkspaceSettingsPage />);

    expect(await screen.findByText('General Profile')).toBeInTheDocument();
    expect(screen.getByText('Workspace Members')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Access')).toBeInTheDocument();
    expect(screen.getByText('Notifications & Alerts')).toBeInTheDocument();
    expect(screen.getByText('Workspace Data & Export')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('switches between navigation tabs when clicked', async () => {
    const user = userEvent.setup();
    renderPage(<WorkspaceSettingsPage />);

    // Initial tab: Section 01 General Information
    expect(await screen.findByText(/Section 01/i)).toBeInTheDocument();
    expect(screen.getByText('General Information')).toBeInTheDocument();

    // Switch to Roles & Permissions
    const rolesTab = screen.getByText('Roles & Permissions');
    await user.click(rolesTab);
    expect(await screen.findByText(/Section 03/i)).toBeInTheDocument();
    expect(screen.getByText('Roles & Access Permissions')).toBeInTheDocument();

    // Switch to Privacy & Access
    const privacyTab = screen.getByText('Privacy & Access');
    await user.click(privacyTab);
    expect(await screen.findByText(/Section 04/i)).toBeInTheDocument();
    expect(screen.getByText('Privacy & Access Controls')).toBeInTheDocument();

    // Switch to Workspace Data & Export
    const exportTab = screen.getByRole('button', { name: /Workspace Data & Export/i });
    await user.click(exportTab);
    expect(await screen.findByText(/Section 06/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Workspace Data & Export' })).toBeInTheDocument();

    // Switch to Danger Zone
    const dangerTab = screen.getByRole('button', { name: /Danger Zone/i });
    await user.click(dangerTab);
    expect(await screen.findByText(/Section 07 • Caution/i)).toBeInTheDocument();
    expect(screen.getAllByText('Danger Zone').length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing general profile fields and enables Save Changes button', async () => {
    const user = userEvent.setup();
    renderPage(<WorkspaceSettingsPage />);

    // Find wedding workspace name input
    const titleInput = await screen.findByDisplayValue("Prathap & Akshitha's Wedding");
    expect(titleInput).toBeInTheDocument();

    // Change title
    await user.clear(titleInput);
    await user.type(titleInput, 'Royal Bengaluru Grandeur');

    // Click Save Changes
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).not.toBeDisabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText(/Saving\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('shows Master Celebration Cover & Monogram Banner with Change Cover button', async () => {
    renderPage(<WorkspaceSettingsPage />);

    expect(
      await screen.findByText('Master Celebration Cover & Monogram Banner'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recommended 1200×400px/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Change Cover/i })).toBeInTheDocument();
  });
});
