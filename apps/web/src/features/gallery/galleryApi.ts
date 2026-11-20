import { apiRequest } from '../../lib/api-client';

export interface MediaItem {
  id: string;
  weddingId: string;
  albumId: string | null;
  albumName: string | null;
  eventId: string | null;
  eventName: string | null;
  uploadedByUserId: string | null;
  s3ObjectKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: 'IMAGE' | 'VIDEO';
  uploadStatus: 'PENDING' | 'UPLOADED' | 'FAILED' | 'DELETED';
  caption: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  viewUrl: string;
  downloadUrl: string;
  createdAt: string;
  uploadedAt: string | null;
}

export interface Album {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  eventId: string | null;
  eventName: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GallerySummary {
  totalPhotos: number;
  totalVideos: number;
  totalAlbums: number;
  storageBytesUsed: number;
  storageFormatted: string;
  recentMedia: MediaItem[];
}

export interface ListMediaResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadUrlResponse {
  mediaId: string;
  uploadUrl: string;
  s3ObjectKey: string;
  expiresInSeconds: number;
  mediaType: 'IMAGE' | 'VIDEO';
  uploadMethod?: string;
  uploadHeaders?: Record<string, string>;
}

export async function getGallerySummary(): Promise<GallerySummary> {
  const res = await apiRequest<{ success: boolean; data: GallerySummary }>('/gallery/summary');
  return res.data;
}

export async function listAlbums(): Promise<Album[]> {
  const res = await apiRequest<{ success: boolean; data: Album[] }>('/gallery/albums');
  return res.data;
}

export async function createAlbum(input: {
  name: string;
  description?: string;
  eventId?: string;
  coverImageKey?: string;
}): Promise<Album> {
  const res = await apiRequest<{ success: boolean; data: Album }>('/gallery/albums', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateAlbum(
  albumId: string,
  input: {
    name?: string;
    description?: string | null;
    eventId?: string | null;
    coverImageKey?: string | null;
  },
): Promise<Album> {
  const res = await apiRequest<{ success: boolean; data: Album }>(`/gallery/albums/${albumId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteAlbum(albumId: string): Promise<{ deleted: true }> {
  const res = await apiRequest<{ success: boolean; data: { deleted: true } }>(
    `/gallery/albums/${albumId}`,
    {
      method: 'DELETE',
    },
  );
  return res.data;
}

export async function listMedia(params?: {
  albumId?: string;
  eventId?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ListMediaResponse> {
  const searchParams = new URLSearchParams();
  if (params?.albumId) searchParams.set('albumId', params.albumId);
  if (params?.eventId) searchParams.set('eventId', params.eventId);
  if (params?.mediaType) searchParams.set('mediaType', params.mediaType);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const endpoint = query ? `/gallery/media?${query}` : '/gallery/media';
  const res = await apiRequest<{ success: boolean; data: ListMediaResponse }>(endpoint);
  return res.data;
}

export async function requestUploadUrl(input: {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  albumId?: string;
  eventId?: string;
  caption?: string;
}): Promise<UploadUrlResponse> {
  const res = await apiRequest<{ success: boolean; data: UploadUrlResponse }>(
    '/gallery/media/upload-url',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function confirmMediaUpload(input: {
  mediaId: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}): Promise<MediaItem> {
  const res = await apiRequest<{ success: boolean; data: MediaItem }>('/gallery/media/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function getMediaDownloadUrl(mediaId: string): Promise<{ downloadUrl: string; fileName: string }> {
  const res = await apiRequest<{ success: boolean; data: { downloadUrl: string; fileName: string } }>(
    `/gallery/media/${mediaId}/download`,
  );
  return res.data;
}

export async function updateMedia(
  mediaId: string,
  input: {
    caption?: string | null;
    albumId?: string | null;
    eventId?: string | null;
  },
): Promise<MediaItem> {
  const res = await apiRequest<{ success: boolean; data: MediaItem }>(`/gallery/media/${mediaId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteMedia(mediaId: string): Promise<{ deleted: true }> {
  const res = await apiRequest<{ success: boolean; data: { deleted: true } }>(
    `/gallery/media/${mediaId}`,
    {
      method: 'DELETE',
    },
  );
  return res.data;
}

/**
 * Uploads a file directly to AWS S3 using the pre-signed PUT URL with progress reporting.
 */
export function uploadFileDirectToS3(
  uploadUrl: string,
  file: File,
  onProgressOrOptions?:
    | ((percent: number) => void)
    | {
      uploadHeaders?: Record<string, string>;
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
    },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);

    const onProgress =
      typeof onProgressOrOptions === 'function'
        ? onProgressOrOptions
        : onProgressOrOptions?.onProgress;
    const uploadHeaders =
      typeof onProgressOrOptions === 'object' && onProgressOrOptions !== null
        ? onProgressOrOptions.uploadHeaders
        : undefined;
    const signal =
      typeof onProgressOrOptions === 'object' && onProgressOrOptions !== null
        ? onProgressOrOptions.signal
        : undefined;

    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload was cancelled.'));
        return;
      }
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload was cancelled.'));
      });
    }

    // Set upload headers
    if (uploadHeaders && Object.keys(uploadHeaders).length > 0) {
      for (const [key, val] of Object.entries(uploadHeaders)) {
        xhr.setRequestHeader(key, val);
      }
    } else {
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`AWS S3 upload failed with status ${xhr.status}: ${xhr.statusText || 'Error'}`));
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network error during AWS S3 direct upload. Please check your network connection and S3 bucket CORS configuration.',
        ),
      );
    };

    xhr.onabort = () => {
      reject(new Error('AWS S3 upload was cancelled.'));
    };

    xhr.send(file);
  });
}
