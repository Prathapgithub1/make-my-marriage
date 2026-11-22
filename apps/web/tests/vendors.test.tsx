import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { VendorsPage } from '../src/features/vendors/VendorsPage';

function renderVendorsPage(ui: ReactNode, initialEntries = ['/vendors']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Vendor Management Suite (Stitch UI Reference)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders the Stitch header, 7 view state tabs, live sync badge, and 8 KPI metric cards', async () => {
    renderVendorsPage(<VendorsPage />);

    // Editorial headline
    expect(
      await screen.findByRole('heading', { name: /Curated Wedding Partners & Production/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/VENDOR MANAGEMENT SUITE/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Sync Enabled/i)).toBeInTheDocument();

    // 7 View state tabs
    expect(screen.getByRole('button', { name: '1. Vendor Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2. Vendor Directory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3. 15 Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4. Vendor Profile Deep Dive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5. Payments & Ledger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6. Side-by-Side Comparison' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7. Schedule & Timeline' })).toBeInTheDocument();

    // 8 KPI cards
    expect(await screen.findByText('Total Vendors')).toBeInTheDocument();
    expect(screen.getByText('Active & Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted / Review')).toBeInTheDocument();
    expect(screen.getByText('Pending Signatures')).toBeInTheDocument();
    expect(screen.getByText('Vendor Budget Cap')).toBeInTheDocument();
    expect(screen.getByText('Total Amount Paid')).toBeInTheDocument();
    expect(screen.getByText('Remaining Balance')).toBeInTheDocument();
    expect(screen.getByText('Upcoming 14 Days')).toBeInTheDocument();

    // Funnel & Budget sections
    expect(screen.getByText('Booking Pipeline Funnel')).toBeInTheDocument();
    expect(screen.getByText('Budget Allocation by Tier')).toBeInTheDocument();
  });

  it('switches between view states correctly', async () => {
    const user = userEvent.setup();
    renderVendorsPage(<VendorsPage />);

    await screen.findByRole('heading', { name: /Curated Wedding Partners & Production/i });

    // Switch to Directory
    await user.click(screen.getByRole('button', { name: '2. Vendor Directory' }));
    expect(
      await screen.findByPlaceholderText(/Search vendors by name, contact, city, or service/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Royal Heritage Catering/i).length).toBeGreaterThanOrEqual(1);

    // Switch to 15 Categories
    await user.click(screen.getByRole('button', { name: '3. 15 Categories' }));
    expect(
      await screen.findByRole('heading', { name: /18 Vendor Categories & Production Tiers/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Venues & Palaces/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Side-by-Side Comparison
    await user.click(screen.getByRole('button', { name: '6. Side-by-Side Comparison' }));
    expect(
      await screen.findByRole('heading', { name: /Compare Quotes & Production Deliverables/i }),
    ).toBeInTheDocument();

    // Switch to Schedule & Timeline
    await user.click(screen.getByRole('button', { name: '7. Schedule & Timeline' }));
    expect(
      await screen.findByRole('heading', { name: /Production Schedule & Milestones/i }),
    ).toBeInTheDocument();
  });

  it('opens Add Vendor modal, fills vendor details, and submits successfully', async () => {
    const user = userEvent.setup();
    renderVendorsPage(<VendorsPage />);

    await screen.findByRole('heading', { name: /Curated Wedding Partners & Production/i });

    // Click Add New Vendor
    await user.click(screen.getByRole('button', { name: /\+ Add New Vendor/i }));

    expect(await screen.findByRole('heading', { name: /Curate Vendor Partner/i })).toBeInTheDocument();

    // Fill in required fields
    await user.type(screen.getByLabelText(/Vendor Business Name/i), 'Divine Moments Photography');
    await user.type(screen.getByLabelText(/Contact Person/i), 'Rohan Sharma');
    await user.type(screen.getByLabelText(/Phone Number/i), '+91 9988776655');

    // Submit modal
    await user.click(screen.getByRole('button', { name: /\+ Add Vendor Partner/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Curate Vendor Partner/i })).not.toBeInTheDocument();
    });
  });

  it('filters vendor directory by search input', async () => {
    const user = userEvent.setup();
    renderVendorsPage(<VendorsPage />, ['/vendors?tab=directory']);

    const searchInput = await screen.findByPlaceholderText(
      /Search vendors by name, contact, city, or service/i,
    );

    expect((await screen.findAllByText(/Royal Heritage Catering/i)).length).toBeGreaterThanOrEqual(1);

    // Search for a non-existent vendor
    await user.type(searchInput, 'NonExistentVendorXYZ');
    expect(await screen.findByText(/No vendors found/i)).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);
    expect((await screen.findAllByText(/Royal Heritage Catering/i)).length).toBeGreaterThanOrEqual(1);
  });
});
