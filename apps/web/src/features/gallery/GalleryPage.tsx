import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGallerySummary,
  listAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  listMedia,
  deleteMedia,
  type Album,
  type MediaItem,
} from './galleryApi';
import { listEvents } from '../events/eventsApi';
import { GalleryStats } from './components/GalleryStats';
import { AlbumCard } from './components/AlbumCard';
import { AlbumModal } from './components/AlbumModal';
import { MediaUploadModal } from './components/MediaUploadModal';
import { MediaGrid } from './components/MediaGrid';
import { MediaLightboxModal } from './components/MediaLightboxModal';

export function GalleryPage() {
  const queryClient = useQueryClient();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 1. Fetch Summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['gallery-summary'],
    queryFn: getGallerySummary,
  });

  // 2. Fetch Albums
  const { data: albums = [], isLoading: isLoadingAlbums } = useQuery({
    queryKey: ['gallery-albums'],
    queryFn: listAlbums,
  });

  // 3. Fetch Media
  const { data: mediaData, isLoading: isLoadingMedia } = useQuery({
    queryKey: ['gallery-media', selectedAlbumId],
    queryFn: () => listMedia({ albumId: selectedAlbumId || undefined, limit: 100 }),
  });

  // 4. Fetch Wedding Events for Linking
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents({ limit: 50 }),
  });

  const weddingEvents = eventsData?.events || [];

  // Mutations
  const createAlbumMutation = useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-summary'] });
    },
  });

  const updateAlbumMutation = useMutation({
    mutationFn: ({ albumId, input }: { albumId: string; input: Parameters<typeof updateAlbum>[1] }) =>
      updateAlbum(albumId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: deleteAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-summary'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-media'] });
      setSelectedAlbumId(null);
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-media'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-summary'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
    },
  });

  const handleSaveAlbum = async (data: { name: string; description?: string; eventId?: string }) => {
    if (editingAlbum) {
      await updateAlbumMutation.mutateAsync({
        albumId: editingAlbum.id,
        input: data,
      });
    } else {
      await createAlbumMutation.mutateAsync(data);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    await deleteAlbumMutation.mutateAsync(albumId);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    await deleteMediaMutation.mutateAsync(mediaId);
  };

  const currentMediaList: MediaItem[] = mediaData?.media || [];
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-w-0">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e8dfd5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a4b35]">
              Cloud Media Vault
            </span>
            <span className="text-xs text-[#86736d]">•</span>
            <span className="text-xs text-[#86736d]">AWS S3 Storage</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1c18] tracking-tight">
            Wedding Gallery
          </h1>
          <p className="text-sm text-[#86736d] mt-1 max-w-xl">
            Collect, organize, and cherish high-resolution photos and video reels across your wedding celebrations.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setEditingAlbum(null);
              setIsAlbumModalOpen(true);
            }}
            className="grow sm:grow-0 px-4 py-2.5 rounded-xl border border-[#e8dfd5] bg-white hover:bg-[#fafaf3] text-xs font-semibold text-[#1a1c18] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 text-[#8a4b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Album
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="grow sm:grow-0 px-5 py-2.5 rounded-xl bg-[#8a4b35] hover:bg-[#723c2a] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Media
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Storage Dashboard */}
      <section>
        <GalleryStats summary={summary} isLoading={isLoadingSummary} />
      </section>

      {/* 3. Albums Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-semibold text-[#1a1c18]">
              Event Albums
            </h2>
            <span className="text-xs font-semibold text-[#8a4b35] bg-[#8a4b35]/10 px-2.5 py-0.5 rounded-full">
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </span>
          </div>

          {selectedAlbumId && (
            <button
              type="button"
              onClick={() => setSelectedAlbumId(null)}
              className="text-xs font-semibold text-[#8a4b35] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              View All Albums
            </button>
          )}
        </div>

        {/* Albums Grid */}
        {isLoadingAlbums ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-4/3 bg-[#f5f2eb] rounded-2xl border border-[#e8dfd5]/60" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="bg-[#fafaf3] rounded-2xl p-6 sm:p-8 border border-dashed border-[#d8c2bb] text-center">
            <p className="text-xs text-[#86736d]">
              No albums created yet. Click <span className="font-semibold text-[#8a4b35]">"New Album"</span> to organize photos by Haldi, Mehendi, Sangeet, or custom celebrations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                isSelected={selectedAlbumId === album.id}
                onSelect={(id) => setSelectedAlbumId(selectedAlbumId === id ? null : id)}
                onEdit={(alb) => {
                  setEditingAlbum(alb);
                  setIsAlbumModalOpen(true);
                }}
                onDelete={handleDeleteAlbum}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Media Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1a1c18]">
              {selectedAlbum ? selectedAlbum.name : 'All Media'}
            </h2>
            <p className="text-xs text-[#86736d] mt-0.5">
              {selectedAlbum
                ? `Showing ${currentMediaList.length} photos and videos from ${selectedAlbum.name}`
                : `Browsing all uploaded ceremony memories (${currentMediaList.length} items)`}
            </p>
          </div>

          {selectedAlbumId && (
            <button
              type="button"
              onClick={() => {
                setSelectedAlbumId(null);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#fafaf3] text-[#8a4b35] border border-[#e8dfd5] hover:bg-white transition-colors cursor-pointer"
            >
              Filtered by: {selectedAlbum?.name} &times;
            </button>
          )}
        </div>

        <MediaGrid
          media={currentMediaList}
          isLoading={isLoadingMedia}
          onOpenLightbox={(index) => setLightboxIndex(index)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onDeleteMedia={handleDeleteMedia}
          mediaTypeFilter={mediaTypeFilter}
          setMediaTypeFilter={setMediaTypeFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </section>

      {/* Modals */}
      <AlbumModal
        isOpen={isAlbumModalOpen}
        onClose={() => {
          setIsAlbumModalOpen(false);
          setEditingAlbum(null);
        }}
        onSave={handleSaveAlbum}
        initialAlbum={editingAlbum}
        events={weddingEvents}
      />

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['gallery-media'] });
          queryClient.invalidateQueries({ queryKey: ['gallery-summary'] });
          queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
        }}
        albums={albums}
        events={weddingEvents}
        preselectedAlbumId={selectedAlbumId || undefined}
      />

      {lightboxIndex !== null && (
        <MediaLightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={currentMediaList}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onDelete={handleDeleteMedia}
        />
      )}
    </div>
  );
}
