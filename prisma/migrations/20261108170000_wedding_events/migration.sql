-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "venue_name" VARCHAR(200),
    "venue_address" VARCHAR(500),
    "dress_code" VARCHAR(120),
    "cover_image_key" VARCHAR(1024),
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_wedding_id_starts_at_idx" ON "events"("wedding_id", "starts_at");

-- CreateIndex
CREATE INDEX "events_wedding_id_status_idx" ON "events"("wedding_id", "status");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Additional Constraint (Database Design V1 Section 87)
ALTER TABLE "events" ADD CONSTRAINT "events_time_order" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" >= "starts_at");

