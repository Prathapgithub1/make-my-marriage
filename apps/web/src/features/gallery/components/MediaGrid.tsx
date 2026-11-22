import { useState } from 'react';
import type { MediaItem } from '../galleryApi';

interface MediaGridProps {
  media: MediaItem[];
  isLoading: boolean;
  onOpenLightbox: (index: number) => void;
  onOpenUpload: () => void;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  mediaTypeFilter: 'ALL' | 'IMAGE' | 'VIDEO';
  setMediaTypeFilter: (type: 'ALL' | 'IMAGE' | 'VIDEO') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function MediaGrid({
  media,
  isLoading,
  onOpenLightbox,
  onOpenUpload,
  onDeleteMedia,
  mediaTypeFilter,
  setMediaTypeFilter,
  searchQuery,
  setSearchQuery,
}: MediaGridProps) {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  const filteredMedia = media.filter((item) => {
    if (mediaTypeFilter === 'IMAGE' && item.mediaType !== 'IMAGE') return false;
    if (mediaTypeFilter === 'VIDEO' && item.mediaType !== 'VIDEO') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.originalFileName.toLowerCase().includes(q);
      const matchCaption = item.caption ? item.caption.toLowerCase().includes(q) : false;
      const matchAlbum = item.albumName ? item.albumName.toLowerCase().includes(q) : false;
      return matchName || matchCaption || matchAlbum;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e8dfd5] shadow-xs">
        {/* Media Type Tabs */}
        <div className="flex items-center gap-1 bg-[#fafaf3] p-1 rounded-xl border border-[#e8dfd5]/80">
          <button
            type="button"
            onClick={() => setMediaTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mediaTypeFilter === 'ALL'
              ? 'bg-white text-[#1a1c18] shadow-xs border border-[#e8dfd5]'
              : 'text-[#86736d] hover:text-[#1a1c18]'
              }`}
          >
            All Media ({media.length})
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter('IMAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mediaTypeFilter === 'IMAGE'
              ? 'bg-white text-[#1a1c18] shadow-xs border border-[#e8dfd5]'
              : 'text-[#86736d] hover:text-[#1a1c18]'
              }`}
          >
            Photos ({media.filter((m) => m.mediaType === 'IMAGE').length})
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter('VIDEO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mediaTypeFilter === 'VIDEO'
              ? 'bg-white text-[#1a1c18] shadow-xs border border-[#e8dfd5]'
              : 'text-[#86736d] hover:text-[#1a1c18]'
              }`}
          >
            Videos ({media.filter((m) => m.mediaType === 'VIDEO').length})
          </button>
        </div>

        {/* Search & Grid/List switcher */}
        <div className="flex items-center gap-2 grow sm:grow-0 justify-end">
          <div className="relative grow sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file or caption..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#e8dfd5] text-xs text-[#1a1c18] focus:outline-hidden focus:ring-2 focus:ring-[#8a4b35]/20 focus:border-[#8a4b35]"
            />
            <svg
              className="w-3.5 h-3.5 text-[#86736d] absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center border border-[#e8dfd5] rounded-xl overflow-hidden bg-[#fafaf3]">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'GRID' ? 'bg-white text-[#8a4b35] shadow-xs' : 'text-[#86736d]'
                }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'LIST' ? 'bg-white text-[#8a4b35] shadow-xs' : 'text-[#86736d]'
                }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-[#f5f2eb] rounded-2xl border border-[#e8dfd5]/60" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMedia.length === 0 && (
        <div className="bg-white rounded-3xl p-10 border border-[#e8dfd5] text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#fbf6f0] text-[#8a4b35] flex items-center justify-center mx-auto border border-[#e8dfd5]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1a1c18]">
              {searchQuery ? 'No media matching your search' : 'No photos or videos yet'}
            </h3>
            <p className="text-xs text-[#86736d] max-w-xs mx-auto mt-1">
              {searchQuery
                ? 'Try clearing the search query or changing album filter.'
                : 'Upload pre-wedding shoots, ceremony reels, and celebrations directly to your cloud gallery.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#8a4b35] text-white hover:bg-[#723c2a] shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload First Media
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'GRID' && filteredMedia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(index)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#f5f2eb] border border-[#e8dfd5] shadow-2xs hover:shadow-md hover:border-[#8a4b35]/50 transition-all cursor-pointer"
            >
              {item.mediaType === 'VIDEO' ? (
                <div className="w-full h-full relative bg-[#2c1810]">
                  <video
                    src={item.viewUrl}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                    preload="metadata"
                  />
                  {/* Video Play Overlay Badge */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-[#8a4b35] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <GridImageWithFallback item={item} />
              )}

              {/* Hover Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white pointer-events-none">
                <span className="text-[11px] font-medium truncate drop-shadow">
                  {item.caption || item.originalFileName}
                </span>
                <span className="text-[10px] text-white/70">
                  {item.albumName || (item.mediaType === 'VIDEO' ? 'Video' : 'Photo')}
                </span>
              </div>

              {/* Top Quick Action Buttons */}
              <div
                className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={item.downloadUrl}
                  download={item.originalFileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center transition-colors cursor-pointer"
                  title="Download"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${item.originalFileName}"?`)) {
                      onDeleteMedia(item.id);
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'LIST' && filteredMedia.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8dfd5] divide-y divide-[#f0eae3] overflow-hidden shadow-xs">
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(index)}
              className="p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#fafaf3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-[#f5f2eb] overflow-hidden shrink-0 border border-[#e8dfd5]">
                  {item.mediaType === 'VIDEO' ? (
                    <div className="w-full h-full bg-[#2c1810] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  ) : (
                    <ListImageWithFallback item={item} />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-[#1a1c18] truncate">
                    {item.caption || item.originalFileName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#86736d] mt-0.5">
                    <span className="uppercase text-[10px] font-semibold tracking-wider text-[#8a4b35]">
                      {item.mediaType}
                    </span>
                    {item.albumName && <span>• {item.albumName}</span>}
                    {item.eventName && <span>• {item.eventName}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <a
                  href={item.downloadUrl}
                  download={item.originalFileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-[#e8dfd5] text-xs font-semibold text-[#6b5e59] hover:bg-white transition-colors"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${item.originalFileName}"?`)) {
                      onDeleteMedia(item.id);
                    }
                  }}
                  className="p-1.5 text-[#c0392b] hover:bg-[#fef0f0] rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridImageWithFallback({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!item.viewUrl || imageError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#f7f4ee]">
        <div className="w-9 h-9 rounded-full bg-white border border-[#e8dfd5] text-[#8a4b35] flex items-center justify-center mb-1 shadow-2xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-[10px] text-[#6b5e59] font-medium line-clamp-1 max-w-full px-1">
          {item.originalFileName}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-[#f5f2eb] animate-pulse" />
      )}
      <img
        src={item.viewUrl}
        alt={item.caption || item.originalFileName}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function ListImageWithFallback({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!item.viewUrl || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f7f4ee] text-[#8a4b35]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-[#f5f2eb] animate-pulse" />
      )}
      <img
        src={item.viewUrl}
        alt={item.caption || item.originalFileName}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
