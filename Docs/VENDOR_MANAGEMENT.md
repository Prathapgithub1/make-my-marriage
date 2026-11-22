# Make My Marriage — Vendor Management Module (V1)

**Implementation Date:** November 14, 2026  
**Status:** Complete End-to-End  
**Product Specification:** PRD V1 (§9.16, §9.17), REST API Design V1 (§5.7)  
**UI Reference:** Google Stitch — Curated Wedding Partners & Production (`media_1794638042921_1a38ffd3.jpg`)

---

## 1. Overview & Architectural Design

The **Vendor Management Module** provides a comprehensive vendor production suite for Make My Marriage. Organizers can scout, contract, track, and disburse milestone payments to wedding vendors across 18 curated verticals (palace venues, catering, photography, floral mandap artists, bridal couture, entertainment, and logistics).

Every booking made with a vendor is synchronized in real-time with the core **Expenses & Budget Management** system, maintaining precise integer-paise financial consistency across the entire wedding fund.

---

## 2. Database Architecture & Schema Changes

Prisma Migration: `prisma/migrations/20261114120000_add_vendor_management_suite/migration.sql`

### Enums
- **`VendorCategory`**: `VENUE`, `CATERING`, `PHOTOGRAPHY`, `VIDEOGRAPHY`, `DECORATION`, `CLOTHING`, `JEWELLERY`, `MAKEUP`, `MUSIC`, `ENTERTAINMENT`, `TRANSPORT`, `TRAVEL`, `INVITATIONS`, `GIFTS`, `OTHER`, `PLANNER`, `FLORIST`, `ACCOMMODATION`
- **`VendorPriceRange`**: `BUDGET`, `MODERATE`, `PREMIUM`, `LUXURY`
- **`VendorStatus`**: `SHORTLISTED`, `CONTACTED`, `NEGOTIATING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- **`VendorBookingStatus`**: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`

### Models
1. **`Vendor` (`vendors`)**:
   - Primary vendor business record scoped to `weddingId`.
   - Contact person, phone, email, website, physical address, city, state.
   - Pricing notes, price range tier (`VendorPriceRange`), star rating (`NUMERIC(2,1)`), status (`VendorStatus`), shortlist flag (`isFavorite`), internal team notes.
2. **`VendorService` (`vendor_services`)**:
   - Itemized package offerings and service deliverables per vendor with price and inclusion flags.
3. **`VendorEvent` (`vendor_events`)**:
   - Many-to-many relationship mapping vendors to specific wedding ceremonies (`Event`).
4. **`VendorBooking` (`vendor_bookings`)**:
   - Contracted bookings per vendor linking to a specific ceremony (`eventId`) and expense (`expenseId`).
   - Tracks agreed amount, advance payment, paid amount, and remaining balance due with non-negative constraints.
5. **`VendorPayment` (`vendor_payments`)**:
   - Audit ledger of installment disbursements against a booking and vendor.
   - Stores payment date, method (`UPI`, `BANK_TRANSFER`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `CHEQUE`, `OTHER`), payer name, and bank transaction reference.
6. **`VendorDocument` (`vendor_documents`)**:
   - Signed contracts, quotes, riders, and portfolio design uploads.

---

## 3. Booking & Expenses Financial Synchronization

Creating or updating a vendor booking automatically synchronizes with the wedding ledger:
1. **Booking Creation:** An `Expense` record is created or linked in the same database transaction. `Expense.vendorId`, `Expense.amount`, `Expense.paidAmount`, and `Expense.paymentStatus` (`PENDING`, `PARTIAL`, or `PAID`) are set.
2. **Payment Recording:** Disbursing an installment against a booking creates a `VendorPayment`, updates `VendorBooking.paidAmount` and `balanceDue`, updates `Expense.paidAmount`, and updates `Expense.paymentStatus` atomically.
3. **Precision Math:** All calculations use exact integer-paise math (`money.ts`), eliminating IEEE 754 floating-point rounding errors.

---

