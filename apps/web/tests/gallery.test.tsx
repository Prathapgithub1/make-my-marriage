import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, queryClient } from '../src/app/providers';
import { GalleryPage } from '../src/features/gallery/GalleryPage';

function renderWithProviders(ui: ReactNode, initialEntries = ['/gallery']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  );
}

describe('Wedding Gallery Management Frontend', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData(['auth', 'me'], {
      user: { id: 'test-user', email: 'akshitha@example.com', name: 'Akshitha Rao' },
      hasWedding: true,
      membership: { role: 'ADMIN' },
      wedding: { id: 'test-wedding-id', title: "Prathap & Akshitha's Wedding" },
    });
  });

  it('renders gallery header, summary dashboard metrics, and action buttons', async () => {
    renderWithProviders(<GalleryPage />);

    // Header & Subtitle
    expect(screen.getByText('Wedding Gallery')).toBeInTheDocument();
    expect(screen.getByText('Cloud Media Vault')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new album/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload media/i })).toBeInTheDocument();

    // Summary Metric Cards
    expect(await screen.findByText('Total Photos')).toBeInTheDocument();
    expect(screen.getByText('Total Videos')).toBeInTheDocument();
    expect(screen.getAllByText('Event Albums').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Storage Used')).toBeInTheDocument();
    expect(screen.getByText('150 MB')).toBeInTheDocument();
  });

  it('displays albums list and media items in the grid', async () => {
    renderWithProviders(<GalleryPage />);

    // Wait for albums to load
    const albums = await screen.findAllByText('Mehendi & Sangeet');
    expect(albums[0]).toBeInTheDocument();
    expect(screen.getAllByText('Haldi Ceremony')[0]).toBeInTheDocument();

    // Wait for media items to load
    expect(
      await screen.findByText('Intricate bridal henna design'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Family flash mob dance performance'),
    ).toBeInTheDocument();
  });

  it('filters media by photos and videos tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPage />);

    // Wait for media items to appear
    expect(await screen.findByText('Intricate bridal henna design')).toBeInTheDocument();
    expect(screen.getByText('Family flash mob dance performance')).toBeInTheDocument();

    // Click 'Photos' tab
    const photosTab = screen.getByRole('button', { name: /photos/i });
    await user.click(photosTab);

    // Photo should be visible, video should be hidden
    expect(screen.getByText('Intricate bridal henna design')).toBeInTheDocument();
    expect(screen.queryByText('Family flash mob dance performance')).not.toBeInTheDocument();

    // Click 'Videos' tab
    const videosTab = screen.getByRole('button', { name: /videos/i });
    await user.click(videosTab);

    // Video should be visible, photo should be hidden
    expect(screen.getByText('Family flash mob dance performance')).toBeInTheDocument();
    expect(screen.queryByText('Intricate bridal henna design')).not.toBeInTheDocument();
  });

  it('filters media by clicking an album card', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPage />);

    const albumMatches = await screen.findAllByText('Mehendi & Sangeet');
    await user.click(albumMatches[0]);

    // Filter indicator should show
    expect(await screen.findByText(/filtered by: mehendi & sangeet/i)).toBeInTheDocument();
  });

  it('opens and submits the New Album modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPage />);

    const newAlbumBtn = screen.getByRole('button', { name: /new album/i });
    await user.click(newAlbumBtn);

    // Verify modal opened
    expect(screen.getByRole('heading', { name: /create new album/i })).toBeInTheDocument();

    // Type album name
    const nameInput = screen.getByPlaceholderText(/e\.g\. Sangeet Celebrations/i);
    await user.type(nameInput, 'Cocktail Night Gala');

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /^create album$/i });
    await user.click(submitBtn);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create new album/i })).not.toBeInTheDocument();
    });
  });

  it('opens and closes the Upload Media modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPage />);

    const uploadBtn = screen.getByRole('button', { name: /upload media/i });
    await user.click(uploadBtn);

    // Verify modal opened
    expect(screen.getByRole('heading', { name: /^upload media$/i })).toBeInTheDocument();
    expect(screen.getByText(/drop photos and videos here/i)).toBeInTheDocument();

    // Close modal
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /^upload media$/i })).not.toBeInTheDocument();
    });
  });

  it('opens the media lightbox viewer on clicking a media card and allows closing with Esc', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPage />);

    // Click on photo item
    const photoItem = await screen.findByText('Intricate bridal henna design');
    await user.click(photoItem);

    // Verify lightbox opened
    expect(await screen.findByTitle('Close viewer (Esc)')).toBeInTheDocument();
    expect(screen.getByTitle('Download full quality media')).toBeInTheDocument();

    // Press Escape to close
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTitle('Close viewer (Esc)')).not.toBeInTheDocument();
    });
  });
});
