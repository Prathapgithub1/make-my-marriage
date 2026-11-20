import { useEffect, useState, useRef, useCallback } from 'react';
import type { MediaItem } from '../galleryApi';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onDelete: (mediaId: string) => Promise<void>;
}

export function MediaLightboxModal({
  isOpen,
  onClose,
  mediaList,
  currentIndex,
  onNavigate,
  onDelete,
}: MediaLightboxModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentItem = mediaList[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < mediaList.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, mediaList.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Reset video play state on media change
  useEffect(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  if (!isOpen || !currentItem) return null;

  const handleDeleteCurrent = async () => {
    if (window.confirm(`Delete "${currentItem.originalFileName}" from this wedding gallery?`)) {
      try {
        setIsDeleting(true);
        await onDelete(currentItem.id);
        if (mediaList.length <= 1) {
          onClose();
        } else if (currentIndex >= mediaList.length - 1) {
          onNavigate(currentIndex - 1);
        }
      } catch (err) {
        console.error('Failed to delete media:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentItem.viewUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md select-none">
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xs text-white/60 font-medium shrink-0">
            {currentIndex + 1} / {mediaList.length}
          </div>
          <div className="h-4 w-px bg-white/20 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate max-w-xs sm:max-w-md">
              {currentItem.caption || currentItem.originalFileName}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-white/50">
              {currentItem.albumName && <span>Album: {currentItem.albumName}</span>}
              {currentItem.eventName && <span>• Event: {currentItem.eventName}</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy view URL"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Download */}
          <a
            href={currentItem.downloadUrl}
            download={currentItem.originalFileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download full quality media"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteCurrent}
            disabled={isDeleting}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Delete photo/video"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <div className="h-4 w-px bg-white/20" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close viewer (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Media Stage */}
      <div className="grow relative flex items-center justify-center p-4 sm:p-8 min-h-0">
        {/* Previous Navigation Arrow */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-20 cursor-pointer border border-white/20 shadow-lg"
            title="Previous (Left arrow)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Media Content (Image or HTML5 Video) */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {currentItem.mediaType === 'VIDEO' ? (
            currentItem.viewUrl ? (
              <div className="relative max-w-4xl max-h-[75vh] rounded-2xl overflow-hidden bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  src={currentItem.viewUrl}
                  controls
                  playsInline
                  className="max-h-[75vh] w-auto rounded-2xl"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 max-w-sm">
                <p className="text-sm font-medium text-white">{currentItem.originalFileName}</p>
                <p className="text-xs text-white/60 mt-1">Video stream unavailable</p>
              </div>
            )
          ) : (
            <div className="relative flex items-center justify-center max-h-[78vh] max-w-full">
              <LightboxImageWithFallback item={currentItem} />
            </div>
          )}
        </div>

        {/* Next Navigation Arrow */}
        {currentIndex < mediaList.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-20 cursor-pointer border border-white/20 shadow-lg"
            title="Next (Right arrow)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {mediaList.length > 1 && (
        <div className="h-20 border-t border-white/10 shrink-0 bg-black/60 px-4 flex items-center justify-center gap-2 overflow-x-auto">
          {mediaList.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(idx)}
              className={`relative h-14 w-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${idx === currentIndex
                ? 'border-[#8a4b35] scale-105 shadow-md'
                : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
            >
              {item.mediaType === 'VIDEO' ? (
                <div className="w-full h-full bg-[#2c1810] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              ) : item.viewUrl ? (
                <img
                  src={item.viewUrl}
                  alt={item.originalFileName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">
                  IMG
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LightboxImageWithFallback({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [item.viewUrl]);

  if (!item.viewUrl || imageError) {
    return (
      <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 max-w-sm">
        <svg className="w-12 h-12 text-white/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium text-white">{item.originalFileName}</p>
        <p className="text-xs text-white/60 mt-1">Unable to display full preview</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {!imageLoaded && (
        <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      )}
      <img
        src={item.viewUrl}
        alt={item.caption || item.originalFileName}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
      />
    </div>
  );
}