## 4. Backend REST API Endpoints (`/api/v1/vendors`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/vendors` | List vendors with search, category, status, favorite filters & pagination |
| `POST` | `/api/v1/vendors` | Create vendor partner with event mappings |
| `GET` | `/api/v1/vendors/:vendorId` | Get detailed vendor profile with packages, bookings, and events |
| `PATCH` | `/api/v1/vendors/:vendorId` | Update vendor profile and event assignments |
| `DELETE` | `/api/v1/vendors/:vendorId` | Delete vendor (and dependent records) within wedding |
| `PATCH` | `/api/v1/vendors/:vendorId/favorite` | Toggle favorite / shortlisted heart status |
| `PATCH` | `/api/v1/vendors/:vendorId/status` | Quick update vendor status in pipeline |
| `POST` | `/api/v1/vendors/:vendorId/services` | Add itemized service/package to vendor |
| `DELETE` | `/api/v1/vendors/:vendorId/services/:serviceId` | Remove itemized service package |
| `GET` | `/api/v1/vendors/bookings` | List all ceremony bookings across all vendors |
| `POST` | `/api/v1/vendors/:vendorId/bookings` | Create booking linked to ceremony and synced with Expenses |
| `PATCH` | `/api/v1/vendors/bookings/:bookingId` | Update booking details, agreed amounts, contract ref |
| `DELETE` | `/api/v1/vendors/bookings/:bookingId` | Delete booking and unlink corresponding expense |
| `GET` | `/api/v1/vendors/payments` | List payment ledger transactions across all vendors |
| `POST` | `/api/v1/vendors/bookings/:bookingId/payments` | Record payment installment against booking and sync with expense |
| `GET` | `/api/v1/vendors/dashboard` | Aggregated KPIs, pipeline funnel, budget by tier, milestones & audit trail |
| `GET` | `/api/v1/vendors/comparison?vendorIds=...` | Side-by-side comparison matrix for 2–4 vendors |
| `GET` | `/api/v1/vendors/calendar` | Day-of production schedule milestones and conflict detection |

---

## 5. Frontend Implementation & Stitch Design

Located at `apps/web/src/features/vendors/`:
- **`VendorsPage.tsx`**: Main orchestrator managing sub-nav tabs, live sync badge, TanStack Query cache, and modal states.
- **`VendorDashboardView.tsx` (View State 1)**:
  - 8 KPI cards: Total Vendors, Active & Confirmed, Shortlisted / Review, Pending Signatures, Vendor Budget Cap, Total Amount Paid, Remaining Balance, Upcoming 14 Days.
  - Booking Pipeline Funnel: 5 visual workflow stages with proportional bar fills.
  - Budget Allocation by Tier: Segmented progress bar and category cards.
  - Upcoming Vendor Milestones: Chronological list with ceremony tags and status.
  - Activity & Audit Trail: Real-time update stream.
- **`VendorDirectoryView.tsx` (View State 2)**:
  - Grid / Table toggle, search bar, category dropdown filter, status tabs, rating stars, favorite toggle heart, quick booking and payment triggers.
- **`VendorCategoriesView.tsx` (View State 3)**:
  - 18 Curated Wedding Categories with allocation totals, settlement bars, and quick category filters.
- **`VendorProfileDeepDiveView.tsx` (View State 4)**:
  - Hero profile card, financial ribbon, and 4 sub-tabs: Overview & Packages, Bookings & Contracts, Payment History, Team Notes & Riders.
- **`VendorPaymentsLedgerView.tsx` (View State 5)**:
  - 4 financial ledger KPI cards, transaction table with search, vendor and method filters.
- **`VendorComparisonView.tsx` (View State 6)**:
  - Multi-vendor selector chips (2–4 vendors) with side-by-side metric comparison table.
- **`VendorScheduleTimelineView.tsx` (View State 7)**:
  - Production schedule timeline with date cards, category icons, ceremony mapping, and high-density conflict alert banner.
- **Modals**:
  - `AddEditVendorModal.tsx`: Accessible dialog for vendor curation and event assignment.
  - `VendorBookingModal.tsx`: Ceremony booking creation with advance deposit calculations.
  - `RecordVendorPaymentModal.tsx`: Installment recorder with balance validation and method selector.

---

## 6. Verification & Quality Assurance

- **Prisma Migrations:** `npx prisma migrate status --config prisma7.config.ts` -> Database schema is up to date.
- **Prisma Client:** `npm run prisma:generate` -> Generated Prisma Client 7.10.0.
- **TypeScript:** `npm run typecheck` -> Clean pass (0 errors across `@mmm/api` and `@mmm/web`).
- **ESLint:** `npx eslint` -> Clean pass (0 errors across all vendor source and test files).
- **Backend API Tests:** `npm --workspace @mmm/api test -- tests/vendors.test.ts` -> **13 passed, 13 total**.
- **Frontend Web Tests:** `npm --workspace @mmm/web test -- tests/vendors.test.tsx` -> **4 passed, 4 total**.
- **Cross-module Expenses Tests:** `tests/expenses.test.ts` -> **12 passed, 12 total**; `tests/expenses.test.tsx` -> **5 passed, 5 total**.

