# Make My Marriage
## Database Design Document

| Item | Detail |
|---|---|
| Version | V1 |
| Database | Amazon RDS PostgreSQL |
| ORM and migrations | Prisma |
| Validation | Zod + Prisma types + PostgreSQL constraints |
| Primary Tenant | Wedding |
| Status | Database Design Baseline |
| Source of truth | `schema.prisma` (19 tables, 11 enums) |
| Aligned with | System Design Architecture Document (11 October 2026) |

---

# 1. Purpose

This document defines the PostgreSQL data model for **Make My Marriage V1**.

It covers:

- Tables
- Relationships and foreign keys
- Column types and enums
- Important fields
- Indexes
- Uniqueness and check constraints
- Tenant isolation
- Authentication data
- Guest-token design
- Wedding-member invitations
- Email jobs
- Photo metadata
- Deletion strategy
- Transactions
- Data integrity rules
- Known differences between the schema and other design documents

Exact API payloads and the full migration SQL will be designed separately.

---

# 2. Database Design Principles

## 2.1 Wedding is the Tenant

Almost every domain row belongs to a Wedding.

Examples:

```text
events      → weddingId
tasks       → weddingId
guests      → weddingId
vendors     → weddingId
expenses    → weddingId
gallery_photos → weddingId
```

Every private query must include the current authenticated Wedding.

---

## 2.2 PostgreSQL is the Source of Truth

All business data lives in PostgreSQL. MongoDB Atlas is reserved for technical logs and diagnostics and never holds business data.

---

## 2.3 Normalize Relational Data

Model the domain as tables connected by foreign keys. Do not store growing collections inside a single row or JSON column.

Avoid:

```text
weddings {
    guests:   [1000 guests],
    photos:   [5000 photos],
    tasks:    [...],
    expenses: [...]
}
```

Guests, tasks, vendors, expenses and photos each have their own table with a `weddingId` foreign key.

---

## 2.4 Small 1:1 Configuration Gets Its Own Table

Information with a strict 1:1 relationship to a Wedding is stored in its own small table with a unique `weddingId`.

```text
Wedding
├── website_settings        (one per wedding)
├── livestream_settings     (one per wedding)
└── gallery_access_tokens   (guest gallery / QR access)
```

This keeps the `weddings` table narrow while still guaranteeing at most one record per wedding through a unique constraint.

---

## 2.5 Denormalize Only When Useful

For V1, avoid maintaining counters such as:

```text
wedding.totalGuests
wedding.completedTasks
wedding.totalExpenses
```

These can initially be calculated from indexed tables. At much larger scale, selective counters can be introduced.

---

## 2.6 Schema Changes Only Through Prisma Migrations

`schema.prisma` is the single source of truth for the structure. Changes are made by editing the schema and generating reviewed Prisma migrations. SQL-only constraints that Prisma cannot express (Section 87) are added as hand-reviewed SQL inside migrations.

---

# 3. Table Overview

The initial database contains the following 19 tables:

| # | Table | Purpose |
|---:|---|---|
| 1 | `users` | Member identity, unique email, password hash |
| 2 | `sessions` | Server-side sessions with token hash, expiry and revocation |
| 3 | `password_reset_tokens` | Hashed, expiring, single-use reset tokens |
| 4 | `weddings` | Central tenant record and couple details |
| 5 | `wedding_memberships` | User-to-wedding relationship and ADMIN/MANAGER role |
| 6 | `member_invitations` | Invitations for people to join a wedding |
| 7 | `events` | Wedding ceremonies and related events |
| 8 | `tasks` | Wedding tasks with optional event and assignee |
| 9 | `guests` | Guest contact data, invitation token hash, single RSVP |
| 10 | `guest_events` | Many-to-many link between guests and invited events |
| 11 | `vendors` | Vendors saved by a wedding (manual or from Google Places) |
| 12 | `expenses` | Expenses with optional event and vendor |
| 13 | `website_settings` | Public website slug, theme and publish settings |
| 14 | `livestream_settings` | Optional YouTube livestream configuration |
| 15 | `gallery_albums` | Optional grouping of photos |
| 16 | `gallery_photos` | S3 object metadata and upload state |
| 17 | `gallery_access_tokens` | Hashed guest gallery / QR tokens |
| 18 | `email_jobs` | PostgreSQL-backed email queue state |
| 19 | `rate_limit_counters` | Shared, HMAC-keyed rate-limit counters |

There is intentionally no separate table for:

```text
Guest Invitation
RSVP
Email Batch
Audit / History
```

because V1 has one invitation and one current RSVP per guest, and batches can be derived from jobs.

Technical logs are not stored in PostgreSQL; they belong in MongoDB Atlas.

---

# 4. High-Level Relationship Diagram

```text
User
├── Session                (1:N)
├── PasswordResetToken     (1:N)
└── WeddingMembership      (1:1 in V1)
         │
         ▼
      Wedding
         │
         ├── WebsiteSettings        (0..1)
         ├── LivestreamSettings     (0..1)
         ├── GalleryAccessToken     (1:N)
         │
         ├── MemberInvitation       (1:N)
         ├── Event                  (1:N)
         │      ├── Task            (optional)
         │      ├── Vendor          (optional)
         │      ├── Expense         (optional)
         │      ├── GalleryPhoto    (optional)
         │      └── GuestEvent  ◄── Guest
         ├── Task                   (1:N, optional assignee: Membership)
         ├── Guest                  (1:N)
         ├── Vendor                 (1:N) ── Expense (optional)
         ├── Expense                (1:N)
         ├── GalleryAlbum           (1:N) ── GalleryPhoto (optional)
         ├── GalleryPhoto           (1:N) ──► Amazon S3
         └── EmailJob               (1:N)

RateLimitCounter                    (standalone, not tenant-owned)
```

---

# 5. ID Strategy

Every table uses a **UUID** primary key generated by Prisma.

```text
id  String  @id  @default(uuid())  @db.Uuid
```

We do not need auto-increment or numeric IDs.

Publicly shared resources use random tokens rather than UUIDs.

```text
Guest invitation → random secret token
Gallery access   → random secret token
Password reset   → random secret token
Session          → random secret token
Member invitation→ random secret token
```

The wedding website uses a human-readable slug.

`guest_events` is the only table with a composite primary key: `(guestId, eventId)`. `rate_limit_counters` uses a UUID primary key plus a unique `(keyHash, windowStart)` pair.

---

# 6. Common Fields

Most tables contain:

```text
id         uuid
createdAt  timestamptz  default now()
updatedAt  timestamptz  maintained by Prisma (@updatedAt)
```

Wedding-owned tables additionally contain:

```text
weddingId  uuid  → weddings.id
```

Exceptions: `wedding_memberships` has `joinedAt` instead of timestamps, and `guest_events`, `sessions`, `password_reset_tokens`, `member_invitations` and `gallery_access_tokens` carry only the timestamps that match their lifecycle.

Note: `@updatedAt` and `@default(uuid())` are applied by Prisma Client, not by PostgreSQL defaults. Raw SQL inserts must supply `id` and `updatedAt` explicitly.

---

# 7. Column Type Conventions

| Concept | PostgreSQL type | Prisma type |
|---|---|---|
| Primary / foreign keys | `uuid` | `String @db.Uuid` |
| Timestamps | `timestamptz(6)` | `DateTime @db.Timestamptz(6)` |
| Date-only values | `date` | `DateTime @db.Date` |
| Money | `numeric(12,2)` | `Decimal @db.Decimal(12, 2)` |
| Currency code | `char(3)` | `String @db.Char(3)` |
| Short text | `varchar(n)` | `String @db.VarChar(n)` |
| Long text | `text` | `String @db.Text` |
| File size | `bigint` | `BigInt` |
| Flexible content | `jsonb` | `Json` |
| Status fields | PostgreSQL enum | Prisma `enum` |

