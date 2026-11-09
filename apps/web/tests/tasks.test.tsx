import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { TasksPage } from '../src/features/tasks/TasksPage';

function renderWithProviders(ui: ReactNode, initialEntries = ['/tasks']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Task Management Frontend', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'test-user', email: 'akshitha@example.com', name: 'Akshitha Rao' },
      hasWedding: true,
      membership: { role: 'ADMIN' },
      wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
    });
  });

  describe('TasksPage (/tasks)', () => {
    it('renders header, informational metric cards, view tabs, and task list', async () => {
      renderWithProviders(<TasksPage />);

      // Verify Header
      expect(screen.getByText('Tasks & Checklists')).toBeInTheDocument();
      expect(screen.getByText('Wedding Workspace')).toBeInTheDocument();

      // Verify Metrics Cards
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getAllByText('To Do')[0]).toBeInTheDocument();
      expect(screen.getAllByText('In Progress')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Completed')[0]).toBeInTheDocument();

      // Wait for tasks to load from mock
      expect(
        await screen.findByText('Finalize floral palette & Mandap structure'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Confirm guest dietary requirements with catering'),
      ).toBeInTheDocument();

      // Check priority badges
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MED')).toBeInTheDocument();

      // Check ceremony link
      expect(screen.getAllByText('Sangeet & Cocktail')[0]).toBeInTheDocument();

      // Check assignee name
      expect(screen.getAllByText('Akshitha Rao')[0]).toBeInTheDocument();
    });

    it('opens the Create Task modal and allows submitting a new task', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<TasksPage />);

      // Click Create Task button
      const createBtn = screen.getByRole('button', { name: /Create Task/i });
      await user.click(createBtn);

      // Verify modal is open
      expect(screen.getByText('Create New Task')).toBeInTheDocument();

      // Fill in title
      const titleInput = screen.getByLabelText(/Task Title/i);
      await user.type(titleInput, 'Book live Shehnai musicians');

      // Click submit
      const submitBtn = screen.getByRole('button', { name: /^Create Task$/i });
      await user.click(submitBtn);

      // Verify modal closed
      await waitFor(() => {
        expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
      });
    });

    it('opens task details modal when clicking on a task card', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<TasksPage />);

      const taskTitle = await screen.findByText('Finalize floral palette & Mandap structure');
      await user.click(taskTitle);

      // Verify details modal opened
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getAllByText(
          'Coordinate with wedding florist for marigold and jasmine selection.',
        )[0],
      ).toBeInTheDocument();
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });

    it('switches tabs between All Tasks, My Tasks, and Completed', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<TasksPage />);

      const myTasksTab = screen.getByRole('button', { name: /My Tasks/i });
      await user.click(myTasksTab);

      const completedTab = screen.getByRole('button', { name: /Completed \(/i });
      await user.click(completedTab);

      expect(completedTab).toHaveClass('text-[#8D493A]');
    });
  });
});
