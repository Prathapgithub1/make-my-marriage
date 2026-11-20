import { randomUUID } from 'node:crypto';
import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createGalleryRouter } from '../src/modules/gallery/routes';
import type {
  GalleryServiceOperations,
  GallerySummaryDTO,
  AlbumDTO,
  MediaItemDTO,
  ListMediaResult,
  UploadUrlResult,
} from '../src/modules/gallery/service';
import { createCsrfToken } from '../src/modules/auth/security';

const testAlbumId = randomUUID();
const testWeddingId = randomUUID();
const testEventId = randomUUID();
const testMediaId = randomUUID();

const mockUser = {
  id: 'user-organizer-1',
  email: 'organizer@example.com',
  displayName: 'Akshitha Rao',
};

const mockSummary: GallerySummaryDTO = {
  totalPhotos: 42,
  totalVideos: 5,
  totalAlbums: 4,
  storageBytesUsed: 157286400,
  storageFormatted: '150 MB',
  recentMedia: [],
};

const mockAlbum: AlbumDTO = {
  id: testAlbumId,
  weddingId: testWeddingId,
  name: 'Mehendi Moments',
  description: 'Vibrant henna afternoon celebration',
  eventId: testEventId,
  eventName: 'Mehendi & Sangeet',
  coverImageKey: `weddings/${testWeddingId}/gallery/images/test/cover.jpg`,
  coverImageUrl: 'https://cdn.example.com/cover.jpg',
  mediaCount: 18,
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
};

const mockMediaItem: MediaItemDTO = {
  id: testMediaId,
  weddingId: testWeddingId,
  albumId: mockAlbum.id,
  albumName: mockAlbum.name,
  eventId: mockAlbum.eventId,
  eventName: mockAlbum.eventName,
  uploadedByUserId: mockUser.id,
  s3ObjectKey: `weddings/${testWeddingId}/gallery/images/test/photo1.jpg`,
  originalFileName: 'photo1.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 2048576,
  mediaType: 'IMAGE',
  uploadStatus: 'UPLOADED',
  caption: 'Bride entering with flower veil',
  width: 1920,
  height: 1080,
  durationSeconds: null,
  viewUrl: 'https://cdn.example.com/photo1.jpg',
  downloadUrl: 'https://cdn.example.com/photo1.jpg?download=photo1.jpg',
  createdAt: '2026-11-10T10:00:00.000Z',
  uploadedAt: '2026-11-10T10:05:00.000Z',
};

const mockListMediaResult: ListMediaResult = {
  media: [mockMediaItem],
  pagination: {
    page: 1,
    limit: 30,
    total: 1,
    totalPages: 1,
  },
};

const mockUploadUrlResult: UploadUrlResult = {
  mediaId: testMediaId,
  uploadUrl: 'https://s3.us-east-1.amazonaws.com/make-my-marriage-gallery-dev-rana-2026/upload-signed-url',
  s3ObjectKey: `weddings/${testWeddingId}/gallery/general/${testMediaId}/wedding_portrait.jpg`,
  expiresInSeconds: 300,
  mediaType: 'IMAGE',
  uploadMethod: 'PUT',
  uploadHeaders: {
    'Content-Type': 'image/jpeg',
  },
};

function createMockGalleryService(): jest.Mocked<GalleryServiceOperations> {
  return {
    getGallerySummary: jest.fn().mockResolvedValue(mockSummary),
    listAlbums: jest.fn().mockResolvedValue([mockAlbum]),
    createAlbum: jest.fn().mockResolvedValue(mockAlbum),
    getAlbumById: jest.fn().mockResolvedValue(mockAlbum),
    updateAlbum: jest.fn().mockResolvedValue(mockAlbum),
    deleteAlbum: jest.fn().mockResolvedValue({ deleted: true }),
    requestUploadUrl: jest.fn().mockResolvedValue(mockUploadUrlResult),
    confirmUpload: jest.fn().mockResolvedValue(mockMediaItem),
    listMedia: jest.fn().mockResolvedValue(mockListMediaResult),
    getMediaDownloadUrl: jest.fn().mockResolvedValue({
      downloadUrl: 'https://cdn.example.com/download-url',
      fileName: 'photo1.jpg',
      mimeType: 'image/jpeg',
    }),
    updateMedia: jest.fn().mockResolvedValue(mockMediaItem),
    deleteMedia: jest.fn().mockResolvedValue({ deleted: true }),
  };
}

function createMockAuth(authenticated = true): AuthOperations {
  return {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn().mockResolvedValue(authenticated ? mockUser : null),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn().mockResolvedValue(true),
  };
}

function createTestApp(
  service: GalleryServiceOperations,
  auth: AuthOperations = createMockAuth(),
) {
  const app = express();
  app.use(express.json());

  const router = createGalleryRouter(service, auth);
  app.use('/api/v1/gallery', router);

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  };

  app.use(errorHandler);
  return app;
}

