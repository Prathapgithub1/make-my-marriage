-- CreateEnum
CREATE TYPE "WeddingRole" AS ENUM ('ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "WebsiteTheme" AS ENUM ('CLASSIC', 'MINIMAL', 'MODERN');

-- CreateTable
CREATE TABLE "weddings" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "bride_name" VARCHAR(120) NOT NULL,
    "groom_name" VARCHAR(120) NOT NULL,
    "wedding_date" DATE,
    "location" VARCHAR(255),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "country" VARCHAR(120),
    "description" TEXT,
    "cover_image_key" VARCHAR(1024),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_memberships" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "WeddingRole" NOT NULL DEFAULT 'MANAGER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_settings" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "theme" "WebsiteTheme" NOT NULL DEFAULT 'CLASSIC',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "content" JSONB,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_access_tokens" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "gallery_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weddings_wedding_date_idx" ON "weddings"("wedding_date");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_memberships_user_id_key" ON "wedding_memberships"("user_id");

-- CreateIndex
CREATE INDEX "wedding_memberships_wedding_id_idx" ON "wedding_memberships"("wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "website_settings_wedding_id_key" ON "website_settings"("wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "website_settings_slug_key" ON "website_settings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_access_tokens_token_hash_key" ON "gallery_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "gallery_access_tokens_wedding_id_revoked_at_idx" ON "gallery_access_tokens"("wedding_id", "revoked_at");

-- CreateIndex
CREATE INDEX "gallery_access_tokens_expires_at_idx" ON "gallery_access_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_memberships" ADD CONSTRAINT "wedding_memberships_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_memberships" ADD CONSTRAINT "wedding_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_settings" ADD CONSTRAINT "website_settings_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_access_tokens" ADD CONSTRAINT "gallery_access_tokens_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
