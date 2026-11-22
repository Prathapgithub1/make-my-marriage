# Expenses, Budgets & Vendor Ledger Module

This document describes the implemented architecture, PostgreSQL schema, REST API contracts, financial business logic, and frontend integration for the **Expenses & Budget Management** module in **Make My Marriage**.

---

## 1. Database Schema (Prisma + PostgreSQL)

Managed in `prisma/schema.prisma` and applied via migration `prisma/migrations/20261112215000_add_expenses_budgets_vendors/migration.sql`.

### Enums

- **`VendorCategory` & `ExpenseCategory`**:
  `VENUE`, `CATERING`, `PHOTOGRAPHY`, `VIDEOGRAPHY`, `DECORATION`, `CLOTHING`, `JEWELLERY`, `MAKEUP`, `MUSIC`, `ENTERTAINMENT`, `TRANSPORT`, `TRAVEL`, `INVITATIONS`, `GIFTS`, `OTHER`
- **`ExpensePaymentStatus`**:
  `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`, `CANCELLED`
- **`ExpensePaymentMethod`**:
  `UPI`, `BANK_TRANSFER`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `CHEQUE`, `OTHER`

### Tables & Relationships

1. **`vendors`**
   - Columns: `id` (UUID PK), `wedding_id` (UUID FK -> `weddings.id` `ON DELETE CASCADE`), `name` (`VARCHAR(160)`), `category` (`VendorCategory`), `contact_name` (`VARCHAR(120)`), `phone` (`VARCHAR(30)`), `email` (`VARCHAR(255)`), `website` (`VARCHAR(500)`), `notes` (`TEXT`), `created_at`, `updated_at`.
   - Indexes: `(wedding_id, category)`, `(wedding_id, name)`.

2. **`wedding_budgets`**
   - Columns: `id` (UUID PK), `wedding_id` (UUID UNIQUE FK -> `weddings.id` `ON DELETE CASCADE`), `total_budget` (`NUMERIC(12,2)`), `currency` (`CHAR(3)` default `'INR'`), `notes` (`TEXT`), `created_at`, `updated_at`.
   - Constraint: `CHECK ("total_budget" >= 0)`.

3. **`event_budgets`**
   - Columns: `id` (UUID PK), `wedding_id` (UUID FK -> `weddings.id` `ON DELETE CASCADE`), `event_id` (UUID UNIQUE FK -> `events.id` `ON DELETE CASCADE`), `allocated_budget` (`NUMERIC(12,2)`), `notes` (`TEXT`), `created_at`, `updated_at`.
   - Indexes: `(wedding_id)`.
   - Constraint: `CHECK ("allocated_budget" >= 0)`.

4. **`expenses`**
   - Columns: `id` (UUID PK), `wedding_id` (UUID FK -> `weddings.id` `ON DELETE CASCADE`), `event_id` (UUID nullable FK -> `events.id` `ON DELETE SET NULL`), `vendor_id` (UUID nullable FK -> `vendors.id` `ON DELETE SET NULL`), `created_by_user_id` (UUID nullable FK -> `users.id` `ON DELETE SET NULL`), `title` (`VARCHAR(180)`), `category` (`ExpenseCategory`), `amount` (`NUMERIC(12,2)`), `paid_amount` (`NUMERIC(12,2)` default `0`), `currency` (`CHAR(3)` default `'INR'`), `payment_status` (`ExpensePaymentStatus` default `'PENDING'`), `payment_method` (`ExpensePaymentMethod` nullable), `spent_at` (`DATE`), `due_date` (`DATE` nullable), `paid_by` (`VARCHAR(120)` nullable), `reference_number` (`VARCHAR(120)` nullable), `notes` (`TEXT` nullable), `created_at`, `updated_at`.
   - Indexes: `(wedding_id, spent_at)`, `(wedding_id, category)`, `(wedding_id, payment_status)`, `(wedding_id, event_id)`, `(wedding_id, vendor_id)`.
   - Constraints:
     - `CHECK ("amount" > 0)`
     - `CHECK ("paid_amount" >= 0 AND "paid_amount" <= "amount")`

