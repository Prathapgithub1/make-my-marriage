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

describe('Workspace Settings Console (Stitch Design Reference & RBAC)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders the Settings Console header with workspace title, status badges, and SaaS action buttons', async () => {
    renderPage(<WorkspaceSettingsPage />);

    // Header breadcrumb and titles
    expect(await screen.findByText(/WORKSPACE & CONFIGURATION/i)).toBeInTheDocument();
    expect(screen.getByText(/SETTINGS CONSOLE/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: "Prathap & Akshitha's Wedding" }),
    ).toBeInTheDocument();

    // Workspace Status Badge (Active Workspace & Administrator)
    expect(screen.getByText('Active Workspace')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    // Redesigned SaaS Action Buttons
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

  it('shows discard changes confirmation modal and restores original values on confirm', async () => {
    const user = userEvent.setup();
    renderPage(<WorkspaceSettingsPage />);

    const titleInput = await screen.findByDisplayValue("Prathap & Akshitha's Wedding");
    await user.clear(titleInput);
    await user.type(titleInput, 'Unsaved Modified Title');

    const discardButton = screen.getByRole('button', { name: /Discard/i });
    expect(discardButton).not.toBeDisabled();
    await user.click(discardButton);

    // Confirmation dialog should appear
    expect(await screen.findByText('Discard Unsaved Modifications?')).toBeInTheDocument();

    // Click confirm discard
    const confirmButton = screen.getByRole('button', { name: 'Discard Changes' });
    await user.click(confirmButton);

    // Value should revert to original
    expect(await screen.findByDisplayValue("Prathap & Akshitha's Wedding")).toBeInTheDocument();
  });

  it('opens Help and Support modal when help icon is clicked', async () => {
    const user = userEvent.setup();
    renderPage(<WorkspaceSettingsPage />);

    const helpButton = await screen.findByTitle('Workspace Settings Guide & Support');
    await user.click(helpButton);

    expect(await screen.findByText('Workspace Settings & RBAC Guide')).toBeInTheDocument();
    expect(screen.getByText(/Administrator Privileges/i)).toBeInTheDocument();
    expect(screen.getByText(/Manager Capabilities/i)).toBeInTheDocument();

    const gotItBtn = screen.getByRole('button', { name: 'Got It' });
    await user.click(gotItBtn);
    expect(screen.queryByText('Workspace Settings & RBAC Guide')).not.toBeInTheDocument();
  });

  it('shows Master Celebration Cover Banner with Change Cover button', async () => {
    renderPage(<WorkspaceSettingsPage />);

    expect(
      await screen.findByText('Master Celebration Cover & Monogram Banner'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recommended 1200×400px/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Change Cover/i })).toBeInTheDocument();
  });
});
