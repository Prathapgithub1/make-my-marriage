import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { ExpensesPage } from '../src/features/expenses/ExpensesPage';

function renderExpensesPage(ui: ReactNode, initialEntries = ['/expenses']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Expenses & Budget Management Page', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders KPI cards, budget utilization bar, and seeded ledger entries', async () => {
    renderExpensesPage(<ExpensesPage />);

    expect(
      await screen.findByRole('heading', { name: /Expenses & Budget Management/i }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Total Wedding Budget')).toBeInTheDocument();
    expect(screen.getByText('₹25,00,000')).toBeInTheDocument();
    expect(screen.getAllByText('₹2,50,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('₹1,00,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹22,50,000')).toBeInTheDocument();

    expect(
      (await screen.findAllByText('Sangeet Chaat & Live Counters')).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Royal Heritage Catering/i).length).toBeGreaterThanOrEqual(1);
  });

  it('opens Add Expense modal, validates required fields, and submits a new expense', async () => {
    const user = userEvent.setup();
    renderExpensesPage(<ExpensesPage />);

    await screen.findByRole('heading', { name: /Expenses & Budget Management/i });

    await user.click(screen.getByRole('button', { name: '+ Add Expense' }));

    expect(screen.getByRole('heading', { name: /Add Wedding Expense/i })).toBeInTheDocument();

    // Submit empty triggers inline validation
    await user.click(screen.getByRole('button', { name: /^Add Expense$/i }));
    expect(await screen.findByText(/Please enter an expense title/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter a valid expense amount greater than 0/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Expense Title \*/i), 'Mehendi Floral Decor');
    await user.type(screen.getByLabelText(/Total Amount \(₹ INR\) \*/i), '85000');

    await user.click(screen.getByRole('button', { name: /^Add Expense$/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /Add Wedding Expense/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('switches to Budget Planner tab and updates overall wedding budget', async () => {
    const user = userEvent.setup();
    renderExpensesPage(<ExpensesPage />);

    await screen.findByRole('heading', { name: /Expenses & Budget Management/i });

    await user.click(screen.getByRole('tab', { name: 'Budget Planner' }));
    expect(await screen.findByText('Master Wedding Financial Plan')).toBeInTheDocument();
    expect(screen.getByText('Ceremony Budget Allocations')).toBeInTheDocument();
    expect(screen.getByText('Sangeet Night')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update Total Cap' }));
    expect(
      screen.getByRole('heading', { name: /Set Overall Wedding Budget/i }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Total Wedding Budget \(₹ INR\) \*/i);
    await user.clear(input);
    await user.type(input, '3000000');
    await user.click(screen.getByRole('button', { name: 'Save Budget' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /Set Overall Wedding Budget/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('switches to Reports & Analytics tab and renders charts', async () => {
    const user = userEvent.setup();
    renderExpensesPage(<ExpensesPage />);

    await screen.findByRole('heading', { name: /Expenses & Budget Management/i });
    await user.click(screen.getByRole('tab', { name: 'Reports & Analytics' }));

    expect(await screen.findByText('Financial Insights & Cost Breakdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Category spend donut chart')).toBeInTheDocument();
    expect(screen.getByText('Ceremony Budget vs. Actual Spend')).toBeInTheDocument();
    expect(screen.getByText('Monthly Spend Trend')).toBeInTheDocument();
    expect(screen.getByText('Spend by Vendor')).toBeInTheDocument();
  });

  it('opens Expense Detail modal and allows recording full payment', async () => {
    const user = userEvent.setup();
    renderExpensesPage(<ExpensesPage />);

    await screen.findByRole('heading', { name: /Expenses & Budget Management/i });
    const viewButtons = await screen.findAllByRole('button', { name: 'View' });
    await user.click(viewButtons[0]);

    expect(await screen.findByText('Payment Settlement')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update Payment Status' }));

    expect(screen.getByRole('button', { name: 'Delete Expense' })).toBeInTheDocument();
  });
});
