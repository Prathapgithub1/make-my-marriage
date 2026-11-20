import { useState, useEffect } from 'react';
import type { Album } from '../galleryApi';

interface AlbumCardProps {
  album: Album;
  isSelected: boolean;
  onSelect: (albumId: string) => void;
  onEdit: (album: Album) => void;
  onDelete: (albumId: string) => void;
}

export function AlbumCard({
  album,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AlbumCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [album.coverImageUrl]);

  const formattedDate = album.createdAt
    ? new Date(album.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => onSelect(album.id)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#8A4B35] border-[#8A4B35] shadow-md bg-white'
          : 'bg-white border-[#E8DFD5] hover:border-[#8A4B35]/50 hover:shadow-sm'
      }`}
    >
      {/* Cover Image or Editorial Wedding Fallback */}
      <div className="relative aspect-4/3 w-full bg-[#FAF7F2] overflow-hidden select-none">
        {album.coverImageUrl && !imageError ? (
          <div className="w-full h-full relative">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-[#F4EDE5] animate-pulse" />
            )}
            <img
              src={album.coverImageUrl}
              alt={album.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#FAF7F2] via-[#F4EDE5] to-[#EAE0D4] relative">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-[#E8DFD5] text-[#8A4B35] flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-[#86736D] mt-2">
              {album.mediaCount === 0 ? 'No photos yet' : `${album.mediaCount} memories`}
            </span>
          </div>
        )}

        {/* Clean Media Count Badge */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-[#5A4942] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#E8DFD5]/90 shadow-2xs flex items-center gap-1.5">
          <svg className="w-3 h-3 text-[#8A4B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{album.mediaCount} {album.mediaCount === 1 ? 'item' : 'items'}</span>
        </div>

        {/* Options Dropdown Trigger */}
        <div className="absolute top-2.5 right-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#5A4942] hover:text-[#1A1C18] hover:bg-white border border-[#E8DFD5]/90 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
            title="Album options"
            aria-label="Album options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-38 bg-white rounded-xl shadow-lg border border-[#E8DFD5] py-1 z-30 text-xs font-medium"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(album);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[#FBF6F0] text-[#1A1C18] flex items-center gap-2 cursor-pointer transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#86736D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Album
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(`Are you sure you want to delete "${album.name}"? Photos in this album will not be permanently deleted.`)) {
                    onDelete(album.id);
                  }
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[#FEF0F0] text-[#C0392B] flex items-center gap-2 cursor-pointer transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#C0392B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Album
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Album Info Body */}
      <div className="p-3.5 flex flex-col justify-between grow space-y-2">
        <div>
          <h3 className="font-serif text-sm sm:text-base font-semibold text-[#1A1C18] truncate group-hover:text-[#8A4B35] transition-colors">
            {album.name}
          </h3>
          {album.description ? (
            <p className="text-xs text-[#86736D] line-clamp-1 mt-0.5">
              {album.description}
            </p>
          ) : (
            <p className="text-[11px] text-[#A69791] mt-0.5">
              {formattedDate ? `Created ${formattedDate}` : 'Wedding celebration album'}
            </p>
          )}
        </div>

        {album.eventName && (
          <div className="pt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4C654D] bg-[#F4F7F2] px-2 py-0.5 rounded-full border border-[#D9E7D2] truncate max-w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4C654D] shrink-0" />
              <span className="truncate">{album.eventName}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
