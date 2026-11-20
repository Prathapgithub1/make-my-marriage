import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import { env } from '../../config/env';
import { ACCEPTED_VIDEO_MIME_TYPES } from './schemas';
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
  RequestUploadUrlInput,
  ConfirmUploadInput,
  UpdateMediaInput,
  ListMediaQuery,
} from './schemas';
import { defaultS3Service, type S3ServiceOperations } from './s3';

export interface GallerySummaryDTO {
  totalPhotos: number;
  totalVideos: number;
  totalAlbums: number;
  storageBytesUsed: number;
  storageFormatted: string;
  recentMedia: MediaItemDTO[];
}

export interface AlbumDTO {
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

export interface MediaItemDTO {
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

export interface ListMediaResult {
  media: MediaItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadUrlResult {
  mediaId: string;
  uploadUrl: string;
  s3ObjectKey: string;
  expiresInSeconds: number;
  mediaType: 'IMAGE' | 'VIDEO';
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
}

export interface GalleryServiceOperations {
  getGallerySummary(userId: string): Promise<GallerySummaryDTO>;
  listAlbums(userId: string): Promise<AlbumDTO[]>;
  createAlbum(userId: string, input: CreateAlbumInput): Promise<AlbumDTO>;
  getAlbumById(userId: string, albumId: string): Promise<AlbumDTO>;
  updateAlbum(userId: string, albumId: string, input: UpdateAlbumInput): Promise<AlbumDTO>;
  deleteAlbum(userId: string, albumId: string): Promise<{ deleted: true }>;
  requestUploadUrl(userId: string, input: RequestUploadUrlInput): Promise<UploadUrlResult>;
  confirmUpload(userId: string, input: ConfirmUploadInput): Promise<MediaItemDTO>;
  listMedia(userId: string, query: ListMediaQuery): Promise<ListMediaResult>;
  getMediaDownloadUrl(userId: string, mediaId: string): Promise<{ downloadUrl: string; fileName: string; mimeType: string }>;
  updateMedia(userId: string, mediaId: string, input: UpdateMediaInput): Promise<MediaItemDTO>;
  deleteMedia(userId: string, mediaId: string): Promise<{ deleted: true }>;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function createGalleryService(
  prismaClient?: PrismaClient,
  s3Service: S3ServiceOperations = defaultS3Service,
): GalleryServiceOperations {
  function requireDatabase(): PrismaClient {
    if (!prismaClient) {
      throw new AppError(500, 'DATABASE_UNAVAILABLE', 'Database connection not initialized.');
    }
    return prismaClient;
  }

  async function resolveCallerWorkspace(
    database: PrismaClient,
    userId: string,
  ): Promise<{ weddingId: string; membershipId: string }> {
    const membership = await database.weddingMembership.findUnique({
      where: { userId },
      select: { id: true, weddingId: true },
    });

    if (!membership) {
      throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
    }

    return { weddingId: membership.weddingId, membershipId: membership.id };
  }

  async function validateEventAssociation(
    database: PrismaClient,
    weddingId: string,
    eventId?: string | null,
  ) {
    if (!eventId) return;
    const event = await database.event.findFirst({
      where: { id: eventId, weddingId },
    });
    if (!event) {
      throw new AppError(400, 'INVALID_ASSOCIATION', 'Related event does not belong to this wedding workspace.');
    }
  }

  async function validateAlbumAssociation(
    database: PrismaClient,
    weddingId: string,
    albumId?: string | null,
  ) {
    if (!albumId) return;
    const album = await database.galleryAlbum.findFirst({
      where: { id: albumId, weddingId },
    });
    if (!album) {
      throw new AppError(400, 'INVALID_ASSOCIATION', 'Related album does not belong to this wedding workspace.');
    }
  }

  async function mapMediaToDTO(media: {
    id: string;
    weddingId: string;
    albumId: string | null;
    album?: { name: string } | null;
    eventId: string | null;
    event?: { name: string } | null;
    uploadedByUserId: string | null;
    s3ObjectKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: bigint;
    mediaType: 'IMAGE' | 'VIDEO';
    uploadStatus: 'PENDING' | 'UPLOADED' | 'FAILED' | 'DELETED';
    caption: string | null;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    createdAt: Date;
    uploadedAt: Date | null;
  }): Promise<MediaItemDTO> {
    const viewUrl = (await s3Service.createPresignedGetUrl(media.s3ObjectKey)) || '';
    const downloadUrl =
      (await s3Service.createPresignedGetUrl(media.s3ObjectKey, {
        downloadFileName: media.originalFileName,
      })) || '';

    return {
      id: media.id,
      weddingId: media.weddingId,
      albumId: media.albumId,
      albumName: media.album?.name ?? null,
      eventId: media.eventId,
      eventName: media.event?.name ?? null,
      uploadedByUserId: media.uploadedByUserId,
      s3ObjectKey: media.s3ObjectKey,
      originalFileName: media.originalFileName,
      mimeType: media.mimeType,
      sizeBytes: Number(media.sizeBytes),
      mediaType: media.mediaType,
      uploadStatus: media.uploadStatus,
      caption: media.caption,
      width: media.width,
      height: media.height,
      durationSeconds: media.durationSeconds,
      viewUrl,
      downloadUrl,
      createdAt: media.createdAt.toISOString(),
      uploadedAt: media.uploadedAt ? media.uploadedAt.toISOString() : null,
    };
  }

  return {
    async getGallerySummary(userId: string): Promise<GallerySummaryDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const [totalPhotos, totalVideos, totalAlbums, storageAgg, recentItems] = await Promise.all([
        database.galleryMedia.count({
          where: { weddingId, uploadStatus: 'UPLOADED', mediaType: 'IMAGE', deletedAt: null },
        }),
        database.galleryMedia.count({
          where: { weddingId, uploadStatus: 'UPLOADED', mediaType: 'VIDEO', deletedAt: null },
        }),
        database.galleryAlbum.count({
          where: { weddingId },
        }),
        database.galleryMedia.aggregate({
          where: { weddingId, uploadStatus: 'UPLOADED', deletedAt: null },
          _sum: { sizeBytes: true },
        }),
        database.galleryMedia.findMany({
          where: { weddingId, uploadStatus: 'UPLOADED', deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            album: { select: { name: true } },
            event: { select: { name: true } },
          },
        }),
      ]);

      const storageBytes = Number(storageAgg._sum.sizeBytes ?? 0n);
      const recentMedia = await Promise.all(recentItems.map((item) => mapMediaToDTO(item)));

      return {
        totalPhotos,
        totalVideos,
        totalAlbums,
        storageBytesUsed: storageBytes,
        storageFormatted: formatBytes(storageBytes),
        recentMedia,
      };
    },

    async listAlbums(userId: string): Promise<AlbumDTO[]> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const albums = await database.galleryAlbum.findMany({
        where: { weddingId },
        orderBy: { createdAt: 'asc' },
        include: {
          event: { select: { name: true } },
          _count: {
            select: {
              media: {
                where: { uploadStatus: 'UPLOADED', deletedAt: null },
              },
            },
          },
        },
      });

      return Promise.all(
        albums.map(async (album) => {
          let coverImageKey = album.coverImageKey;
          if (!coverImageKey) {
            const latestMedia = await database.galleryMedia.findFirst({
              where: {
                albumId: album.id,
                weddingId,
                uploadStatus: 'UPLOADED',
                mediaType: 'IMAGE',
                deletedAt: null,
              },
              orderBy: { createdAt: 'desc' },
              select: { s3ObjectKey: true },
            });
            if (latestMedia) {
              coverImageKey = latestMedia.s3ObjectKey;
            }
          }

          let coverImageUrl: string | null = null;
          if (coverImageKey) {
            coverImageUrl = (await s3Service.createPresignedGetUrl(coverImageKey)) || null;
          }

          return {
            id: album.id,
            weddingId: album.weddingId,
            name: album.name,
            description: album.description,
            eventId: album.eventId,
            eventName: album.event?.name ?? null,
            coverImageKey: album.coverImageKey,
            coverImageUrl,
            mediaCount: album._count.media,
            createdAt: album.createdAt.toISOString(),
            updatedAt: album.updatedAt.toISOString(),
          };
        }),
      );
    },