Rules:

- Use `timestamptz` for every instant in time; store UTC.
- Wedding date, expense date and similar calendar values use `date`.
- Never use floating-point types for money.

---

# 8. Enums

Enums are stored as readable strings through native PostgreSQL enum types.

| Enum | Values |
|---|---|
| `WeddingRole` | ADMIN, MANAGER |
| `EventStatus` | PLANNED, CONFIRMED, COMPLETED, CANCELLED |
| `TaskStatus` | TODO, IN_PROGRESS, DONE, CANCELLED |
| `TaskPriority` | LOW, MEDIUM, HIGH, URGENT |
| `RsvpStatus` | PENDING, ACCEPTED, DECLINED |
| `VendorCategory` | VENUE, CATERING, PHOTOGRAPHY, VIDEOGRAPHY, DECORATION, MAKEUP, CLOTHING, MUSIC, TRANSPORT, INVITATIONS, OTHER |
| `ExpenseCategory` | VENUE, CATERING, PHOTOGRAPHY, VIDEOGRAPHY, DECORATION, CLOTHING, MAKEUP, MUSIC, TRANSPORT, INVITATIONS, GIFTS, OTHER |
| `WebsiteTheme` | CLASSIC, MINIMAL, MODERN |
| `EmailJobType` | PASSWORD_RESET, MEMBER_INVITATION, GUEST_INVITATION, RSVP_REMINDER |
| `EmailJobStatus` | PENDING, PROCESSING, SENT, FAILED, CANCELLED |
| `PhotoUploadStatus` | PENDING, UPLOADED, FAILED, DELETED |

Adding a value to a native enum requires a migration, which is acceptable because these sets change rarely.

---

# 9. users Table

## Table

```text
users
```

Represents authenticated Wedding Members. Guests never appear in this table.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `email` | varchar(320) | Unique |
| `passwordHash` | varchar(255) | Hash only, never plaintext |
| `displayName` | varchar(120) | Shown to other members |
| `createdAt` | timestamptz | Default now |
| `updatedAt` | timestamptz | Maintained by Prisma |

## Indexes and Constraints

```text
PRIMARY KEY (id)
UNIQUE (email)
```

This ensures a single account per email (see Section 10 for case sensitivity).

---

# 10. Email Normalization

The schema has a single `email` column with a plain unique index. In PostgreSQL that comparison is **case-sensitive**, so `Akshay@x.com` and `akshay@x.com` would be treated as different accounts.

Required approach:

```text
trim whitespace
convert to lowercase
```

before every write and lookup. Do not implement provider-specific rules such as Gmail dot removal.

Recommended hardening in a SQL migration:

```sql
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
```

The same normalization applies to `member_invitations.email`, `guests.email` lookups and `email_jobs.recipientEmail`.

---

# 11. Important Authentication Tradeoff

V1 intentionally does **not require email verification**.

Therefore:

```text
Signup
→ account immediately active
```

This simplifies onboarding but means the application does not independently prove that the registrant owns the email address.

This is an accepted V1 product decision. Password-reset emails still require control of the email account.

---

# 12. sessions Table

## Table

```text
sessions
```

Used for server-side authentication sessions.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `userId` | uuid | FK to users, cascade delete |
| `tokenHash` | varchar(128) | Unique hash of the session token |
| `createdAt` | timestamptz | Default now |
| `expiresAt` | timestamptz | Absolute expiry |
| `lastSeenAt` | timestamptz? | Optional activity tracking |
| `revokedAt` | timestamptz? | Set on logout or password reset |

The raw session token exists only in the browser cookie. PostgreSQL stores its hash.

---

# 13. Session Token Strategy

Generate a cryptographically random token.

```text
Random Session Token
       ↓
Browser Cookie
```

Database:

```text
HMAC-SHA-256 (server secret)
       ↓
tokenHash
```

On every authenticated request:

```text
Cookie Token
    ↓
Hash
    ↓
Find Session by tokenHash
    ↓
Reject if revokedAt is set or expiresAt has passed
```

This prevents the database from storing directly reusable session credentials.

## Session Indexes

```text
UNIQUE (tokenHash)
INDEX  (userId, expiresAt)
INDEX  (expiresAt)
```

PostgreSQL has no automatic TTL. Expired and revoked sessions are removed by a periodic cleanup (Section 103).

---

# 14. password_reset_tokens Table

## Table

```text
password_reset_tokens
```

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `userId` | uuid | FK to users, cascade delete |
| `tokenHash` | varchar(128) | Unique |
| `createdAt` | timestamptz | Default now |
| `expiresAt` | timestamptz | Short-lived |
| `usedAt` | timestamptz? | Set when consumed |

## Indexes

```text
UNIQUE (tokenHash)
INDEX  (userId, expiresAt)
```

Reset tokens must:

- Be random
- Expire
- Be single-use (mark `usedAt` in the same transaction that changes the password)

---

# 15. weddings Table

## Table

```text
weddings
```

This is the central tenant table.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | varchar(160) | Wedding title |
| `brideName` | varchar(120) | |
| `groomName` | varchar(120) | |
| `weddingDate` | date? | Date-only value |
| `location` | varchar(255)? | Free-text location (see Section 17) |
| `description` | text? | |
| `coverImageKey` | varchar(1024)? | S3 object key of the cover image |
| `createdByUserId` | uuid | FK to users, restrict delete |
| `createdAt` | timestamptz | |
| `updatedAt` | timestamptz | |

## Indexes

```text
INDEX (weddingDate)
```

Relationships hang off this table: memberships, member invitations, events, tasks, guests, vendors, expenses, website settings, livestream settings, albums, photos, gallery tokens and email jobs.

---

# 16. Wedding Date

The primary wedding date is stored as a **date-only value** (`date`), for example:

```text
2027-02-14
```

rather than pretending it has a specific time. This avoids timezone-related shifts such as 14 February becoming 13 February during UTC conversion.

Event times (`events.startsAt`, `events.endsAt`) are `timestamptz` and are rendered in the wedding's time zone. The current schema has no `timeZone` column; see Section 104.

---

# 17. Wedding Location

The schema stores location as one optional `location` string (up to 255 characters).

This is enough for display. The System Design describes structured location data (formatted address, city, state, country, coordinates and Google Place ID) to drive vendor discovery. If that is required, add those columns to `weddings` (Section 104).

No spatial index is required initially because vendor discovery occurs through Google Places rather than internal geographic queries.

---

# 18. website_settings Table

## Table

```text
website_settings
```

There is exactly one website configuration per Wedding.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | Unique FK to weddings, cascade delete |
| `slug` | varchar(180) | Unique, stable public identifier |
| `theme` | WebsiteTheme | Default CLASSIC |
| `isPublished` | boolean | Default false |
| `content` | jsonb? | Structured website content and settings |
| `publishedAt` | timestamptz? | |
| `createdAt` / `updatedAt` | timestamptz | |

`content` holds structured website content only. Core wedding data (names, date, events) stays in relational columns and is rendered by the React theme components.

---

# 19. Wedding Slug

Example:

```text
akshay-princi-14022027
```

Constraints:

```text
UNIQUE (slug)
UNIQUE (weddingId)
```

If a collision occurs:

```text
akshay-princi-14022027-2
```

Uniqueness is enforced by PostgreSQL; the application should retry with a suffix when it receives a unique-violation error rather than relying only on a pre-check.

Once created, the slug remains stable. Changing wedding names or the date must not automatically update it.

---

# 20. gallery_access_tokens Table

## Table

```text
gallery_access_tokens
```