describe('Gallery Module APIs', () => {
  const csrfToken = createCsrfToken();
  const validHeaders = {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=test-session; mmm_csrf=${csrfToken}`,
    'x-csrf-token': csrfToken,
  };

  describe('GET /api/v1/gallery/summary', () => {
    it('returns gallery dashboard summary metrics', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .get('/api/v1/gallery/summary')
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPhotos).toBe(42);
      expect(res.body.data.totalVideos).toBe(5);
      expect(res.body.data.totalAlbums).toBe(4);
      expect(res.body.data.storageFormatted).toBe('150 MB');
      expect(mockService.getGallerySummary).toHaveBeenCalledWith(mockUser.id);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService, createMockAuth(false));

      const res = await request(app).get('/api/v1/gallery/summary');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Albums Endpoints', () => {
    it('lists albums on GET /api/v1/gallery/albums', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .get('/api/v1/gallery/albums')
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Mehendi Moments');
    });

    it('creates an album on POST /api/v1/gallery/albums', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/albums')
        .set(validHeaders)
        .send({
          name: 'Haldi Sunshine',
          description: 'Yellow hues and marigold flowers',
          eventId: testEventId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockService.createAlbum).toHaveBeenCalledWith(mockUser.id, {
        name: 'Haldi Sunshine',
        description: 'Yellow hues and marigold flowers',
        eventId: testEventId,
      });
    });

    it('validates album creation fields (missing name)', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/albums')
        .set(validHeaders)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('fetches album by id on GET /api/v1/gallery/albums/:albumId', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .get(`/api/v1/gallery/albums/${mockAlbum.id}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(mockAlbum.id);
    });

    it('updates an album on PATCH /api/v1/gallery/albums/:albumId', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .patch(`/api/v1/gallery/albums/${mockAlbum.id}`)
        .set(validHeaders)
        .send({ name: 'Updated Mehendi Moments' });

      expect(res.status).toBe(200);
      expect(mockService.updateAlbum).toHaveBeenCalledWith(mockUser.id, mockAlbum.id, {
        name: 'Updated Mehendi Moments',
      });
    });

    it('deletes an album on DELETE /api/v1/gallery/albums/:albumId', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .delete(`/api/v1/gallery/albums/${mockAlbum.id}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(mockService.deleteAlbum).toHaveBeenCalledWith(mockUser.id, mockAlbum.id);
    });
  });

  describe('Media Upload & Management Endpoints', () => {
    it('requests presigned upload URL on POST /api/v1/gallery/media/upload-url', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/media/upload-url')
        .set(validHeaders)
        .send({
          originalFileName: 'wedding_portrait.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 3145728,
          albumId: mockAlbum.id,
          caption: 'Sunset photo by the lake',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.mediaId).toBe(mockUploadUrlResult.mediaId);
    });

    it('rejects unsupported MIME types on upload-url request', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/media/upload-url')
        .set(validHeaders)
        .send({
          originalFileName: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 1024,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('confirms upload on POST /api/v1/gallery/media/confirm', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/media/confirm')
        .set(validHeaders)
        .send({
          mediaId: mockMediaItem.id,
          width: 1920,
          height: 1080,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockService.confirmUpload).toHaveBeenCalledWith(mockUser.id, {
        mediaId: mockMediaItem.id,
        width: 1920,
        height: 1080,
      });
    });

    it('lists uploaded media on GET /api/v1/gallery/media', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .get('/api/v1/gallery/media?albumId=' + mockAlbum.id)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.media).toHaveLength(1);
      expect(res.body.data.media[0].id).toBe(mockMediaItem.id);
    });

    it('retrieves media download URL on GET /api/v1/gallery/media/:mediaId/download', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .get(`/api/v1/gallery/media/${mockMediaItem.id}/download`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBeDefined();
      expect(res.body.data.fileName).toBe('photo1.jpg');
    });

    it('deletes media on DELETE /api/v1/gallery/media/:mediaId', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .delete(`/api/v1/gallery/media/${mockMediaItem.id}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
      expect(mockService.deleteMedia).toHaveBeenCalledWith(mockUser.id, mockMediaItem.id);
    });

    it('returns uploadHeaders and uploadMethod in upload-url response', async () => {
      const mockService = createMockGalleryService();
      const app = createTestApp(mockService);

      const res = await request(app)
        .post('/api/v1/gallery/media/upload-url')
        .set(validHeaders)
        .send({
          originalFileName: 'wedding_portrait.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 3145728,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.uploadMethod).toBe('PUT');
      expect(res.body.data.uploadHeaders).toEqual({ 'Content-Type': 'image/jpeg' });
    });
  });
});