---

## 2. REST API Endpoints

All endpoints require an authenticated session cookie (`mmm_session`), derive `weddingId` exclusively from the caller's `WeddingMembership` on the server, and enforce `requireSameOrigin` + `requireCsrf` (`mmm_csrf` + `X-CSRF-Token`) on `POST`, `PUT`, `PATCH`, and `DELETE` requests.

### Expenses & Budgets (`/api/v1/expenses`)

| Method   | Path                                      | Description                                                                                                                                                                                                                                     |
| :------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/expenses`                        | List paginated expenses with filtering (`category`, `eventId` or `'unassigned'`, `vendorId`, `paymentStatus`, `paymentMethod`, `from`, `to`, `search`), sorting (`spentAt`, `amount`, `paidAmount`, `createdAt`, `title`), and matching totals. |
| `POST`   | `/api/v1/expenses`                        | Create an expense, validating amount bounds (`paidAmount <= amount`) and same-wedding ownership of `eventId` / `vendorId`.                                                                                                                      |
| `GET`    | `/api/v1/expenses/:expenseId`             | Fetch a single expense belonging to the caller's wedding.                                                                                                                                                                                       |
| `PATCH`  | `/api/v1/expenses/:expenseId`             | Update expense attributes, associations, or settlement details.                                                                                                                                                                                 |
| `PATCH`  | `/api/v1/expenses/:expenseId/payment`     | Record or update `paidAmount`, `paymentMethod`, `paidBy`, and `referenceNumber`, automatically transitioning `paymentStatus` (`PENDING` / `PARTIAL` / `PAID`).                                                                                  |
| `DELETE` | `/api/v1/expenses/:expenseId`             | Permanently delete an expense record.                                                                                                                                                                                                           |
| `GET`    | `/api/v1/expenses/budget`                 | Retrieve overall wedding budget cap, summary KPIs, event-by-event budget allocations vs. actual spend, and general unassigned expenses.                                                                                                         |
| `PUT`    | `/api/v1/expenses/budget`                 | Upsert the overall wedding budget (`totalBudget`, `currency`, `notes`).                                                                                                                                                                         |
| `PUT`    | `/api/v1/expenses/budget/events/:eventId` | Upsert a ceremony-specific budget (`allocatedBudget`, `notes`) after verifying the event belongs to the wedding.                                                                                                                                |
| `DELETE` | `/api/v1/expenses/budget/events/:eventId` | Remove a ceremony-specific budget allocation.                                                                                                                                                                                                   |
| `GET`    | `/api/v1/expenses/summary`                | Retrieve budget summary + category, event, status, method, vendor, and monthly breakdown.                                                                                                                                                       |
| `GET`    | `/api/v1/expenses/analytics`              | Alias returning the full analytics breakdown payload.                                                                                                                                                                                           |

### Vendors (`/api/v1/vendors`)

| Method   | Path                        | Description                                                                                                        |
| :------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/vendors`           | List wedding vendors with `category` and `search` filtering, including aggregated `expenseCount` and `totalSpent`. |
| `POST`   | `/api/v1/vendors`           | Create a wedding vendor profile (used inline during expense entry as well).                                        |
| `GET`    | `/api/v1/vendors/:vendorId` | Fetch a single vendor scoped to the caller's wedding.                                                              |
| `PATCH`  | `/api/v1/vendors/:vendorId` | Update vendor contact/category details.                                                                            |
| `DELETE` | `/api/v1/vendors/:vendorId` | Delete vendor (`Expense.vendorId` automatically sets to `NULL`).                                                   |

### Example Requests & Responses

#### Create Expense (`POST /api/v1/expenses`)

