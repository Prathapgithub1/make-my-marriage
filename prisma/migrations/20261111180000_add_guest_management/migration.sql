-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'ATTENDING', 'NOT_ATTENDING');

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(32),
    "max_guests" INTEGER NOT NULL DEFAULT 1,
    "rsvp_status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "attending_count" INTEGER NOT NULL DEFAULT 0,
    "rsvp_responded_at" TIMESTAMPTZ(6),
    "invitation_token" VARCHAR(128),
    "invitation_token_hash" VARCHAR(128),
    "invitation_expires_at" TIMESTAMPTZ(6),
    "invitation_revoked_at" TIMESTAMPTZ(6),
    "invitation_sent_at" TIMESTAMPTZ(6),
    "last_reminder_sent_at" TIMESTAMPTZ(6),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_events" (
    "guest_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_events_pkey" PRIMARY KEY ("guest_id","event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guests_invitation_token_hash_key" ON "guests"("invitation_token_hash");

-- CreateIndex
CREATE INDEX "guests_wedding_id_name_idx" ON "guests"("wedding_id", "name");

-- CreateIndex
CREATE INDEX "guests_wedding_id_rsvp_status_idx" ON "guests"("wedding_id", "rsvp_status");

-- CreateIndex
CREATE INDEX "guests_wedding_id_email_idx" ON "guests"("wedding_id", "email");

-- CreateIndex
CREATE INDEX "guest_events_event_id_guest_id_idx" ON "guest_events"("event_id", "guest_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_events" ADD CONSTRAINT "guest_events_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_events" ADD CONSTRAINT "guest_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

