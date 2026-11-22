-- AlterEnum
ALTER TYPE "VendorCategory" ADD VALUE IF NOT EXISTS 'PLANNER';
ALTER TYPE "VendorCategory" ADD VALUE IF NOT EXISTS 'FLORIST';
ALTER TYPE "VendorCategory" ADD VALUE IF NOT EXISTS 'ACCOMMODATION';

-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'PLANNER';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'FLORIST';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'ACCOMMODATION';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VendorPriceRange" AS ENUM ('BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VendorStatus" AS ENUM ('SHORTLISTED', 'CONTACTED', 'NEGOTIATING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VendorBookingStatus" AS ENUM ('SHORTLISTED', 'CONTACTED', 'NEGOTIATING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "vendors" 
ADD COLUMN IF NOT EXISTS "address" VARCHAR,
ADD COLUMN IF NOT EXISTS "city" VARCHAR,
ADD COLUMN IF NOT EXISTS "state" VARCHAR,
ADD COLUMN IF NOT EXISTS "cover_image_url" VARCHAR,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "pricing" VARCHAR,
ADD COLUMN IF NOT EXISTS "price_range" "VendorPriceRange",
ADD COLUMN IF NOT EXISTS "rating" DECIMAL,
ADD COLUMN IF NOT EXISTS "status" "VendorStatus" NOT NULL DEFAULT 'SHORTLISTED',
ADD COLUMN IF NOT EXISTS "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_services" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "price" DECIMAL,
    "is_included" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendor_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_events" (
    "wedding_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "notes" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_events_pkey" PRIMARY KEY ("vendor_id","event_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_bookings" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "event_id" UUID,
    "expense_id" UUID,
    "service_name" VARCHAR NOT NULL,
    "status" "VendorBookingStatus" NOT NULL DEFAULT 'SHORTLISTED',
    "booking_date" DATE,
    "service_date" DATE,
    "agreed_amount" DECIMAL NOT NULL DEFAULT 0,
    "advance_payment" DECIMAL NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "contract_url" VARCHAR,
    "contract_ref" VARCHAR,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendor_bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_bookings_agreed_amount_non_negative_chk" CHECK ("agreed_amount" >= 0),
    CONSTRAINT "vendor_bookings_paid_amount_bounds_chk" CHECK ("paid_amount" >= 0 AND "paid_amount" <= "agreed_amount")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_payments" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "booking_id" UUID,
    "vendor_id" UUID NOT NULL,
    "expense_id" UUID,
    "amount" DECIMAL NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_status" "ExpensePaymentStatus" NOT NULL DEFAULT 'PAID',
    "payment_method" "ExpensePaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "paid_by" VARCHAR,
    "reference_number" VARCHAR,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_payments_amount_positive_chk" CHECK ("amount" > 0)
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_documents" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "booking_id" UUID,
    "title" VARCHAR NOT NULL,
    "file_url" VARCHAR NOT NULL,
    "file_type" VARCHAR,
    "file_size" BIGINT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "vendors_wedding_id_status_idx" ON "vendors"("wedding_id", "status");
CREATE INDEX IF NOT EXISTS "vendors_wedding_id_is_favorite_idx" ON "vendors"("wedding_id", "is_favorite");

CREATE INDEX IF NOT EXISTS "vendor_services_wedding_id_vendor_id_idx" ON "vendor_services"("wedding_id", "vendor_id");

CREATE INDEX IF NOT EXISTS "vendor_events_wedding_id_vendor_id_idx" ON "vendor_events"("wedding_id", "vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_events_event_id_vendor_id_idx" ON "vendor_events"("event_id", "vendor_id");

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_bookings_expense_id_key" ON "vendor_bookings"("expense_id");
CREATE INDEX IF NOT EXISTS "vendor_bookings_wedding_id_vendor_id_idx" ON "vendor_bookings"("wedding_id", "vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_bookings_wedding_id_status_idx" ON "vendor_bookings"("wedding_id", "status");
CREATE INDEX IF NOT EXISTS "vendor_bookings_wedding_id_event_id_idx" ON "vendor_bookings"("wedding_id", "event_id");
CREATE INDEX IF NOT EXISTS "vendor_bookings_wedding_id_service_date_idx" ON "vendor_bookings"("wedding_id", "service_date");

CREATE INDEX IF NOT EXISTS "vendor_payments_wedding_id_booking_id_idx" ON "vendor_payments"("wedding_id", "booking_id");
CREATE INDEX IF NOT EXISTS "vendor_payments_wedding_id_vendor_id_idx" ON "vendor_payments"("wedding_id", "vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_payments_wedding_id_payment_date_idx" ON "vendor_payments"("wedding_id", "payment_date");

CREATE INDEX IF NOT EXISTS "vendor_documents_wedding_id_vendor_id_idx" ON "vendor_documents"("wedding_id", "vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_documents_wedding_id_booking_id_idx" ON "vendor_documents"("wedding_id", "booking_id");

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_bookings" ADD CONSTRAINT "vendor_bookings_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_bookings" ADD CONSTRAINT "vendor_bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_bookings" ADD CONSTRAINT "vendor_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_bookings" ADD CONSTRAINT "vendor_bookings_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "vendor_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "vendor_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