Holds the guest gallery / QR access token for a wedding.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `tokenHash` | varchar(128) | Unique |
| `createdAt` | timestamptz | |
| `expiresAt` | timestamptz? | Optional expiry |
| `revokedAt` | timestamptz? | Set when revoked |

## Indexes

```text
UNIQUE (tokenHash)
INDEX  (weddingId, revokedAt)
INDEX  (expiresAt)
```

The raw token exists only in the shared URL:

```text
/gallery/super-secret-random-token
```

Only the hash is persisted. The token should be generated cryptographically, have high entropy and remain stable, because rotating it invalidates printed QR codes. Because there is a table rather than one column, a wedding can issue a new token and revoke the old one explicitly. Normal operation uses one active, non-revoked token per wedding.

---

# 21. livestream_settings Table

## Table

```text
livestream_settings
```

Livestream is a 1:1 Wedding property.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | Unique FK to weddings, cascade delete |
| `youtubeLiveUrl` | varchar(2048)? | Validated YouTube URL |
| `isEnabled` | boolean | Default false |
| `createdAt` / `updatedAt` | timestamptz | |

---

# 22. wedding_memberships Table

## Table

```text
wedding_memberships
```

Represents the relationship between an authenticated User and a Wedding.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `userId` | uuid | Unique FK to users, cascade delete |
| `role` | WeddingRole | Default MANAGER |
| `joinedAt` | timestamptz | Default now |

---

# 23. Why Membership is Separate

We could store:

```text
user.weddingId
user.role
```

but a Membership table better represents the domain. It also allows future expansion to:

```text
one user → multiple weddings
```

by dropping a single unique constraint, without redesigning the database.

---

# 24. Membership Constraints

V1 allows:

```text
one User → one Wedding
```

Therefore:

```text
UNIQUE (userId)
UNIQUE (weddingId, id)
INDEX  (weddingId, role)
```

`UNIQUE (userId)` is the V1 rule. `UNIQUE (weddingId, id)` exists so other tables can reference a membership together with its wedding through a composite foreign key (Section 77).

---

# 25. Membership Integrity

Application logic must enforce:

- A wedding always has at least one ADMIN (Section 81)
- A Manager cannot modify memberships
- A user cannot join two weddings
- A removed member immediately loses wedding access

---

# 26. member_invitations Table

## Table

```text
member_invitations
```

Used before the invited person becomes a Wedding Member.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `email` | varchar(320) | Normalized (lowercase) invitee email |
| `role` | WeddingRole | Default MANAGER |
| `tokenHash` | varchar(128) | Unique |
| `invitedByUserId` | uuid | FK to users, restrict delete |
| `createdAt` | timestamptz | |
| `expiresAt` | timestamptz | |
| `acceptedAt` | timestamptz? | |
| `revokedAt` | timestamptz? | |

There is no status column. State is derived:

```text
ACCEPTED  → acceptedAt IS NOT NULL
REVOKED   → revokedAt IS NOT NULL
EXPIRED   → neither set AND expiresAt < now
PENDING   → none of the above
```

---

# 27. Member Invitation Indexes

```text
UNIQUE (tokenHash)
INDEX  (weddingId, email)
INDEX  (expiresAt)
```

Recommended partial uniqueness (SQL migration): only one open invitation per wedding and email.

```sql
CREATE UNIQUE INDEX member_invitations_open_key
ON member_invitations ("weddingId", lower(email))
WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL;
```

PostgreSQL index predicates cannot use `now()`, so an expired but unrevoked invitation still occupies the slot. Re-inviting the same email must first revoke the old invitation in the same transaction.

---

# 28. Invitation Acceptance

When an invite is accepted:

```text
Validate Token
    ↓
Validate Expiry and not revoked
    ↓
Validate Signed-in User Email
    ↓
Ensure User Has No Existing Membership
    ↓
Create WeddingMembership
    ↓
Set Invitation acceptedAt
```

Membership creation and the invitation update happen in one Prisma transaction. The unique `userId` constraint on memberships protects against a user joining twice, and a conditional update (`acceptedAt IS NULL`) protects against two concurrent acceptances.

---

# 29. events Table

## Table

```text
events
```

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `name` | varchar(160) | Free-form name |
| `description` | text? | |
| `startsAt` | timestamptz? | |
| `endsAt` | timestamptz? | |
| `venueName` | varchar(200)? | |
| `venueAddress` | varchar(500)? | |
| `status` | EventStatus | Default PLANNED |
| `createdAt` / `updatedAt` | timestamptz | |

## Indexes

```text
INDEX (weddingId, startsAt)
INDEX (weddingId, status)
```

---

# 30. Event Name and Status

`name` remains free-form, for example Mehendi, Sangeet, Wedding or Family Dinner. The schema has no event-type enum; presets can be offered by the UI.

`status` tracks the lifecycle:

```text
PLANNED → CONFIRMED → COMPLETED
                    ↘ CANCELLED
```

---

# 31. Event Timestamps

Event date and time are stored as UTC timestamps (`timestamptz`):

```text
startsAt
endsAt
```

and rendered in the wedding's time zone. When both are set, `endsAt` must not be earlier than `startsAt` (Section 87).

---

# 32. Event Deletion

Events are referenced by tasks, vendors, expenses, photos and guest invitations.

Foreign keys define what happens when an event row is deleted:

```text
tasks.eventId           → SET NULL
vendors.eventId         → SET NULL
expenses.eventId        → SET NULL
gallery_photos.eventId  → SET NULL
guest_events.eventId    → CASCADE (invitation link removed)
```

Recommended V1 approach: **do not hard delete events in normal use**. Set `status = CANCELLED` instead, which preserves history and relationships. Hard deletion remains possible and is safe for referential integrity, but silently detaches related rows.

---
# 33. tasks Table

## Table

```text
tasks
```

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `eventId` | uuid? | FK to events, set null |
| `assignedToMembershipId` | uuid? | FK to wedding_memberships, set null |
| `title` | varchar(180) | |
| `description` | text? | |
| `status` | TaskStatus | Default TODO |
| `priority` | TaskPriority | Default MEDIUM |
| `dueAt` | timestamptz? | |
| `completedAt` | timestamptz? | |
| `createdAt` / `updatedAt` | timestamptz | |

---

# 34. Why Assign to Membership Instead of User

Prefer:

```text
assignedToMembershipId
```

over:

```text
assignedToUserId
```

because assignment represents:

> this person acting as a member of this Wedding.

It also makes same-wedding validation explicit, and removing a member automatically clears their assignments (set null).

---

# 35. Task Integrity Rules

When assigning a task:

```text
Task.weddingId
must equal
Membership.weddingId
```

When linking an Event:

```text
Task.weddingId
must equal
Event.weddingId
```

A plain foreign key only proves the referenced row exists, not that it belongs to the same wedding. Service code must enforce this, and Section 77 describes optional database-level enforcement.

---

# 36. Task Indexes

```text
INDEX (weddingId, status, dueAt)
INDEX (weddingId, dueAt)
```

Add `(weddingId, assignedToMembershipId, status)` or `(weddingId, eventId)` only if real query plans show they are needed.

---

# 37. Task Deletion

Tasks can be hard deleted. They are leaf-level operational data and are not required as a dependency by other V1 modules.

When a task moves to `DONE`, `completedAt` is set; moving back clears it.

---

# 38. guests Table

## Table

```text
guests
```

