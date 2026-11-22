-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('VENUE', 'CATERING', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'DECORATION', 'CLOTHING', 'JEWELLERY', 'MAKEUP', 'MUSIC', 'ENTERTAINMENT', 'TRANSPORT', 'TRAVEL', 'INVITATIONS', 'GIFTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('VENUE', 'CATERING', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'DECORATION', 'CLOTHING', 'JEWELLERY', 'MAKEUP', 'MUSIC', 'ENTERTAINMENT', 'TRANSPORT', 'TRAVEL', 'INVITATIONS', 'GIFTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpensePaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('UPI', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHEQUE', 'OTHER');

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" "VendorCategory" NOT NULL DEFAULT 'OTHER',
    "contact_name" VARCHAR(120),
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "website" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_budgets" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "total_budget" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wedding_budgets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wedding_budgets_total_budget_non_negative_chk" CHECK ("total_budget" >= 0)
);

-- CreateTable
CREATE TABLE "event_budgets" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "allocated_budget" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_budgets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_budgets_allocated_budget_non_negative_chk" CHECK ("allocated_budget" >= 0)
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "event_id" UUID,
    "vendor_id" UUID,
    "created_by_user_id" UUID,
    "title" VARCHAR(180) NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "payment_status" "ExpensePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "ExpensePaymentMethod",
    "spent_at" DATE NOT NULL,
    "due_date" DATE,
    "paid_by" VARCHAR(120),
    "reference_number" VARCHAR(120),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expenses_amount_positive_chk" CHECK ("amount" > 0),
    CONSTRAINT "expenses_paid_amount_bounds_chk" CHECK ("paid_amount" >= 0 AND "paid_amount" <= "amount")
);

-- CreateIndex
CREATE INDEX "vendors_wedding_id_category_idx" ON "vendors"("wedding_id", "category");

-- CreateIndex
CREATE INDEX "vendors_wedding_id_name_idx" ON "vendors"("wedding_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_budgets_wedding_id_key" ON "wedding_budgets"("wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_budgets_event_id_key" ON "event_budgets"("event_id");

-- CreateIndex
CREATE INDEX "event_budgets_wedding_id_idx" ON "event_budgets"("wedding_id");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_spent_at_idx" ON "expenses"("wedding_id", "spent_at");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_category_idx" ON "expenses"("wedding_id", "category");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_payment_status_idx" ON "expenses"("wedding_id", "payment_status");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_event_id_idx" ON "expenses"("wedding_id", "event_id");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_vendor_id_idx" ON "expenses"("wedding_id", "vendor_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_budgets" ADD CONSTRAINT "wedding_budgets_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budgets" ADD CONSTRAINT "event_budgets_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budgets" ADD CONSTRAINT "event_budgets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