    async createAlbum(userId: string, input: CreateAlbumInput): Promise<AlbumDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      await validateEventAssociation(database, weddingId, input.eventId);

      // Check unique name per wedding
      const existing = await database.galleryAlbum.findFirst({
        where: { weddingId, name: { equals: input.name, mode: 'insensitive' } },
      });
      if (existing) {
        throw new AppError(409, 'ALREADY_EXISTS', 'An album with this name already exists.');
      }

      const created = await database.galleryAlbum.create({
        data: {
          weddingId,
          name: input.name,
          description: input.description ?? null,
          eventId: input.eventId ?? null,
          coverImageKey: input.coverImageKey ?? null,
        },
        include: {
          event: { select: { name: true } },
        },
      });

      let coverImageUrl: string | null = null;
      if (created.coverImageKey) {
        coverImageUrl = (await s3Service.createPresignedGetUrl(created.coverImageKey)) || null;
      }

      return {
        id: created.id,
        weddingId: created.weddingId,
        name: created.name,
        description: created.description,
        eventId: created.eventId,
        eventName: created.event?.name ?? null,
        coverImageKey: created.coverImageKey,
        coverImageUrl,
        mediaCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    },

    async getAlbumById(userId: string, albumId: string): Promise<AlbumDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const album = await database.galleryAlbum.findFirst({
        where: { id: albumId, weddingId },
        include: {
          event: { select: { name: true } },
          _count: {
            select: {
              media: {
                where: { uploadStatus: 'UPLOADED', deletedAt: null },
              },
            },
          },
        },
      });