One Guest row represents one invitation. It does not represent every person in a family individually.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `name` | varchar(160) | |
| `email` | varchar(320)? | Optional |
| `phone` | varchar(32)? | Optional, stored as text |
| `invitationTokenHash` | varchar(128)? | Unique hash of the invitation token |
| `invitationExpiresAt` | timestamptz? | Optional link expiry |
| `invitationRevokedAt` | timestamptz? | Set when the link is revoked |
| `rsvpStatus` | RsvpStatus | Default PENDING |
| `attendingCount` | int | Default 0 |
| `rsvpRespondedAt` | timestamptz? | Time of the latest response |
| `notes` | text? | |
| `createdAt` / `updatedAt` | timestamptz | |

---

# 39. Why Invitation Data Lives on Guest

V1 has:

```text
one Guest
→ one invitation link
→ one RSVP
```

Therefore a separate `guest_invitations` or `rsvps` table adds unnecessary complexity. The Guest row owns the invitation token hash, link lifecycle and RSVP.

If the product later needs multiple invitation versions, per-person responses, per-event responses or RSVP history, these can be split into new tables.

---

# 40. Guest Invitation Token

Generate the token when the Guest is created, using cryptographically secure randomness (at least 32 bytes). The URL contains the raw token; the database stores only `invitationTokenHash`.

```text
/invite/Fkm28KmSx92L...
        ↓ hash
invitationTokenHash
```

The hash is unique, and `invitationExpiresAt` / `invitationRevokedAt` allow a link to be expired or revoked without deleting the guest.

Note: with hash-only storage the original link cannot be shown to the organiser again. The System Design (Section 22) describes a stable-sharing exception that stores a retrievable token. Section 104 lists this as a decision to settle before building the share-link feature.

---

# 41. Guest RSVP

Initial state:

```text
rsvpStatus     = PENDING
attendingCount = 0
```

If attending:

```text
rsvpStatus     = ACCEPTED
attendingCount = 3
```

If not:

```text
rsvpStatus     = DECLINED
attendingCount = 0
```

`rsvpRespondedAt` records when the guest last responded. A guest may return to the same link and change the response.

---

# 42. RSVP Constraints

```text
PENDING  → attendingCount = 0
DECLINED → attendingCount = 0
ACCEPTED → attendingCount > 0
```

These are enforced in Zod validation, the service layer and a PostgreSQL check constraint (Section 87).

The schema has no capacity field, so `attendingCount <= maximum` cannot be validated yet. If the product needs a per-invitation maximum, add a `maxGuests` column and extend the check to `attendingCount <= maxGuests` (Section 104).

---

# 43. guest_events Table

## Table

```text
guest_events
```

Records which events a guest is invited to.

| Column | Type | Notes |
|---|---|---|
| `guestId` | uuid | FK to guests, cascade delete |
| `eventId` | uuid | FK to events, cascade delete |
| `createdAt` | timestamptz | |

```text
PRIMARY KEY (guestId, eventId)
INDEX (eventId, guestId)
```

The composite primary key prevents duplicate invitations. The reverse index supports "who is invited to this event".

A guest can be invited to several events but submits **one overall RSVP** (V1 decision). Individual household members are not modelled.

---

# 44. Guest Indexes

```text
UNIQUE (invitationTokenHash)
INDEX  (weddingId, name)
INDEX  (weddingId, rsvpStatus)
INDEX  (weddingId, email)
```

Guest email is **not** globally unique. Two invitations may legitimately use the same family or household email.

---

# 45. Guest Deletion

Guests can be hard deleted. Deleting a Guest automatically:

- removes their `guest_events` rows (cascade)
- makes their invitation link invalid, because the token hash no longer exists

Pending email jobs for that guest must also be cancelled by the service layer (Section 104 notes that `email_jobs` has no guest reference to find them).

---

# 46. vendors Table

## Table

```text
vendors
```

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `eventId` | uuid? | Optional FK to events, set null |
| `name` | varchar(180) | |
| `category` | VendorCategory | Default OTHER |
| `contactName` | varchar(120)? | |
| `email` | varchar(320)? | |
| `phone` | varchar(32)? | |
| `websiteUrl` | varchar(2048)? | |
| `address` | varchar(500)? | |
| `googlePlaceId` | varchar(255)? | Set when added from Google Places |
| `notes` | text? | |
| `createdAt` / `updatedAt` | timestamptz | |

---

# 47. Vendor Event Relationship

In V1 each vendor links to **at most one** event through `eventId`. If a vendor serves several events, either leave it unlinked or introduce a `vendor_events` join table later (open decision, Section 105).

---

# 48. Google Places Vendors

When a user selects a Google Places result:

```text
Google Vendor
     ↓
Copy useful fields
     ↓
Create internal Vendor
```

Store `googlePlaceId` and copy name, address, phone and website. The internal vendor remains usable even if Google becomes unavailable later.

---

# 49. Vendor Indexes and Deletion

```text
INDEX (weddingId, category)
INDEX (weddingId, name)
INDEX (googlePlaceId)
```

Optional partial uniqueness (SQL migration) to prevent adding the same place twice to a wedding:

```sql
CREATE UNIQUE INDEX vendors_wedding_place_key
ON vendors ("weddingId", "googlePlaceId")
WHERE "googlePlaceId" IS NOT NULL;
```

Vendors may be referenced by expenses. Deleting a vendor sets `expenses.vendorId` to null, so the expense survives but loses the vendor link. If historical vendor names matter, copy the vendor name into the expense title when recording it.

---

# 50. expenses Table

## Table

```text
expenses
```

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `eventId` | uuid? | Optional FK to events, set null |
| `vendorId` | uuid? | Optional FK to vendors, set null |
| `title` | varchar(180) | |
| `description` | text? | |
| `category` | ExpenseCategory | Default OTHER |
| `amount` | numeric(12,2) | Exact decimal money |
| `currency` | char(3) | Default INR |
| `spentAt` | date? | Date of the expense |
| `createdAt` / `updatedAt` | timestamptz | |

---

# 51. Money Storage

Do not store monetary values as floating-point numbers.

The schema uses exact decimals:

```text
amount   numeric(12,2)
currency char(3) = 'INR'
```

Prisma maps this to `Decimal`, so ₹1,234.50 is stored exactly. Never convert it to a JavaScript `number` for arithmetic; use Prisma's `Decimal` or aggregate in the database.

The maximum representable value is 9,999,999,999.99, which is far above any wedding budget.

---

# 52. Expense Categories

Allowed values (`ExpenseCategory`):

```text
VENUE
CATERING
PHOTOGRAPHY
VIDEOGRAPHY
DECORATION
CLOTHING
MAKEUP
MUSIC
TRANSPORT
INVITATIONS
GIFTS
OTHER
```

A future version may support custom categories. The Expense Tracker does not implement budgets or payment schedules.

---

# 53. Expense Integrity

If `eventId` exists:

```text
Expense.weddingId
=
Event.weddingId
```

If `vendorId` exists:

```text
Expense.weddingId
=
Vendor.weddingId
```

The schema does not record which member created an expense.

---

# 54. Expense Indexes

```text
INDEX (weddingId, spentAt)
INDEX (weddingId, category)
```

For dashboard calculations:

```text
SUM(amount)
WHERE weddingId = currentWedding
```

No denormalized total is necessary initially.

---

# 55. Expense Deletion

Expenses can be hard deleted in V1. If audit or history requirements emerge later, soft deletion can be introduced.

---

# 56. gallery_albums Table

## Table

```text
gallery_albums
```

Optional grouping of photos.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `name` | varchar(160) | |
| `description` | text? | |
| `createdAt` / `updatedAt` | timestamptz | |

```text
UNIQUE (weddingId, name)
INDEX  (weddingId, createdAt)
```

Deleting an album sets `gallery_photos.albumId` to null; the photos remain.

---

# 57. gallery_photos Table

## Table

```text
gallery_photos
```

