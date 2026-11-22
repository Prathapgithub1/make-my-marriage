import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import type { Album } from '../galleryApi';
import {
  requestUploadUrl,
  uploadFileDirectToS3,
  confirmMediaUpload,
} from '../galleryApi';

interface EventOption {
  id: string;
  name: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  albums: Album[];
  events: EventOption[];
  preselectedAlbumId?: string;
}

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  albums,
  events,
  preselectedAlbumId,
}: MediaUploadModalProps) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(preselectedAlbumId || '');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const addFilesToQueue = (fileList: FileList | File[]) => {
    const newItems: QueuedFile[] = [];
    Array.from(fileList).forEach((file) => {
      // Validate file size (100MB max)
      const isOversized = file.size > 100 * 1024 * 1024;
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : '';

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: isOversized ? 'ERROR' : 'PENDING',
        errorMessage: isOversized ? 'File exceeds 100MB limit' : undefined,
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  }, []);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
    // reset input value so re-selecting same file works
    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const uploadSingleItem = async (item: QueuedFile) => {
    try {
      // 1. Mark as uploading
      setQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'UPLOADING', progress: 5 } : f)),
      );

      // 2. Request pre-signed S3 PUT URL from backend
      const presigned = await requestUploadUrl({
        originalFileName: item.file.name,
        mimeType: item.file.type || 'image/jpeg',
        sizeBytes: item.file.size,
        albumId: selectedAlbumId || undefined,
        eventId: selectedEventId || undefined,
        caption: caption.trim() || undefined,
      });

      // 3. Upload file directly to AWS S3 via pre-signed URL with progress tracking
      await uploadFileDirectToS3(presigned.uploadUrl, item.file, {
        uploadHeaders: presigned.uploadHeaders,
        onProgress: (pct) => {
          setQueue((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: Math.min(95, pct) } : f)),
          );
        },
      });

      // 4. Confirm upload with backend
      await confirmMediaUpload({
        mediaId: presigned.mediaId,
      });

      // 5. Mark completed
      setQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'COMPLETED', progress: 100 } : f)),
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setQueue((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'ERROR', errorMessage: errorMsg } : f,
        ),
      );
    }
  };

  const startUploadAll = async () => {
    setIsUploadingAll(true);
    const pendingItems = queue.filter((item) => item.status === 'PENDING' || item.status === 'ERROR');

    // Run uploads concurrently with pool limit of 3
    const concurrency = 3;
    const itemsToProcess = [...pendingItems];

    const worker = async () => {
      while (itemsToProcess.length > 0) {
        const nextItem = itemsToProcess.shift();
        if (nextItem) {
          await uploadSingleItem(nextItem);
        }
      }
    };

    const workers = Array(Math.min(concurrency, itemsToProcess.length))
      .fill(null)
      .map(() => worker());

    await Promise.all(workers);
    setIsUploadingAll(false);
    onUploadComplete();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFiles = queue.length;
  const completedFiles = queue.filter((f) => f.status === 'COMPLETED').length;
  const hasPending = queue.some((f) => f.status === 'PENDING' || f.status === 'ERROR');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#e8dfd5] shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0eae3]">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1a1c18]">
              Upload Media
            </h2>
            <p className="text-xs text-[#86736d] mt-0.5">
              Direct encrypted upload to wedding gallery cloud vault
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploadingAll}
            className="w-8 h-8 rounded-full bg-[#f8f5ee] hover:bg-[#ede7de] text-[#86736d] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {/* Metadata selectors (Album, Event, Caption) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1a1c18] mb-1">
                Assign to Album
              </label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8dfd5] text-xs text-[#1a1c18] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8a4b35]/20 focus:border-[#8a4b35]"
              >
                <option value="">No album (All Media)</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c18] mb-1">
                Link to Event Ceremony
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8dfd5] text-xs text-[#1a1c18] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8a4b35]/20 focus:border-[#8a4b35]"
              >
                <option value="">No linked event</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1c18] mb-1">
              Shared Caption or Notes (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Haldi ceremony highlights with family"
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl border border-[#e8dfd5] text-xs text-[#1a1c18] focus:outline-hidden focus:ring-2 focus:ring-[#8a4b35]/20 focus:border-[#8a4b35]"
            />
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragActive
                ? 'border-[#8a4b35] bg-[#8a4b35]/5'
                : 'border-[#d8c2bb] hover:border-[#8a4b35]/60 bg-[#fafaf3]'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-white border border-[#e8dfd5] text-[#8a4b35] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1a1c18]">
              Drop photos and videos here, or{' '}
              <span className="text-[#8a4b35] underline decoration-[#8a4b35]/40">browse files</span>
            </p>
            <p className="text-[11px] text-[#86736d] mt-1">
              Supports JPEG, PNG, WebP, MP4, MOV, WebM up to 100MB per file
            </p>
          </div>

          {/* Selected File List */}
          {queue.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#86736d]">
                <span>
                  Files to upload ({completedFiles} of {totalFiles} completed)
                </span>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  disabled={isUploadingAll}
                  className="text-[#c0392b] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#e8dfd5] bg-white text-xs"
                  >
                    {/* Thumbnail preview */}
                    <div className="w-11 h-11 rounded-lg bg-[#f0eae3] shrink-0 overflow-hidden flex items-center justify-center border border-[#e8dfd5]">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-[#8a4b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* File details & progress bar */}
                    <div className="grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#1a1c18] truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#86736d] shrink-0">
                          {formatSize(item.size)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {item.status === 'UPLOADING' && (
                        <div className="w-full bg-[#f0eae3] h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#8a4b35] h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="mt-1 flex items-center gap-2">
                        {item.status === 'COMPLETED' && (
                          <span className="text-[10px] font-semibold text-[#27ae60] flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded to S3
                          </span>
                        )}
                        {item.status === 'UPLOADING' && (
                          <span className="text-[10px] text-[#8a4b35] font-medium animate-pulse">
                            Uploading {item.progress}%
                          </span>
                        )}
                        {item.status === 'ERROR' && (
                          <span className="text-[10px] text-[#c0392b] font-medium">
                            {item.errorMessage || 'Upload failed'}
                          </span>
                        )}
                        {item.status === 'PENDING' && (
                          <span className="text-[10px] text-[#86736d]">Ready</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (Retry or Remove) */}
                    <div className="shrink-0 flex items-center gap-1">
                      {item.status === 'ERROR' && (
                        <button
                          type="button"
                          onClick={() => uploadSingleItem(item)}
                          className="px-2 py-1 rounded bg-[#fef0f0] text-[#c0392b] hover:bg-[#fadbd8] text-[10px] font-semibold cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                      {item.status !== 'UPLOADING' && (
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="p-1 rounded-full text-[#86736d] hover:bg-[#f5f2eb] hover:text-[#c0392b] transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#f0eae3] bg-[#fafaf3] flex items-center justify-between gap-3">
          <div className="text-xs text-[#86736d]">
            {queue.length > 0
              ? `${completedFiles}/${totalFiles} uploaded`
              : 'Select files to begin upload'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploadingAll}
              className="px-4 py-2 text-xs font-semibold text-[#6b5e59] hover:text-[#1a1c18] hover:bg-white rounded-xl border border-[#e8dfd5] transition-colors cursor-pointer"
            >
              {completedFiles > 0 && !hasPending ? 'Done' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={startUploadAll}
              disabled={isUploadingAll || !hasPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#8a4b35] hover:bg-[#723c2a] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploadingAll
                ? 'Uploading to S3...'
                : `Upload ${queue.filter((f) => f.status === 'PENDING' || f.status === 'ERROR').length} files`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