      if (!album) {
        throw new AppError(404, 'NOT_FOUND', 'Album not found in this wedding workspace.');
      }

      let coverImageKey = album.coverImageKey;
      if (!coverImageKey) {
        const latestMedia = await database.galleryMedia.findFirst({
          where: {
            albumId: album.id,
            weddingId,
            uploadStatus: 'UPLOADED',
            mediaType: 'IMAGE',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          select: { s3ObjectKey: true },
        });
        if (latestMedia) {
          coverImageKey = latestMedia.s3ObjectKey;
        }
      }

      let coverImageUrl: string | null = null;
      if (coverImageKey) {
        coverImageUrl = (await s3Service.createPresignedGetUrl(coverImageKey)) || null;
      }

      return {
        id: album.id,
        weddingId: album.weddingId,
        name: album.name,
        description: album.description,
        eventId: album.eventId,
        eventName: album.event?.name ?? null,
        coverImageKey: album.coverImageKey,
        coverImageUrl,
        mediaCount: album._count.media,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
      };
    },

    async updateAlbum(userId: string, albumId: string, input: UpdateAlbumInput): Promise<AlbumDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const existing = await database.galleryAlbum.findFirst({
        where: { id: albumId, weddingId },
      });
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Album not found.');
      }

      if (input.eventId) {
        await validateEventAssociation(database, weddingId, input.eventId);
      }

      if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await database.galleryAlbum.findFirst({
          where: { weddingId, name: { equals: input.name, mode: 'insensitive' }, NOT: { id: albumId } },
        });
        if (duplicate) {
          throw new AppError(409, 'ALREADY_EXISTS', 'An album with this name already exists.');
        }
      }

      const updated = await database.galleryAlbum.update({
        where: { id: albumId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
          ...(input.coverImageKey !== undefined ? { coverImageKey: input.coverImageKey } : {}),
        },
        include: {
          event: { select: { name: true } },
          _count: {
            select: {
              media: {
                where: { uploadStatus: 'UPLOADED', deletedAt: null },
              },
            },
          },
        },
      });

      let coverImageUrl: string | null = null;
      if (updated.coverImageKey) {
        coverImageUrl = (await s3Service.createPresignedGetUrl(updated.coverImageKey)) || null;
      }