Stores metadata only. The image bytes live in private Amazon S3.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid | FK to weddings, cascade delete |
| `albumId` | uuid? | Optional FK to gallery_albums, set null |
| `eventId` | uuid? | Optional FK to events, set null |
| `s3ObjectKey` | varchar(1024) | Unique S3 object key |
| `originalFileName` | varchar(255) | Display only, never used as a key |
| `mimeType` | varchar(120) | |
| `sizeBytes` | bigint | |
| `uploadStatus` | PhotoUploadStatus | Default PENDING |
| `uploadedByGuest` | boolean | Default false |
| `createdAt` | timestamptz | Reservation time |
| `uploadedAt` | timestamptz? | Set when upload completes |
| `deletedAt` | timestamptz? | Set when deleted |

---

# 58. Photo Upload Lifecycle

```text
Request upload URL
      ↓
Row created: PENDING
      ↓
Browser uploads directly to S3
      ↓
Server verifies object
      ↓
UPLOADED  (visible in gallery)

Failure           → FAILED
Organiser delete  → DELETED (hidden)
```

Only `UPLOADED` rows appear in gallery queries. `DELETED` rows act as hidden tombstones so that a late upload confirmation cannot bring a deleted photo back.

Photos uploaded through the shared gallery link have `uploadedByGuest = true`. Because the link is shared, we do not know which specific guest uploaded the photo. That is acceptable for V1.

---

# 59. S3 Object Key

Store only the storage identifier:

```text
s3ObjectKey
```

Example:

```text
weddings/3f2c.../gallery/8d92...jpg
```

Recommended hierarchy:

```text
weddings/
   {weddingId}/
      covers/
      events/
      gallery/
```

Do not persist temporary presigned URLs, and do not use filenames supplied by guests as object identifiers. The weddingId segment is always derived by the server, never chosen by the client.

---

# 60. Photo Indexes

```text
UNIQUE (s3ObjectKey)
INDEX  (weddingId, createdAt)
INDEX  (weddingId, uploadStatus, createdAt)
```

For gallery pagination use cursor ordering on:

```text
createdAt DESC
id DESC
```

Because `id` is a random UUID, it serves only as a tie-breaker, not as a time ordering.

---

# 61. Photo Deletion

Photo deletion needs two operations:

```text
Delete S3 object
+
Mark metadata DELETED (set deletedAt)
```

Preferred workflow:

```text
Attempt S3 deletion
    ↓
Update row to DELETED
```

Failure handling should prevent the UI from claiming success if the storage operation failed. A cleanup process can later remove old tombstones and handle rare orphaned objects.

---

# 62. Cover Images

Wedding cover images are also stored in S3. Because a wedding has at most one cover image, `weddings.coverImageKey` stores the object key directly rather than creating a photo row. `gallery_photos` is reserved for gallery photos.

---

# 63. email_jobs Table

## Table

```text
email_jobs
```

PostgreSQL-backed queue for outgoing email. Bulk campaigns (guest invitations, RSVP reminders) always use it. The enum also allows password-reset and member-invitation jobs.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `weddingId` | uuid? | FK to weddings, cascade delete |
| `type` | EmailJobType | |
| `status` | EmailJobStatus | Default PENDING |
| `recipientEmail` | varchar(320) | |
| `templateDataEncrypted` | text | Encrypted payload |
| `idempotencyKey` | varchar(180)? | Unique |
| `attempts` | int | Default 0 |
| `availableAt` | timestamptz | Earliest processing time |
| `lockedAt` | timestamptz? | Set when claimed |
| `sentAt` | timestamptz? | |
| `lastError` | text? | |
| `createdAt` / `updatedAt` | timestamptz | |

`weddingId` is nullable so that account-level email such as password reset need not belong to a wedding.

---

# 64. Why One Job Per Email

For 500 guests:

```text
500 email_jobs rows
```

rather than:

```text
1 giant job containing 500 recipients
```

This makes individual retries easier, isolates failures, makes progress measurable and simplifies duplicate protection.

Progress for a campaign can be derived by counting jobs by status for the wedding and type. The schema has no `batchId` column (Section 104).

---

# 65. Email Idempotency

Every bulk job should carry a unique `idempotencyKey`, built conceptually from:

```text
emailType + guestId + campaign identifier
```

The unique index reduces accidental duplicate jobs. Resend provider-level idempotency can additionally be used when sending.

---

# 66. Email Job Indexes

```text
UNIQUE (idempotencyKey)
INDEX  (status, availableAt, createdAt)
INDEX  (weddingId, createdAt)
```

The worker's first query is:

```text
status = PENDING
AND
availableAt <= now
ORDER BY createdAt
```

---

# 67. Email Job Claiming

The API service may run several Fargate tasks, so the claim must be atomic. Use a single statement with row locking:

