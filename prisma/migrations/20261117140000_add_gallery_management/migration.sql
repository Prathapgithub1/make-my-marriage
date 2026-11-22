-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "gallery_albums" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "event_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "cover_image_key" VARCHAR(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "gallery_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_media" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "album_id" UUID,
    "event_id" UUID,
    "uploaded_by_user_id" UUID,
    "s3_object_key" VARCHAR(1024) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "upload_status" "MediaUploadStatus" NOT NULL DEFAULT 'PENDING',
    "caption" VARCHAR(500),
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "uploaded_by_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "gallery_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_albums_wedding_id_name_key" ON "gallery_albums"("wedding_id", "name");

-- CreateIndex
CREATE INDEX "gallery_albums_wedding_id_created_at_idx" ON "gallery_albums"("wedding_id", "created_at");

-- CreateIndex
CREATE INDEX "gallery_albums_wedding_id_event_id_idx" ON "gallery_albums"("wedding_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_media_s3_object_key_key" ON "gallery_media"("s3_object_key");

-- CreateIndex
CREATE INDEX "gallery_media_wedding_id_status_created_at_idx" ON "gallery_media"("wedding_id", "upload_status", "created_at");

-- CreateIndex
CREATE INDEX "gallery_media_wedding_id_album_id_idx" ON "gallery_media"("wedding_id", "album_id");

-- CreateIndex
CREATE INDEX "gallery_media_wedding_id_event_id_idx" ON "gallery_media"("wedding_id", "event_id");

-- CreateIndex
CREATE INDEX "gallery_media_wedding_id_media_type_idx" ON "gallery_media"("wedding_id", "media_type");

-- AddForeignKey
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "gallery_albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