      return {
        id: updated.id,
        weddingId: updated.weddingId,
        name: updated.name,
        description: updated.description,
        eventId: updated.eventId,
        eventName: updated.event?.name ?? null,
        coverImageKey: updated.coverImageKey,
        coverImageUrl,
        mediaCount: updated._count.media,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    },

    async deleteAlbum(userId: string, albumId: string): Promise<{ deleted: true }> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const existing = await database.galleryAlbum.findFirst({
        where: { id: albumId, weddingId },
      });
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Album not found.');
      }

      // Detach media from album so media is not lost
      await database.galleryMedia.updateMany({
        where: { albumId, weddingId },
        data: { albumId: null },
      });

      await database.galleryAlbum.delete({
        where: { id: albumId },
      });

      return { deleted: true };
    },

    async requestUploadUrl(userId: string, input: RequestUploadUrlInput): Promise<UploadUrlResult> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      if (input.albumId) {
        await validateAlbumAssociation(database, weddingId, input.albumId);
      }
      if (input.eventId) {
        await validateEventAssociation(database, weddingId, input.eventId);
      }

      const mediaId = randomUUID();
      const normalizedMime = input.mimeType.toLowerCase();
      const isVideo = (ACCEPTED_VIDEO_MIME_TYPES as readonly string[]).includes(normalizedMime);
      const mediaType: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';

      // Clean file name and construct structured S3 key: weddings/{weddingId}/gallery/{albumId}/{mediaId}/{filename}
      const sanitizedFileName = input.originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const albumFolder = input.albumId ? input.albumId : 'general';
      const s3ObjectKey = `weddings/${weddingId}/gallery/${albumFolder}/${mediaId}/${sanitizedFileName}`;

      // Reserve staging DB record
      await database.galleryMedia.create({
        data: {
          id: mediaId,
          weddingId,
          albumId: input.albumId ?? null,
          eventId: input.eventId ?? null,
          uploadedByUserId: userId,
          s3ObjectKey,
          originalFileName: input.originalFileName,
          mimeType: normalizedMime,
          sizeBytes: BigInt(input.sizeBytes),
          mediaType,
          uploadStatus: 'PENDING',
          caption: input.caption ?? null,
        },
      });

      const uploadUrl = await s3Service.createPresignedPutUrl(
        s3ObjectKey,
        normalizedMime,
        env.AWS_S3_PRESIGNED_EXPIRES_SECONDS,
      );

      return {
        mediaId,
        uploadUrl,
        s3ObjectKey,
        expiresInSeconds: env.AWS_S3_PRESIGNED_EXPIRES_SECONDS,
        mediaType,
        uploadMethod: 'PUT',
        uploadHeaders: {
          'Content-Type': normalizedMime,
        },
      };
    },

    async confirmUpload(userId: string, input: ConfirmUploadInput): Promise<MediaItemDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const media = await database.galleryMedia.findFirst({
        where: { id: input.mediaId, weddingId },
        include: {
          album: { select: { name: true } },
          event: { select: { name: true } },
        },
      });

      if (!media) {
        throw new AppError(404, 'NOT_FOUND', 'Media record not found.');
      }

      // Verify physical presence in storage (S3 or local persistent storage)
      const head = await s3Service.headObject(media.s3ObjectKey);
      if (!head.exists) {
        await database.galleryMedia.update({
          where: { id: input.mediaId },
          data: { uploadStatus: 'FAILED' },
        });
        throw new AppError(
          400,
          'UPLOAD_VERIFICATION_FAILED',
          'Media file could not be verified in storage. Please upload the file before confirming.',
        );
      }

      const updated = await database.galleryMedia.update({
        where: { id: input.mediaId },
        data: {
          uploadStatus: 'UPLOADED',
          uploadedAt: new Date(),
          sizeBytes: head.sizeBytes ? BigInt(head.sizeBytes) : media.sizeBytes,
          ...(input.width !== undefined ? { width: input.width } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
        },
        include: {
          album: { select: { name: true } },
          event: { select: { name: true } },
        },
      });

      // If the album currently does not have a cover photo, set this as cover
      if (updated.albumId && updated.mediaType === 'IMAGE') {
        const album = await database.galleryAlbum.findUnique({
          where: { id: updated.albumId },
          select: { coverImageKey: true },
        });
        if (album && !album.coverImageKey) {
          await database.galleryAlbum.update({
            where: { id: updated.albumId },
            data: { coverImageKey: updated.s3ObjectKey },
          });
        }
      }

      return mapMediaToDTO(updated);
    },

    async listMedia(userId: string, query: ListMediaQuery): Promise<ListMediaResult> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const where: Prisma.GalleryMediaWhereInput = {
        weddingId,
        uploadStatus: 'UPLOADED',
        deletedAt: null,
      };

      if (query.albumId) {
        where.albumId = query.albumId;
      }
      if (query.eventId) {
        where.eventId = query.eventId;
      }
      if (query.mediaType) {
        where.mediaType = query.mediaType;
      }
      if (query.search) {
        where.OR = [
          { originalFileName: { contains: query.search, mode: 'insensitive' } },
          { caption: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const page = Math.max(1, query.page || 1);
      const limit = Math.max(1, Math.min(100, query.limit || 30));
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        database.galleryMedia.count({ where }),
        database.galleryMedia.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            album: { select: { name: true } },
            event: { select: { name: true } },
          },
        }),
      ]);

      const media = await Promise.all(items.map((item) => mapMediaToDTO(item)));

      return {
        media,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    },

    async getMediaDownloadUrl(
      userId: string,
      mediaId: string,
    ): Promise<{ downloadUrl: string; fileName: string; mimeType: string }> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const media = await database.galleryMedia.findFirst({
        where: { id: mediaId, weddingId, uploadStatus: 'UPLOADED', deletedAt: null },
      });

      if (!media) {
        throw new AppError(404, 'NOT_FOUND', 'Media not found.');
      }

      const downloadUrl = await s3Service.createPresignedGetUrl(media.s3ObjectKey, {
        downloadFileName: media.originalFileName,
      });

      return {
        downloadUrl,
        fileName: media.originalFileName,
        mimeType: media.mimeType,
      };
    },

    async updateMedia(userId: string, mediaId: string, input: UpdateMediaInput): Promise<MediaItemDTO> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const media = await database.galleryMedia.findFirst({
        where: { id: mediaId, weddingId, deletedAt: null },
      });
      if (!media) {
        throw new AppError(404, 'NOT_FOUND', 'Media not found.');
      }

      if (input.albumId) {
        await validateAlbumAssociation(database, weddingId, input.albumId);
      }
      if (input.eventId) {
        await validateEventAssociation(database, weddingId, input.eventId);
      }

      const updated = await database.galleryMedia.update({
        where: { id: mediaId },
        data: {
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
          ...(input.albumId !== undefined ? { albumId: input.albumId } : {}),
          ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
        },
        include: {
          album: { select: { name: true } },
          event: { select: { name: true } },
        },
      });

      return mapMediaToDTO(updated);
    },

    async deleteMedia(userId: string, mediaId: string): Promise<{ deleted: true }> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const media = await database.galleryMedia.findFirst({
        where: { id: mediaId, weddingId },
      });
      if (!media) {
        throw new AppError(404, 'NOT_FOUND', 'Media not found.');
      }

      // Delete from S3 (gracefully handled if object does not exist in S3)
      try {
        await s3Service.deleteObject(media.s3ObjectKey);
      } catch (s3Err) {
        console.warn(`[Gallery] S3 deletion for ${media.s3ObjectKey} failed:`, s3Err);
      }

      // Check if this was an album's cover
      await database.galleryAlbum.updateMany({
        where: { weddingId, coverImageKey: media.s3ObjectKey },
        data: { coverImageKey: null },
      });

      // Mark deleted in DB
      await database.galleryMedia.update({
        where: { id: mediaId },
        data: {
          uploadStatus: 'DELETED',
          deletedAt: new Date(),
        },
      });

      return { deleted: true };
    },
  };
}