```sql
UPDATE email_jobs
SET status = 'PROCESSING',
    "lockedAt" = now(),
    attempts = attempts + 1,
    "updatedAt" = now()
WHERE id IN (
  SELECT id FROM email_jobs
  WHERE status = 'PENDING' AND "availableAt" <= now()
  ORDER BY "createdAt"
  LIMIT 25
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

`FOR UPDATE SKIP LOCKED` lets concurrent workers claim different rows without waiting on each other. It is run through Prisma's raw query support.

---

# 68. Recovering Stuck Jobs

A task may stop after:

```text
PENDING → PROCESSING
```

but before sending. Jobs with:

```text
status = PROCESSING
AND
lockedAt < now() - timeout
```

are returned to `PENDING` so they become eligible again. Example timeout: 10–15 minutes, configured in the application.

---

# 69. Retry Policy

Example:

```text
attempt 1 → immediate
attempt 2 → availableAt = now + 5 minutes
attempt 3 → availableAt = now + 30 minutes
```

After the maximum number of attempts:

```text
status = FAILED
```

and `lastError` records a sanitized reason. `CANCELLED` is used when a job is withdrawn, for example when a campaign is stopped. No sophisticated queue infrastructure is required.

---

# 70. Email Job Cleanup

SENT, FAILED and CANCELLED jobs do not need to remain forever. A periodic cleanup may delete them after 30–90 days. This is not required for initial launch but prevents endless growth. Because the table is also a delivery record, pick the retention window deliberately.

---

# 71. Encrypted Email Payloads

`templateDataEncrypted` may contain secret invitation or reset links. The application must encrypt it before saving and decrypt only inside the worker.

Rules:

- Use an authenticated encryption scheme with a server-side key.
- Never log the decrypted payload.
- Never store raw tokens anywhere else.

---

# 72. rate_limit_counters Table

## Table

```text
rate_limit_counters
```

Shared counters that let every API task enforce the same limits without Redis. Not tenant-owned.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `keyHash` | varchar(128) | HMAC of the limited identifier |
| `windowStart` | timestamptz | Start of the time window |
| `count` | int | Default 0 |
| `expiresAt` | timestamptz | When the row can be deleted |
| `createdAt` / `updatedAt` | timestamptz | |

```text
UNIQUE (keyHash, windowStart)
INDEX  (expiresAt)
```

Increment atomically with an upsert so concurrent requests cannot lose counts:

```sql
INSERT INTO rate_limit_counters
  (id, "keyHash", "windowStart", count, "expiresAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, 1, $3, now())
ON CONFLICT ("keyHash", "windowStart")
DO UPDATE SET count = rate_limit_counters.count + 1,
              "updatedAt" = now()
RETURNING count;
```

Rows are deleted after `expiresAt` by the cleanup job. Raw identifiers (IP addresses, tokens) are never stored; only keyed hashes.

---

# 73. Relationship Summary

| Parent | Child / Reference | Relationship |
|---|---|---|
| User | Session | 1:N |
| User | PasswordResetToken | 1:N |
| User | WeddingMembership | 1:1 in V1 |
| User | Wedding (creator) | 1:N |
| Wedding | WeddingMembership | 1:N |
| Wedding | MemberInvitation | 1:N |
| Wedding | Event | 1:N |
| Wedding | Task | 1:N |
| Wedding | Guest | 1:N |
| Wedding | Vendor | 1:N |
| Wedding | Expense | 1:N |
| Wedding | WebsiteSettings | 1:0..1 |
| Wedding | LivestreamSettings | 1:0..1 |
| Wedding | GalleryAlbum | 1:N |
| Wedding | GalleryPhoto | 1:N |
| Wedding | GalleryAccessToken | 1:N |
| Wedding | EmailJob | 1:N |
| Event | Task | 1:N optional |
| Event | Guest | N:N through guest_events |
| Event | Vendor | 1:N optional |
| Event | Expense | 1:N optional |
| Event | GalleryPhoto | 1:N optional |
| Vendor | Expense | 1:N optional |
| WeddingMembership | Task (assignee) | 1:N optional |
| GalleryAlbum | GalleryPhoto | 1:N optional |

---

# 74. Foreign Key Delete Behaviour

| Child column | Parent | On delete |
|---|---|---|
| `sessions.userId` | users | CASCADE |
| `password_reset_tokens.userId` | users | CASCADE |
| `weddings.createdByUserId` | users | RESTRICT |
| `member_invitations.invitedByUserId` | users | RESTRICT |
| `wedding_memberships.userId` | users | CASCADE |
| all wedding-owned `weddingId` columns | weddings | CASCADE |
| `tasks.eventId` | events | SET NULL |
| `tasks.assignedToMembershipId` | wedding_memberships | SET NULL |
| `vendors.eventId` | events | SET NULL |
| `expenses.eventId` | events | SET NULL |
| `expenses.vendorId` | vendors | SET NULL |
| `gallery_photos.albumId` | gallery_albums | SET NULL |
| `gallery_photos.eventId` | events | SET NULL |
| `guest_events.guestId` | guests | CASCADE |
| `guest_events.eventId` | events | CASCADE |

Deleting a wedding cascades to everything it owns. In production this should go through a deliberate service workflow that also removes the wedding's S3 objects, because the database cascade cannot touch S3.

---

# 75. Tenant Isolation Rule

This is the most important database-access rule.

Bad:

```typescript
prisma.task.findUnique({ where: { id: taskId } })
```

Preferred:

```typescript
prisma.task.findFirst({
  where: { id: taskId, weddingId: currentWeddingId }
})
```

Apply the same pattern to:

```text
Events
Guests
Vendors
Expenses
Photos
Albums
```

Use `updateMany` / `deleteMany` with the same `where` clause (or check the affected count) so that the wedding filter is part of the write itself. The client must never decide which Wedding it is authorized to access.

---

# 76. Do Not Trust weddingId from the Client

An authenticated request might send:

```json
{ "weddingId": "another-wedding-id" }
```

The backend ignores this for authorization. Instead:

```text
Session
   ↓
User
   ↓
WeddingMembership
   ↓
currentWeddingId
```

The backend derives tenant context itself.

---

# 77. Cross-Entity Validation

A foreign key proves a row exists, not that it belongs to the same wedding. Therefore service-layer validation is required.

Example:

```text
Assign Task
    ↓
Load Event where
id = eventId AND weddingId = current
    ↓
Load Membership where
id = membershipId AND weddingId = current
    ↓
Create Task
```

Never simply accept referenced IDs from the frontend.

## Optional database-level hardening

For stronger guarantees, add `UNIQUE (weddingId, id)` on parent tables (`events`, `vendors`, `gallery_albums`; memberships already have it) and replace single-column foreign keys with composite ones such as `(weddingId, eventId) → events (weddingId, id)`. Prisma cannot express this fully, so it is done in a reviewed SQL migration. Composite foreign keys also change how `SET NULL` works (it must only null the child reference, not `weddingId`), so each one needs individual review.

---

# 78. Transactions

Use Prisma transactions selectively. Do not wrap every API call.

Use a transaction when several changes together represent one business operation.

---

# 79. Create Wedding Transaction

Operation:

```text
Create Wedding
+
Create Initial ADMIN Membership
+
Create website_settings (slug)
+
Create gallery access token
```

All succeed together. If membership creation fails, the system must not leave an inaccessible Wedding behind.

---

# 80. Accept Member Invitation Transaction

Operation:

```text
Validate Invitation

Create WeddingMembership

Set acceptedAt
```

These are atomic. The unique `userId` on memberships plus a conditional `acceptedAt IS NULL` update protect against concurrent attempts.

---

# 81. Last-Admin Invariant

The rule "a wedding must always retain at least one Admin" cannot be a simple check constraint. Enforce it in a transaction:

```text
Begin transaction
    ↓
Lock the wedding's ADMIN membership rows
(SELECT ... FOR UPDATE)
    ↓
Count ADMIN rows
    ↓
Reject if the change would leave zero
    ↓
Apply role change / removal
    ↓
Commit
```

Alternatively run the transaction at SERIALIZABLE isolation and retry on serialization failure. This also covers two Admins demoting each other at the same moment.

---

# 82. Bulk Email Job Creation

Creating hundreds of email jobs does not need one giant transaction. Use:

```text
createMany with skipDuplicates
```

relying on the unique `idempotencyKey` to ignore jobs that already exist. Large transactions should be avoided when they provide little business value.

---

# 83. Dashboard Queries

The dashboard calculates values from primary tables.

### Events

```text
COUNT events
WHERE weddingId AND status <> CANCELLED
```

### Tasks

```text
COUNT all tasks
COUNT WHERE status = DONE
```

### Guests

```text
COUNT guests
SUM attendingCount WHERE rsvpStatus = ACCEPTED
```

### Expenses

```text
SUM amount
WHERE weddingId
```

### Vendors

```text
COUNT vendors
WHERE weddingId
```

This scale is completely reasonable for V1.

---

# 84. No Summary Counters Initially

Avoid fields such as:

```text
weddings.totalGuestCount
weddings.totalExpenses
weddings.completedTasks
weddings.photoCount
```

because every write then requires keeping derived data synchronized. If dashboard queries later become expensive, selective denormalized counters can be introduced.

---

# 85. Pagination Strategy

Tables requiring pagination:

```text
Guests
Photos
Tasks
Expenses
Vendors
```

Guests are limited enough that ordinary page/limit pagination is acceptable. Photos may reach several thousand per wedding, so cursor-style pagination on `(createdAt, id)` is preferable for the gallery. Exact API pagination design is defined in the API design document.

---

# 86. Constraints Enforced by Prisma

These come directly from `schema.prisma`:

- unique `users.email`
- unique `wedding_memberships.userId` (V1: one wedding per user)
- unique `(weddingId, id)` on memberships
- unique `website_settings.slug` and `website_settings.weddingId`
- unique `livestream_settings.weddingId`
- unique token hashes: sessions, password resets, member invitations, guest invitations, gallery tokens
- unique `gallery_photos.s3ObjectKey`
- unique `(weddingId, name)` for gallery albums
- unique `(guestId, eventId)` through the composite primary key
- unique `(keyHash, windowStart)` for rate-limit counters
- unique optional `email_jobs.idempotencyKey`
- every foreign key listed in Section 74

---

# 87. Additional SQL Migration Constraints

Prisma cannot express check constraints or partial indexes. Add them in reviewed SQL migrations. Column names are camelCase and must be quoted because the schema does not rename columns.

```sql
ALTER TABLE expenses
  ADD CONSTRAINT expenses_amount_nonneg CHECK (amount >= 0);

ALTER TABLE rate_limit_counters
  ADD CONSTRAINT rate_limit_count_nonneg CHECK (count >= 0);

ALTER TABLE gallery_photos
  ADD CONSTRAINT gallery_photos_size_positive CHECK ("sizeBytes" > 0);

ALTER TABLE events
  ADD CONSTRAINT events_time_order
  CHECK ("endsAt" IS NULL OR "startsAt" IS NULL OR "endsAt" >= "startsAt");

ALTER TABLE guests
  ADD CONSTRAINT guests_rsvp_count_consistent CHECK (
    ("rsvpStatus" = 'ACCEPTED' AND "attendingCount" > 0)
    OR ("rsvpStatus" <> 'ACCEPTED' AND "attendingCount" = 0)
  );
```

Also recommended (shown earlier): `lower(email)` unique index on users (Section 10), partial unique index for open member invitations (Section 27), and partial unique index for Google Place per wedding (Section 49).

---

# 88. Index Inventory

## users

```text
email UNIQUE
```

## sessions

```text
tokenHash UNIQUE
userId + expiresAt
expiresAt
```

## password_reset_tokens

```text
tokenHash UNIQUE
userId + expiresAt
```

## weddings

```text
weddingDate
```

## wedding_memberships

```text
userId UNIQUE
weddingId + id UNIQUE
weddingId + role
```

## member_invitations

```text
tokenHash UNIQUE
weddingId + email
expiresAt
```

## events

```text
weddingId + startsAt
weddingId + status
```

## tasks

```text
weddingId + status + dueAt
weddingId + dueAt
```

## guests

```text
invitationTokenHash UNIQUE
weddingId + name
weddingId + rsvpStatus
weddingId + email
```

## guest_events

```text
guestId + eventId PRIMARY KEY
eventId + guestId
```

## vendors

```text
weddingId + category
weddingId + name
googlePlaceId
```

## expenses

```text
weddingId + spentAt
weddingId + category
```

## website_settings

```text
slug UNIQUE
weddingId UNIQUE
```

## gallery_albums

```text
weddingId + name UNIQUE
weddingId + createdAt
```

## gallery_photos

```text
s3ObjectKey UNIQUE
weddingId + createdAt
weddingId + uploadStatus + createdAt
```

## gallery_access_tokens

```text
tokenHash UNIQUE
weddingId + revokedAt
expiresAt
```

## livestream_settings

```text
weddingId UNIQUE
```

## email_jobs

```text
idempotencyKey UNIQUE
status + availableAt + createdAt
weddingId + createdAt
```

## rate_limit_counters

```text
keyHash + windowStart UNIQUE
expiresAt
```

Do not add indexes speculatively: review real query plans and workload as the application develops.

---

# 89. Delete Strategy

We should not apply soft deletion to every table. That creates unnecessary query complexity.

| Entity | Strategy |
|---|---|
| User | No user deletion in initial V1 (creator relation is restrictive) |
| Session | Revoke, then periodic hard delete |
| Password reset token | Mark used, then periodic hard delete |
| Wedding | Hard delete through a controlled service workflow (soft delete is an open decision) |
| Membership | Hard delete |
| Member invitation | Keep with accepted / revoked timestamps |
| Event | Prefer status CANCELLED; hard delete detaches related rows |
| Task | Hard delete |
| Guest | Hard delete |
| Vendor | Hard delete (expenses keep a null vendor link) |
| Expense | Hard delete |
| Photo | Delete S3 object, keep DELETED tombstone |
| Email job | Status, then periodic cleanup |
| Rate-limit counter | Periodic hard delete after expiry |

Deleting an entire wedding would remove events, guests, expenses, photos metadata, invitations and vendors at once. Because accidental deletion would be catastrophic, consider adding a `deletedAt` column on `weddings` as a soft-delete safeguard (Section 105).

---

# 90. Data Validation Layers

There are three layers, each with a different purpose.

## Zod

Validates external application input.

```text
amount >= 0
valid email
allowed task status
attendingCount consistent with RSVP status
```

## Prisma

Types and structure: required fields, enums, field lengths, relations and indexes.

## PostgreSQL

The last line of defence: foreign keys, unique indexes and check constraints (Sections 86 and 87).

Business rules still belong primarily in services.

---

# 91. Enum Storage

Enums are stored as readable strings through native PostgreSQL enum types.

Prefer:

```text
'IN_PROGRESS'
```

over:

```text
2
```

Reasons:

- Easier debugging
- Easier database inspection
- Safer future evolution
- More understandable logs

---

# 92. Token Storage Rules

Secret tokens are never stored raw.

Applies to:

```text
Sessions
Password resets
Wedding Member invitations
Guest invitations
Gallery access
```

The database stores `tokenHash`; URLs and cookies contain the raw token. Hashes are keyed (HMAC-SHA-256 with a server secret) and stored as hex in `varchar(128)` columns. Raw tokens are never logged, and token-bearing URLs are logged only in route form.

---

# 93. Token Generation

Use cryptographically secure random generation.

```javascript
crypto.randomBytes(32)
```

Do not use:

```javascript
Math.random()
```

for security-sensitive tokens.

---

# 94. Public Identifiers

Different resource types use different public identifiers.

```text
Wedding Website
→ slug

Guest Invitation
→ secret token

Gallery / QR
→ secret token

Internal Authenticated Entities
→ UUID
```

Authenticated UUIDs are acceptable as long as authorization checks always include `weddingId`.

---

# 95. Photo Storage Responsibility

PostgreSQL owns:

```text
metadata
ownership
album and event relationship
timestamps
upload status
```

Amazon S3 owns:

```text
binary file
```

PostgreSQL must never contain Base64 wedding images or large photo binaries.

---

# 96. Security Against Cross-Wedding File Upload

When generating an S3 upload URL:

```text
Authenticated Member
      ↓
derive weddingId from Membership
```

or:

```text
Guest Gallery Token
      ↓
derive weddingId from token
```

The client never chooses the object key prefix such as `weddings/{someOtherWeddingId}`.

---

# 97. Guest Email Is Optional

A Guest can exist with a name and phone but no email. The organiser can share the invitation manually through WhatsApp. `Send Email Invitation` requires `guests.email`.

---

# 98. Phone Numbers

Phone numbers are stored as strings (`varchar(32)`). Do not store them as numbers because:

- `+` is meaningful
- Leading zeros can matter
- Numeric arithmetic is irrelevant

Example:

```text
+919876543210
```

Normalization rules can improve when WhatsApp or SMS integrations are introduced.

---

# 99. Data Ownership Summary

### User-owned

```text
Sessions
Password Reset Tokens
```

### Wedding-owned

```text
Memberships
Member Invitations
Events
Tasks
Guests (and guest_events)
Vendors
Expenses
Website Settings
Livestream Settings
Gallery Albums
Gallery Photos
Gallery Access Tokens
Email Jobs
```

### Standalone

```text
Rate Limit Counters
```

---

# 100. Estimated Row Volumes

Approximate intended upper bounds per Wedding:

```text
Memberships
~5–20

Events
~5–20

Tasks
~50–500

Guests
~100–1,000

Vendors
~10–100

Expenses
~50–1,000

Photos
~0–5,000+

Email Jobs
potentially thousands over wedding lifecycle
```

These volumes are well within what a single indexed PostgreSQL instance handles comfortably.

---

# 101. Referential Integrity Philosophy

PostgreSQL provides foreign keys, but they do not know about tenants. Therefore:

> Every write involving references must be treated as a business operation rather than simply storing IDs received from the frontend.

Example:

```text
Create Expense

1. Authenticate
2. Determine Wedding
3. Validate Event belongs to Wedding
4. Validate Vendor belongs to Wedding
5. Create Expense
```

This pattern is fundamental to the application.

---

# 102. Prisma Workflow

Initial setup:

```bash
npm install prisma @prisma/client
# Configure DATABASE_URL in the server-side environment
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

Rules:

1. Review every generated migration SQL file before committing it.
2. Add the SQL-only constraints from Section 87 in reviewed migrations.
3. Run migrations against a development database first.
4. Seed data is for local development only; never seed real credentials or guest information.
5. Use `npx prisma migrate deploy` in production, as a one-off step in the deployment pipeline before the new API version starts. Never use `migrate dev` against production.
6. Keep migrations backward-compatible with the previous API version so rolling deployments stay safe.

---

# 103. Retention and Cleanup

PostgreSQL has no automatic expiry, so a periodic cleanup job (run by the API's in-process worker) removes stale rows.

| Data | Suggested retention |
|---|---|
| Expired or revoked sessions | Delete after a short grace period |
| Used or expired password-reset tokens | Delete after a short grace period |
| Expired or revoked member invitations | Keep for audit for a limited period |
| Rate-limit counters | Delete after `expiresAt` |
| Sent, failed and cancelled email jobs | Delete after 30–90 days |
| DELETED photo tombstones | Delete once the S3 object is confirmed gone |

Exact retention windows are an open decision (Section 105).

---

# 104. Differences Between Schema and Other Design Documents

The schema is the source of truth for this document. Compared with the System Design and earlier planning, these points need an explicit decision before or during implementation.

| # | Topic | Current schema | Other documents expect | Suggested resolution |
|---:|---|---|---|---|
| 1 | Guest invitation token | Hash only (`invitationTokenHash`) | System Design §22: stable, retrievable token | Decide: add a separate token column excluded from default selects, or accept regenerate-link behaviour |
| 2 | Guest capacity | No maximum field | RSVP validates a maximum guest count | Add `maxGuests` and extend the RSVP check |
| 3 | Wedding location and time zone | Single `location` string, no time zone | Structured location with coordinates and Google Place ID; time zone | Add structured columns and `timeZone` |
| 4 | Photo upload lifecycle | PENDING, UPLOADED, FAILED, DELETED; no staging key or expiry | Staging key, expiry, final key copy, tombstones | Add `uploadKey` and `expiresAt`; treat UPLOADED as the published state |
| 5 | Email normalization | No normalized columns; case-sensitive unique email | Unique normalized email | Lowercase on write plus `lower(email)` unique index |
| 6 | Email job types | Includes PASSWORD_RESET and MEMBER_INVITATION | System Design §46: send those immediately | Decide whether they are queued; if so, payload stays encrypted |
| 7 | Email job tracking | No guest or batch reference | Cancel jobs on guest deletion; campaign progress | Add optional `guestId` and `batchId`, or encode them in `idempotencyKey` |
| 8 | Wedding soft delete | No `deletedAt` | System Design §87 mentions soft deletion | Add `deletedAt` to weddings if required |
| 9 | Event and vendor archiving | Event has `status`; no archive timestamps | Archive instead of delete | Use `CANCELLED` for events; decide for vendors |
| 10 | Photo uploader | `uploadedByGuest` flag only | Member uploader attribution | Add optional uploader membership reference if needed |
| 11 | Website, gallery, livestream storage | Separate tables | Embedded in wedding (earlier plan) | Intentional: keeps `weddings` narrow; unique `weddingId` keeps one per wedding |
| 12 | Money and task enums | `numeric(12,2)`; `DONE`; `URGENT` | Earlier plan: integer paise; `COMPLETED` | Schema wins; update other documents |

---

# 105. Decisions Still Requiring Review

1. Whether guests need an explicit maximum-attendees field (Section 104, items 1 and 2).
2. Whether the retrievable guest link requires storing a raw token.
3. Whether vendors should link to one event or many (`vendor_events` join table).
4. Whether wedding soft delete (`deletedAt`) is required.
5. Whether website content JSON should be split into normalized tables after UI requirements are finalized.
6. S3 cleanup workflow when a wedding or photo is deleted.
7. Composite foreign keys for strict cross-wedding integrity (Section 77).
8. Exact retention windows for expired sessions, tokens, email jobs and rate-limit counters.
9. Whether password-reset and member-invitation emails are queued or sent immediately.

These are implementation review items, not permission to expand the approved V1 product scope.

---

# 106. Data Model Summary

The final V1 model is:

```text
User
├── Sessions
├── PasswordResetTokens
└── WeddingMembership
         │
         ▼
      Wedding
         │
         ├── WebsiteSettings (slug, theme)
         ├── LivestreamSettings
         ├── GalleryAccessTokens
         │
         ├── MemberInvitations
         ├── Events
         ├── Tasks
         ├── Guests
         │      ├── Invitation Token Hash
         │      ├── GuestEvents (invited events)
         │      └── RSVP
         │
         ├── Vendors
         ├── Expenses
         ├── GalleryAlbums
         ├── GalleryPhotos → Amazon S3
         └── EmailJobs

RateLimitCounters (standalone)
```

---

# 107. Key Database Decisions

## Decision 1

**Wedding is the tenant boundary.**

Every private entity is queried using `weddingId`.

---

## Decision 2

**Use separate tables for unbounded data.**

Guests, tasks, vendors, expenses and photos are never stored inside the wedding row.

---

## Decision 3

**Give small 1:1 configuration its own table.**

Website, livestream and gallery tokens are separate tables, with unique `weddingId` where only one row is allowed.

---

## Decision 4

**Keep RSVP inside Guest.**

One guest has one current RSVP in V1.

---

## Decision 5

**Keep invitation information inside Guest.**

One guest has one invitation link, stored as a hash with optional expiry and revocation.

---

## Decision 6

**Use a join table for guest-event invitations.**

`guest_events` links guests to the bounded set of events with a composite primary key.

---

## Decision 7

**Use WeddingMembership rather than storing role directly on User.**

This keeps domain modelling clean and future-friendly.

---

## Decision 8

**Use exact decimals for money.**

`numeric(12,2)` with `INR` currency; no floating-point arithmetic.

---

## Decision 9

**Use hashes for secret tokens.**

Session, invitation, reset and gallery tokens are not persisted raw.

---

## Decision 10

**Photos remain outside PostgreSQL.**

PostgreSQL stores only S3 object metadata.

---

## Decision 11

**Use PostgreSQL for lightweight email jobs and rate limits.**

No Redis or dedicated queue infrastructure for V1; `FOR UPDATE SKIP LOCKED` provides safe claiming.

---

## Decision 12

**Do not maintain denormalized dashboard counters initially.**

Calculate them using indexed queries and aggregations.

---

## Decision 13

**Enforce tenant integrity in services first, database second.**

Service validation is mandatory; composite foreign keys are optional hardening.

---

# 108. Final Table List

The database design is finalized around:

```text
users
sessions
password_reset_tokens

weddings
wedding_memberships
member_invitations

events
tasks

guests
guest_events

vendors
expenses

website_settings
livestream_settings

gallery_albums
gallery_photos
gallery_access_tokens

email_jobs
rate_limit_counters
```

Total:

**19 tables and 11 enums**

---

# 109. Next Step

With the data model defined, the next step is to align the **REST API Design** with it. That document should define:

- Routes
- HTTP methods
- Authentication requirements
- Admin-only endpoints
- Request payloads
- Response payloads
- Pagination
- Filtering
- Validation
- Error format
- Guest-token endpoints
- Photo-upload endpoints
- Email job endpoints

The API design should be derived directly from this database model rather than inventing data structures independently, and any resolved item from Section 104 must be reflected in `schema.prisma` first.