```json
{
  "title": "Sangeet Live Counters Advance",
  "category": "CATERING",
  "amount": 250000,
  "paidAmount": 100000,
  "paymentStatus": "PARTIAL",
  "paymentMethod": "BANK_TRANSFER",
  "spentAt": "2026-11-10",
  "dueDate": "2026-12-01",
  "eventId": "aaaaaaaa-1111-4111-8111-111111111111",
  "vendorId": "bbbbbbbb-1111-4111-8111-111111111111",
  "paidBy": "Aisha Rao",
  "referenceNumber": "NEFT-987654"
}
```

#### Analytics Response (`GET /api/v1/expenses/analytics`)

```json
{
  "data": {
    "summary": {
      "totalBudget": "2500000.00",
      "totalAllocatedToEvents": "1500000.00",
      "unallocatedBudget": "1000000.00",
      "totalSpent": "250000.00",
      "totalPaid": "100000.00",
      "totalPending": "150000.00",
      "remainingBudget": "2250000.00",
      "budgetUtilizationPercent": 10,
      "paymentCompletionPercent": 40,
      "isOverBudget": false,
      "overBudgetAmount": "0.00",
      "expenseCount": 1,
      "hasBudgetConfigured": true,
      "currency": "INR",
      "vendorCount": 1
    },
    "byCategory": [
      {
        "category": "CATERING",
        "count": 1,
        "totalAmount": "250000.00",
        "paidAmount": "100000.00",
        "pendingAmount": "150000.00",
        "sharePercent": 100
      }
    ]
  },
  "requestId": "..."
}
```

---

## 3. Financial Business Logic

- **Exact Monetary Arithmetic (`apps/api/src/modules/expenses/money.ts`)**:
  All monetary values stored in PostgreSQL `NUMERIC(12,2)` are converted to integer paise (`1 INR = 100 paise`) before summation or subtraction and serialized back as exact 2-decimal strings (e.g., `"250000.00"`), eliminating IEEE-754 floating-point drift.
- **Cancelled Expense Handling**:
  Records with `paymentStatus = 'CANCELLED'` remain visible in the ledger list and status analytics, while being excluded from `totalSpent`, `totalPaid`, category shares, event burn totals, and vendor spend totals. `cancelledCount` and `cancelledAmount` are surfaced separately.
- **Tenant & Association Isolation**:
  Linking an `eventId` or `vendorId` verifies both entities exist under the caller's `weddingId`; foreign references fail with `400 INVALID_ASSOCIATION`.
- **Dashboard Summary Integration (`apps/api/src/modules/wedding/service.ts`)**:
  `GET /api/v1/dashboard` computes real `summary.totalExpenseAmount`, `summary.vendors`, and `summary.budget` (`totalBudget`, `totalPaidAmount`, `remainingBudget`, `hasBudgetConfigured`, `expenseCount`).

---

## 4. Frontend Implementation & Integration

- **Feature Modules (`apps/web/src/features/expenses/`)**:
  - `ExpensesPage.tsx`: Top KPI summary ribbon, overall utilization progress bar, over-budget banner, and 3 sub-views (**Expenses Ledger**, **Budget Planner**, **Reports & Analytics**), plus formula-safe CSV report export.
  - `ExpenseModal.tsx`: Create/edit form with live balance-due preview, status-to-paid synchronization, event selection, and inline **Quick Add Vendor** creation.
  - `ExpenseDetailModal.tsx`: Receipt & milestone inspector with quick payment settlement and guarded delete confirmation.
  - `BudgetModal.tsx`: Overall wedding budget cap configuration with live projected remaining preview.
  - `ExpenseAnalyticsCharts.tsx`: Pure SVG/CSS category donut chart, ceremony budget-vs-spent bars, monthly spending trend chart, payment status/method breakdowns, and top vendor leaderboard.
- **App Integration**:
  - Wired `/expenses` and `/wedding/expenses` in `apps/web/src/app/router.tsx`.
  - Connected `SummaryCard.tsx`, `QuickActions.tsx`, `DashboardPage.tsx`, and `DashboardSidebar.tsx` to live expense/budget data and `/expenses`.
  - Populated `EventDetailPage.tsx` **Expenses** tab with ceremony-filtered expenses, budget status, and deep-linked expense creation.
