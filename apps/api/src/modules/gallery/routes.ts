import { Router, type Request, type Response } from 'express';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { parseCookies, SESSION_COOKIE } from '../auth/security';
import {
  authService as defaultAuthService,
  getRequestId,
  requireCsrf,
  requireSameOrigin,
  type AuthOperations,
} from '../auth/routes';
import {
  createAlbumSchema,
  updateAlbumSchema,
  requestUploadUrlSchema,
  confirmUploadSchema,
  updateMediaSchema,
  listMediaQuerySchema,
  albumIdParamSchema,
  mediaIdParamSchema,
} from './schemas';
import { createGalleryService, type GalleryServiceOperations } from './service';

const defaultGalleryService = createGalleryService(prisma);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

function formatZodDetails(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === 'string') {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

export function createGalleryRouter(
  service: GalleryServiceOperations = defaultGalleryService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // -------------------------------------------------------------
  // GALLERY DASHBOARD & SUMMARY
  // -------------------------------------------------------------
  router.get('/summary', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const summary = await service.getGallerySummary(user.id);
      res.json({
        success: true,
        data: summary,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // -------------------------------------------------------------
  // ALBUM MANAGEMENT
  // -------------------------------------------------------------
  router.get('/albums', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const albums = await service.listAlbums(user.id);
      res.json({
        success: true,
        data: albums,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/albums', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createAlbumSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(parsed.error.issues));
      }
      const album = await service.createAlbum(user.id, parsed.data);
      res.status(201).json({
        success: true,
        data: album,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/albums/:albumId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = albumIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid album ID format.');
      }
      const album = await service.getAlbumById(user.id, paramParsed.data.albumId);
      res.json({
        success: true,
        data: album,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/albums/:albumId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = albumIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid album ID format.');
      }
      const bodyParsed = updateAlbumSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(bodyParsed.error.issues));
      }
      const album = await service.updateAlbum(user.id, paramParsed.data.albumId, bodyParsed.data);
      res.json({
        success: true,
        data: album,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/albums/:albumId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = albumIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid album ID format.');
      }
      const result = await service.deleteAlbum(user.id, paramParsed.data.albumId);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // -------------------------------------------------------------
  // MEDIA MANAGEMENT & DIRECT S3 UPLOADS
  // -------------------------------------------------------------
  router.get('/media', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const queryParsed = listMediaQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(queryParsed.error.issues));
      }
      const result = await service.listMedia(user.id, queryParsed.data);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/media/upload-url', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = requestUploadUrlSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(parsed.error.issues));
      }
      const result = await service.requestUploadUrl(user.id, parsed.data);
      res.status(201).json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/media/confirm', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = confirmUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(parsed.error.issues));
      }
      const result = await service.confirmUpload(user.id, parsed.data);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/media/:mediaId/download', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = mediaIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid media ID format.');
      }
      const result = await service.getMediaDownloadUrl(user.id, paramParsed.data.mediaId);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/media/:mediaId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = mediaIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid media ID format.');
      }
      const bodyParsed = updateMediaSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed.', formatZodDetails(bodyParsed.error.issues));
      }
      const result = await service.updateMedia(user.id, paramParsed.data.mediaId, bodyParsed.data);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/media/:mediaId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = mediaIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid media ID format.');
      }
      const result = await service.deleteMedia(user.id, paramParsed.data.mediaId);
      res.json({
        success: true,
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const galleryRouter = createGalleryRouter();
