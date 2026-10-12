# Make My Marriage

## REST API Design Document

| Item | Detail |
|---|---|
| Version | V1 |
| Status | API Design Baseline |
| Architecture | Modular Monolith |
| Backend | Node.js + TypeScript (Express) |
| Frontend | React + TypeScript |
| API style | REST / JSON |
| Authentication | Custom server-side sessions |
| Validation | Zod |
| Business data | PostgreSQL (source of truth) via Prisma |
| Logs | MongoDB Atlas (technical logs only) |
| Object storage | Amazon S3 (private, presigned URLs) |
| Email | Resend |
| Base path | /api/v1 |

# 1. Purpose and scope

This document defines the REST API design for **Make My Marriage V1**: conventions, authentication and authorization, request and response structures, error format, pagination and filtering, and the endpoint contracts for every module. It is the contract between the React (TypeScript) frontend and the Node.js (TypeScript) API. PostgreSQL, accessed through Prisma, is the source of truth for all business data; MongoDB Atlas stores technical logs only; photo bytes live in private Amazon S3.

Modules covered: Authentication, Wedding, Dashboard, Members and member invitations, Events, Tasks, Guests, Invitations and RSVP, Expenses, Vendors and vendor discovery, Wedding website, Livestream, Gallery and photos, background email jobs, and the internal email-worker endpoint.

The API layer is intentionally thin. Every request follows the same flow:

```text
HTTP Request
    ↓
Route Handler
    ↓
Authentication
    ↓
Authorization
    ↓
Zod Validation
    ↓
Service Layer
    ↓
Prisma / External Provider
    ↓
HTTP Response
```

Implementation notes dated 2026-09-16 and 2026-09-18 are included where features have already been built. Where an implementation note refines an earlier design statement, the implementation note wins. Section 11 summarises what is implemented and what is deferred.

# 2. Design principles and conventions

## 2.1 Explicit REST APIs

The React single-page frontend talks to the Node.js API only through explicit REST endpoints. This gives clear frontend/backend boundaries, easier testing and debugging, better security review, and future mobile-client compatibility.

## 2.2 Thin route handlers

Route handlers (controllers) do not contain major business logic. For example, `POST /api/v1/tasks` should roughly authenticate, resolve the wedding, validate the body with Zod, call `TaskService.createTask(...)`, and return the response. Business rules live in the service layer; database access lives in Prisma-based repositories.

## 2.3 Wedding context comes from authentication

For private APIs the client never supplies `weddingId`. The backend resolves it through the chain below, so private requests generally contain no `weddingId`. Client-supplied wedding IDs are rejected.

```text
Session → User → Wedding Membership → Wedding
```

## 2.4 Base path and versioning

All application APIs live under `/api/v1` (for example `/api/v1/auth/login`, `/api/v1/events`, `/api/v1/guests`). The frontend must not depend on unversioned routes, and breaking changes ship under a new version prefix.

## 2.5 API surface categories

| Prefix | Audience | Description |
|---|---|---|
| `/api/v1/auth/*` | Anyone / session | Authentication endpoints. |
| `/api/v1/*` | Wedding members | Authenticated Admin and Manager APIs. |
| `/api/v1/public/*` | Unauthenticated | Public or token-protected APIs (invitations, RSVP, website, gallery). |
| `/api/v1/internal/*` | System only | Scheduler-triggered background processing, protected by an internal secret. |

## 2.6 HTTP method conventions

| Method | Use |
|---|---|
| `GET` | Read data. |
| `POST` | Create a resource or trigger an action. |
| `PATCH` | Partially update a resource. |
| `DELETE` | Delete or archive a resource. |

`PUT` is generally avoided because most updates are partial.

## 2.7 Data conventions

- Request and response bodies are JSON; property names use `camelCase`.
- IDs are UUID strings. Malformed IDs return `400 VALIDATION_ERROR`, never a database error.
- Money is a non-negative decimal string with two decimal places (for example `"12500.00"`), backed by Prisma `Decimal`, with an explicit `currency` (default `INR`). It is never a JavaScript float.
- Timestamps are ISO 8601 date-times with an explicit offset, returned in UTC (for example `2027-02-12T10:30:00.000Z`). Task due dates are ISO instants; the date-only UI converts midnight in the wedding time zone to UTC.
- Wedding date is date-only (`YYYY-MM-DD`).
- Secrets are never returned: password hashes, session tokens, token hashes, reset tokens, signed storage credentials, stack traces.
- Every JSON response also carries a `requestId` (also sent as the `X-Request-Id` header). Later examples omit it for brevity.

# 3. Response and error formats

## 3.1 Successful responses

Single resource:

```text
{
  "data": { "...": "..." },
  "requestId": "req_..."
}
```

Collection (page-based pagination):

```text
{
  "data": [ {}, {} ],
  "pagination": { "page": 1, "limit": 50, "total": 186, "totalPages": 4 },
  "requestId": "req_..."
}
```

Action endpoints with nothing to return:

```text
{ "success": true }
```

## 3.2 Error response

Every error uses the same structure. `details` is optional and carries field-level validation messages.

```text
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { "email": "Invalid email address" }
  },
  "requestId": "req_..."
}
```

## 3.3 HTTP status codes

| Status | Meaning | Use |
|---|---|---|
| **200 OK** | Success | Successful read, update or action. |
| **201 Created** | Created | Resource created. |
| **204 No Content** | Success, no body | Deletion where a response body is unnecessary. |
| **400 Bad Request** | Invalid input | Malformed or invalid input, including malformed IDs. |
| **401 Unauthorized** | No session | No valid authentication session. |
| **403 Forbidden** | No permission | Authenticated but insufficient permission. |
| **404 Not Found** | Unavailable | Resource unavailable or inaccessible, including other weddings’ resources. |
| **409 Conflict** | State conflict | Business-state conflict, including concurrent modification. |
| **429 Too Many Requests** | Rate limited | Rate limit exceeded. |
| **500 Internal Server Error** | Unexpected | Unexpected application error. |
| **502 / 503** | Provider down | External provider temporarily unavailable. |

## 3.4 Standard error codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body, query or route parameter failed Zod validation. |
| `UNAUTHENTICATED` | No valid session. |
| `FORBIDDEN` | Authenticated but not permitted (for example Manager attempting an Admin-only action). |
| `NOT_FOUND` | Resource missing or outside the caller’s wedding or token scope. |
| `CONFLICT` | Business-state conflict, including optimistic-concurrency failures. |
| `INVALID_TOKEN` | Token malformed, unknown or revoked. |
| `TOKEN_EXPIRED` | Token past its expiry. |
| `RATE_LIMITED` | Rate limit exceeded. |
| `UPLOAD_ERROR` | Upload request or confirmation failed validation. |
| `EXTERNAL_SERVICE_ERROR` | Google Places, Resend or S3 failure, mapped to a generic message. |
| `INTERNAL_ERROR` | Unexpected server failure. |

Business-specific codes may also be returned:

| Code | Used when |
|---|---|
| `EMAIL_ALREADY_EXISTS` | Signup with an email that already has an account. |
| `ALREADY_HAS_WEDDING` | User already has a wedding membership (creating or accepting an invitation). |
| `LAST_ADMIN` | Removing or demoting the final Admin of a wedding. |
| `GUEST_LIMIT_EXCEEDED` | Guest-related limit exceeded. |
| `INVITATION_ALREADY_ACCEPTED` | Member invitation was already used. |
| `INVITATION_EMAIL_MISMATCH` | Signed-in user’s email differs from the invited email. |
| `PARTY_SIZE_CHANGED` | RSVP rejected because the guest’s capacity was reduced; the guest reviews and retries. |

Provider errors are never leaked. For example, a Google `REQUEST_DENIED` is returned as:

```text
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "Vendor discovery is temporarily unavailable."
  }
}
```

Detailed provider errors are logged internally only.

# 4. Authentication and authorization

## 4.1 Session cookie

After signup or login the API sets a secure server-side session cookie (conceptual name `mmm_session`). The React app cannot read it from JavaScript; the browser sends it automatically with credentialed requests. No auth token is stored in `localStorage`.

| Property | Value |
|---|---|
| HttpOnly | Yes |
| Secure | In production |
| SameSite | Lax |
| Path | / |

- Only a hash of the random session token is stored, in PostgreSQL. Logout revokes the session and clears the cookie; a password reset consumes its token once and revokes existing sessions.
- Email verification is out of scope for V1.
- Login failures return a generic message (“Invalid email or password.”) and never reveal whether the email exists.
- Removing a member invalidates wedding access immediately; the session itself may remain valid, and `/api/v1/auth/me` then shows no membership.

## 4.2 Roles and access matrix

| API area | Guest / public | Manager | Admin |
|---|---|---|---|
| **Auth** | Selected endpoints | Yes | Yes |
| **Wedding dashboard** | No | Yes | Yes |
| **Wedding details** | No | Yes | Yes |
| **Events** | No | Full | Full |
| **Tasks** | No | Full | Full |
| **Guests** | No | Full | Full |
| **Invitations** | Token only | Full | Full |
| **Expenses** | No | Full | Full |
| **Vendors** | No | Full | Full |
| **Vendor discovery** | No | Yes | Yes |
| **Website settings** | No | Full | Full |
| **Gallery settings** | No | Full | Full |
| **Photos** | Token gallery access | Full | Full |
| **Livestream** | Public viewing when published | Full | Full |
| **Wedding members** | No | Read | Full management |

## 4.3 Admin-only operations

Only these operations require `ADMIN`. Everything else is available to both Admin and Manager, through reusable authorization helper logic.

- Invite a wedding member
- List and revoke member invitations
- Change a member’s role
- Remove a member

A wedding must never end with zero Admins; role changes and removals enforce this (`LAST_ADMIN`).

## 4.4 Resource isolation

Every wedding-owned Prisma query includes both the resource ID and the current wedding ID (for example `where: { id: vendorId, weddingId }`). A resource belonging to another wedding returns `404 NOT_FOUND`, not `403`, so tenant resource existence is never leaked. Related references (event, vendor, assignee) are validated against the same wedding before use.

# 5. Route inventory

Access levels: **Public** needs no login; **Auth** needs a valid session; **Member** is an authenticated Admin or Manager; **Admin** needs the Admin role; **Token** needs a valid purpose-specific invitation or gallery token; **Internal** needs the internal secret.

## 5.1 Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | Public, rate limited | Create account and session; sets cookie. |
| `POST` | `/api/v1/auth/login` | Public, rate limited | Authenticate and create session. |
| `POST` | `/api/v1/auth/logout` | Auth | Invalidate session and clear cookie. |
| `GET` | `/api/v1/auth/me` | Auth | Current user, membership and wedding (null when none). |
| `POST` | `/api/v1/auth/forgot-password` | Public, rate limited | Request reset; always a generic success response. |
| `POST` | `/api/v1/auth/reset-password` | Public token, rate limited | Consume reset token and set new password. |

Signup normalizes the email, checks for duplicates, hashes the password, creates the user and session, and returns `hasWedding`. Forgot-password generates a reset token, stores only its hash and sends the email through Resend, without revealing whether the account exists. Reset errors: `INVALID_TOKEN`, `TOKEN_EXPIRED`, `VALIDATION_ERROR`.

## 5.2 Wedding and dashboard

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wedding` | Auth, no membership | Create wedding; creator becomes Admin. |
| `GET` | `/api/v1/wedding` | Member | Read current wedding (no secret hashes). |
| `PATCH` | `/api/v1/wedding` | Member | Update wedding details; slug stays unchanged. |
| `GET` | `/api/v1/dashboard` | Member | Aggregated countdown, summary counts, upcoming events and tasks. |

Wedding creation is a single Prisma transaction that creates the wedding and the Admin membership, and generates the website slug and gallery token. Errors: `ALREADY_HAS_WEDDING`, `VALIDATION_ERROR`. The dashboard is an intentional aggregation endpoint so the frontend does not make eight independent requests. Cover uploads reuse the direct-upload flow (`POST /api/v1/wedding/cover/upload-url`, then PATCH the resulting `coverImageObjectKey`) and are deferred.

## 5.3 Members and member invitations

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/members` | Member | List wedding members. |
| `PATCH` | `/api/v1/members/:membershipId` | Admin | Change role (ADMIN or MANAGER). |
| `DELETE` | `/api/v1/members/:membershipId` | Admin | Remove member. |
| `POST` | `/api/v1/members/invitations` | Admin | Invite by email and role; email sent immediately via Resend. |
| `GET` | `/api/v1/members/invitations` | Admin | List pending invitations. |
| `DELETE` | `/api/v1/members/invitations/:invitationId` | Admin | Revoke (status becomes REVOKED). |
| `GET` | `/api/v1/public/member-invitations/:token` | Public | Minimal data to render the invitation page. |
| `POST` | `/api/v1/member-invitations/:token/accept` | Auth | Accept invitation and join the wedding. |

- Inviting checks Admin, normalizes the email, ensures the person is not already a member and has no pending duplicate invitation, then creates a secure token (stored hashed) and the invitation record.
- Accepting validates the token, requires the signed-in user’s normalized email to match the invitation, ensures the user has no membership, creates the membership and marks the invitation `ACCEPTED`. Errors: `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVITATION_ALREADY_ACCEPTED`, `ALREADY_HAS_WEDDING`, `INVITATION_EMAIL_MISMATCH`.
- Removal errors: `LAST_ADMIN`, `NOT_FOUND`, `FORBIDDEN`.

## 5.4 Events

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/events` | Member | List events; `includeArchived`, `from`, `to`; ordered by `startsAt` ascending. |
| `POST` | `/api/v1/events` | Member | Create event (201). |
| `GET` | `/api/v1/events/:eventId` | Member | Read event (`id + weddingId`). |
| `PATCH` | `/api/v1/events/:eventId` | Member | Partial update. |
| `DELETE` | `/api/v1/events/:eventId` | Member | Archive (`archivedAt = now`); not a physical delete. |

**Implemented behaviour (2026-09-16)**

- `name` and `startsAt` are required; `type` is optional. Optional text fields can be cleared with an empty string and `endsAt` with `null`.
- Timestamps must be ISO date-times with an explicit offset. When present, the end must be strictly after the start.
- PATCH validates the start/end pair after merging changes. Archived events are read-only. A concurrent modification returns `CONFLICT`; reload before retrying. Client-supplied wedding IDs are rejected.
- Cover uploads are deferred.

## 5.5 Tasks

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/tasks` | Member | List tasks with filters and pagination. |
| `POST` | `/api/v1/tasks` | Member | Create task. |
| `GET` | `/api/v1/tasks/:taskId` | Member | Read task. |
| `PATCH` | `/api/v1/tasks/:taskId` | Member | Update fields, status or assignment. |
| `DELETE` | `/api/v1/tasks/:taskId` | Member | Hard delete. |

Query parameters: `page`, `limit`, `status`, `priority`, `eventId`, `assignedMembershipId`, `mine=true`. Example: `GET /api/v1/tasks?status=TODO&mine=true&page=1&limit=50`.

**Implemented behaviour (2026-09-16)**

- Admins and Managers have identical task permissions. Missing or cross-wedding resources return `NOT_FOUND`.
- Lists use `{ data, pagination: { page, limit, total, totalPages } }`. Page defaults to 1 (maximum 100000); limit defaults to 20 (maximum 100). Ordering is newest creation first with ID as a stable tie-breaker.
- `mine=true` means the caller’s membership ID; `mine=false` disables it. Filters combine with AND, and a conflicting explicit assignee with `mine=true` yields no matches. `eventId=none` selects general wedding tasks; `assignedMembershipId=none` selects unassigned tasks.
- Responses include nullable `assignee` (membership ID, name, role) and `event` (ID, name, archivedAt) summaries. No user email is exposed.
- Create: `title` required (trimmed, max 200); `description` optional (max 2000); `priority` defaults to `MEDIUM`; `status` defaults to `TODO`. Member, event and due date are optional or null. New associations require a current member and an active event in the wedding; existing archived-event or removed-member references stay visible and can be retained or cleared. The UI labels a missing assignee “Former member”.
- Due dates are ISO instants. Overdue means an incomplete task whose wedding-local due date is before today. Creating an already completed task sets `completedAt` on the server.
- Update: setting `COMPLETED` sets `completedAt`; moving away clears it; metadata edits to a completed task preserve it. The body needs at least one supported field; `completedAt` and wedding ownership cannot be supplied. An atomic version check returns `CONFLICT` if another write intervened.

## 5.6 Guests

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/guests` | Member | Paginated list with search and filters. |
| `POST` | `/api/v1/guests` | Member | Create guest; generates stable invitation token. |
| `GET` | `/api/v1/guests/:guestId` | Member | Read guest with invited-event summaries. |
| `PATCH` | `/api/v1/guests/:guestId` | Member | Partial update. |
| `DELETE` | `/api/v1/guests/:guestId` | Member | Hard delete; link becomes invalid. |
| `GET` | `/api/v1/guests/rsvp-summary` | Member | Invitation and attendee totals. |
| `GET` | `/api/v1/guests/:guestId/invitation-link` | Member | Stable invitation URL for copy and sharing. |
| `POST` | `/api/v1/guests/:guestId/send-invitation` | Member | Email one invitation via Resend (deferred). |
| `POST` | `/api/v1/guests/:guestId/send-reminder` | Member | Email one RSVP reminder to a pending guest (deferred). |
| `POST` | `/api/v1/guests/actions/send-invitations` | Member | Bulk invitations as EmailJobs (deferred). |
| `POST` | `/api/v1/guests/actions/send-reminders` | Member | Bulk RSVP reminders as EmailJobs (deferred). |

List query parameters: `page`, `limit`, `search`, `rsvpStatus`, `eventId`, `invitationSent`. Example: `/api/v1/guests?search=sharma&rsvpStatus=PENDING&page=1&limit=50`. Search covers name, email and phone with no external search engine.

**Implemented guest CRUD behaviour (2026-09-16)**

- Admins and Managers have equal guest permissions; wedding scope comes from membership. IDs, bodies and query parameters use strict validation, and bodies keep the shared 8 KiB JSON limit.
- Lists default to page 1 (maximum 100000) and limit 20 (maximum 100), ordered by name then ID. Search is a literal, case-insensitive match on name, email and phone (up to 120 characters; regex metacharacters escaped). RSVP, event and `invitationSent=true|false` filters combine with AND.
- Fields: `name` required (trimmed, 1–120); `email` optional valid address or empty (max 254); `phone` optional (up to 40, digits and common punctuation); `notes` optional (max 2000); `maxGuests` defaults to 1 and must be an integer from 1 to 10000 including the named guest; `invitedEventIds` defaults to `[]` with at most 100 unique valid IDs.
- New event associations require active events in the same wedding; previously associated archived events can be retained or removed on edit. Guests may be created with no events.
- Email is normalized for searching with no uniqueness constraint, since families may share an address. Contact and notes fields can be cleared with an empty string; event selections with `[]`.
- Responses include public guest fields and `invitedEvents` summaries (ID, name, start, archive date). Invitation secrets and normalized-email internals are excluded. A new guest has `PENDING` RSVP and null attendance and delivery dates.
- Updates are partial, reject server-owned RSVP, token, delivery and ownership fields, preserve existing RSVP and stable tokens, and reject capacity below recorded attendance. Version and atomic capacity guards reject concurrent conflicts.
- Deleting is permanent. When email delivery ships, deleting a guest must also cancel that guest’s pending EmailJobs.
- Dashboard totals count guest records as groups and sum maximum party sizes as capacity; neither equals invitations sent or confirmed attendance.

### Invitation link retrieval

`GET /api/v1/guests/:guestId/invitation-link` requires Admin or Manager membership; the lookup uses the membership’s wedding ID and cross-wedding or missing guests return 404. The URL uses the configured `APP_BASE_URL` origin, never the request Host header. Responses are private and not cached. The UI supports copy (with a manual fallback) and open-in-new-tab; sharing through other apps such as WhatsApp is manual. Copy and open actions never mark an email as sent.

### Bulk send and reminders

Bulk requests use a preset `scope` rather than arbitrary query serialization: `ALL_UNSENT`, `ALL_PENDING_RSVP`, or `SELECTED` (with `guestIds`). They create EmailJobs and return immediately with `{ batchId, jobsCreated }`. Single sends require the guest to have an email (reminders also require `rsvpStatus = PENDING`), send through Resend immediately, and update `invitationSentAt` or `lastReminderSentAt` and `reminderCount`.

## 5.7 Public invitation and RSVP

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/public/invitations/:token` | Token, rate limited | Guest-specific invitation and active invited events. |
| `POST` | `/api/v1/public/invitations/:token/rsvp` | Token, rate limited | Submit or modify the guest group’s RSVP. |

The invitation response contains only the guest’s name, capacity and RSVP state, a small wedding summary, and the active invited events. It never exposes other guests, expenses, vendors, members or internal notes.

**Implemented public boundary (2026-09-16)**

- `/invite/:token` is a standalone page with no login. Malformed, missing or deleted invitations (and links of a deleted wedding) show a generic unavailable state; the API returns 404.
- Only the explicit fields in the contract are exposed: no database IDs, contact details, internal notes, other guests, members or unrelated sharing tokens. Events are filtered by owner wedding, the invitation’s event IDs, and `archivedAt: null`.
- Responses are no-store. Public routes send no-referrer and noindex headers and metadata (the React `/invite/:token` page sets the same). Token-bearing routes are excluded from request logging.
- The UI retains unsaved RSVP choices after retryable failures and refreshes on focus or cross-tab signals. No response deadline or invitation expiry is introduced.

**RSVP rules**

- Request is `{ status, attendingCount }`. `ATTENDING` requires `1 ≤ attendingCount ≤ maxGuests`; `NOT_ATTENDING` requires `attendingCount = 0`.
- One response applies to the whole guest group, and the same endpoint modifies it later. Repeating the current status and count is idempotent.
- Updates check the guest version and current capacity atomically, increment the row `version`, and save `rsvpUpdatedAt`. A concurrent edit returns 409; reduced capacity returns a friendly `PARTY_SIZE_CHANGED` validation error, and the UI keeps the draft so the guest can retry.
- Rate limits: a shared ceiling of 300 submissions per minute and 20 submissions per invitation per 15-minute fixed window, using PostgreSQL-backed rate-limit counters with HMAC-derived keys (raw tokens are never stored in counter keys). Malformed input and disallowed origins are rejected before counters. The per-invitation counter is consumed first, so nonexistent links and per-invitation rejections cannot exhaust the shared quota. Identical repeat responses remain rate limited.
- Requests must come from the configured application origin and use strict JSON and query validation.

`GET /api/v1/guests/rsvp-summary` separates the number of invitations from the number of actual attendees, since each guest group may bring several people: `totalGuests`, `pendingInvitations`, `attendingInvitations`, `notAttendingInvitations`, `totalPeopleAttending`.

## 5.8 Expenses

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/expenses` | Member | Paginated list; `category`, `eventId`, `vendorId`, `from`, `to`. |
| `POST` | `/api/v1/expenses` | Member | Create expense; sets `createdByMembershipId`. |
| `GET` | `/api/v1/expenses/summary` | Member | Total and totals by category. |
| `GET` | `/api/v1/expenses/:expenseId` | Member | Read expense. |
| `PATCH` | `/api/v1/expenses/:expenseId` | Member | Update; validates event and vendor references. |
| `DELETE` | `/api/v1/expenses/:expenseId` | Member | Hard delete. |

Default ordering is `expenseDate` descending. Event and vendor references must belong to the current wedding.

## 5.9 Vendors and vendor discovery

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/vendors` | Member | Paginated list; `category`, `search`, `includeArchived`. |
| `POST` | `/api/v1/vendors` | Member | Create manually (`source = MANUAL`). |
| `POST` | `/api/v1/vendors/from-place` | Member | Add a discovered vendor from a Google Place ID. |
| `GET` | `/api/v1/vendors/:vendorId` | Member | Read vendor. |
| `PATCH` | `/api/v1/vendors/:vendorId` | Member | Update vendor. |
| `DELETE` | `/api/v1/vendors/:vendorId` | Member | Archive (`archivedAt`). |
| `GET` | `/api/v1/vendor-discovery/search` | Member | Search Google Places via backend; `category`, `query`, `latitude`, `longitude`. |

Discovery defaults coordinates from the wedding location when none are given. `from-place` fetches trusted Place Details itself rather than trusting client metadata, maps supported fields, and sets `source = GOOGLE_PLACES`. Discovery returns only the fields the UI needs (Place ID, name, rating, rating count, address, coordinates). The frontend never calls Google directly. Vendor search covers name and contact person.

## 5.10 Wedding website and public website

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/wedding/website` | Member | Read slug, theme, publish state, welcome message. |
| `PATCH` | `/api/v1/wedding/website` | Member | Update theme, welcome message, `isPublished`. |
| `GET` | `/api/v1/public/weddings/:slug` | Public | Published website data only. |

The slug is system-managed and stable; arbitrary slug editing is not allowed in V1. If the site is unpublished, the public endpoint returns 404 rather than revealing the wedding exists.

## 5.11 Livestream

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/wedding/livestream` | Member | Read livestream settings. |
| `PATCH` | `/api/v1/wedding/livestream` | Member | Set `youtubeUrl` and `isEnabled`. |

The backend validates supported YouTube URL formats. Removing a livestream is a PATCH with `youtubeUrl: null` and `isEnabled: false`; there is no DELETE endpoint.

## 5.12 Gallery settings and organiser photos

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/gallery/settings` | Member | Enabled flags, gallery URL and QR URL (deferred). |
| `PATCH` | `/api/v1/gallery/settings` | Member | Update `isEnabled`, `guestUploadsEnabled` (deferred). |
| `GET` | `/api/v1/gallery/qr` | Member | Return gallery URL; frontend renders the QR (deferred). |
| `GET` | `/api/v1/photos` | Member | List photos with cursor pagination. |
| `POST` | `/api/v1/photos/upload-url` | Member | Issue a short-lived signed S3 upload URL. |
| `POST` | `/api/v1/photos` | Member | Confirm upload and create Photo metadata. |
| `GET` | `/api/v1/photos/:photoId/download` | Member | Signed S3 download URL. |
| `DELETE` | `/api/v1/photos/:photoId` | Member | Delete S3 object and tombstone metadata. |

Photo binaries never flow through the API. The API issues short-lived S3 presigned upload URLs and the browser uploads directly to a private bucket. No separate media-service API exists in V1, and no QR entity is stored (Option A: the frontend generates the QR from `galleryUrl`).

**Organiser gallery implementation (2026-09-18)**

- The first increment covers authenticated Admin and Manager uploads, browsing, single-photo downloads and deletion. Public gallery-token routes, settings and QR remain deferred.
- Uploads accept JPEG, PNG and WebP, from 1 byte to 10 MiB each. The UI selects at most 20 files per batch and uploads sequentially. No video, SVG, HEIC conversion, editing, or bulk download and delete.
- The upload API reserves a server-issued staging key bound to the authenticated wedding and membership. The PUT URL lasts 10 minutes and signs Content-Type and Content-Length. Client bodies never supply `weddingId`.
- Confirmation matches the reserved metadata and membership, checks actual S3 length, MIME and the image signature, then performs a server-side S3 copy that is conditional on the object’s ETag to a new final key. Replaying a PUT cannot overwrite a published photo. Signature checking is not full image decoding or malware scanning. Reads are signed for 15 minutes.
- Confirmation is idempotent, including retries after an ambiguous response. A pending upload can be confirmed until 24 hours after its PUT URL expires so the user can reauthenticate. Deleted uploads cannot be confirmed again.
- Event assignment must reference an active event of the same wedding at issuance; existing photos stay visible if the event is later archived.
- `GET /api/v1/photos`: `limit` defaults to 24 (maximum 48); `eventId=other` selects unassigned Wedding Memories. The cursor encodes `createdAt`, `id` and the active event filter. The response keeps `{ data, pagination: { nextCursor } }` and adds `total` for the filtered count; each photo includes `mimeType` and `sizeBytes`. Queries always include `weddingId` and READY state, so pending and deleted rows are hidden.
- `GET /api/v1/photos/:photoId/download` returns `{ data: { url } }`, a newly signed S3 GET with attachment Content-Disposition. The browser downloads directly from S3.
- DELETE returns `{ data: { success: true } }` after S3 deletion and metadata tombstoning. Storage failures keep metadata and return a retryable error.
- Issuance is limited to 120 requests per member per 15 minutes, then 600 per wedding per 15 minutes. Unauthenticated, malformed and invalid-event requests do not consume quota. No application-wide quota is shared across weddings.
- Private metadata and URL responses use `Cache-Control: no-store`. Provider failures map to a generic storage-unavailable error without logging keys, credentials, signed URLs or raw provider responses.

## 5.13 Public gallery

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/public/galleries/:token` | Token | Wedding summary, upload flag, event list (deferred). |
| `GET` | `/api/v1/public/galleries/:token/photos` | Token, rate limited | Cursor-paginated gallery-safe photos (deferred). |
| `POST` | `/api/v1/public/galleries/:token/upload-url` | Token, rate limited | Short-lived signed upload URL for guests (deferred). |
| `POST` | `/api/v1/public/galleries/:token/photos` | Token, rate limited | Confirm guest upload; `uploaderType = GUEST` (deferred). |

Guest upload-url issuance validates the gallery token, that the gallery and guest uploads are enabled, that the event belongs to the wedding, and the file metadata. There is no moderation stage in V1. Gallery tokens are stable, high-entropy and shareable (see Section 9.4).

## 5.14 Email batches

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/email-batches/:batchId` | Member | Batch progress aggregated from `EmailJob.batchId`. |
| `POST` | `/api/v1/email-batches/:batchId/retry-failed` | Member | Make FAILED jobs retry-eligible (optional). |

No separate `email_batches` collection is needed. The batch must belong to the current wedding. Retry is subject to the retry policy and may be deferred if the UI does not expose it.

## 5.15 Internal

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/internal/jobs/email` | Internal | Cron-driven email worker. |

Triggered by a scheduler (or run as an in-process worker) and authenticated with an internal secret. Flow: validate the secret, recover stale `PROCESSING` jobs, claim pending jobs atomically with a PostgreSQL transaction using `FOR UPDATE SKIP LOCKED`, process a small batch, send via Resend, then mark `SENT`, retry with bounded backoff, or mark `FAILED`. It must never be exposed publicly without authentication, and no endpoint lets clients read or manipulate arbitrary `email_jobs` or rate-limit counters.

# 6. Representative request and response contracts

## 6.1 Signup

`POST /api/v1/auth/signup` — creates the account and session; email is normalized, duplicates are rejected, the password is hashed.

```text
// Request
{ "name": "Akshay Saini", "email": "akshay@example.com", "password": "strong-password" }

// Response (session cookie set)
{
  "data": {
    "user": { "id": "userId", "name": "Akshay Saini", "email": "akshay@example.com" },
    "hasWedding": false
  }
}
```

Errors: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`.

## 6.2 Current user

`GET /api/v1/auth/me` returns membership and wedding, or `null` for both when the user has not yet joined a wedding.

```text
{
  "data": {
    "user": { "id": "userId", "name": "Akshay Saini", "email": "akshay@example.com" },
    "membership": { "role": "ADMIN" },
    "wedding": { "id": "weddingId", "brideName": "Princi", "groomName": "Akshay", "weddingDate": "2027-02-14" }
  }
}
```

## 6.3 Create wedding

`POST /api/v1/wedding` — atomically creates the wedding and the Admin membership, and generates `website.slug` and the gallery token.

```text
// Request
{
  "brideName": "Princi",
  "groomName": "Akshay",
  "title": "Akshay & Princi",
  "description": "We are getting married!",
  "weddingDate": "2027-02-14",
  "timeZone": "Asia/Kolkata",
  "location": {
    "formattedAddress": "Dehradun, Uttarakhand, India",
    "city": "Dehradun", "state": "Uttarakhand", "country": "India",
    "latitude": 30.3165, "longitude": 78.0322, "googlePlaceId": "..."
  }
}

// Response
{
  "data": {
    "id": "weddingId",
    "brideName": "Princi", "groomName": "Akshay",
    "weddingDate": "2027-02-14",
    "website": { "slug": "princi-akshay-14022027" }
  }
}
```

## 6.4 Invite a member

```text
// POST /api/v1/members/invitations  (Admin)
{ "email": "rahul@example.com", "role": "MANAGER" }

// Response
{ "data": { "id": "invitationId", "email": "rahul@example.com", "role": "MANAGER",
            "status": "PENDING", "expiresAt": "..." } }
```

## 6.5 Create event

```text
// POST /api/v1/events
{
  "name": "Mehendi",
  "type": "MEHENDI",
  "startsAt": "2027-02-12T10:30:00.000Z",
  "endsAt": "2027-02-12T14:30:00.000Z",
  "venueName": "Royal Garden",
  "address": "Dehradun",
  "description": "...",
  "dressCode": "Green / Traditional"
}
// 201 Created with the created Event
```

## 6.6 Create task

```text
// POST /api/v1/tasks
{
  "title": "Finalize photographer",
  "description": "Confirm final package",
  "assignedMembershipId": "...",
  "eventId": "...",
  "dueDate": "2026-09-15T00:00:00.000Z",
  "priority": "HIGH",
  "status": "TODO"
}

// PATCH /api/v1/tasks/:taskId
{ "status": "COMPLETED" }   // sets completedAt = now
```

## 6.7 Create guest

```text
// POST /api/v1/guests
{
  "name": "Rajesh Sharma",
  "email": "rajesh@example.com",
  "phone": "+919876543210",
  "maxGuests": 4,
  "invitedEventIds": ["event1", "event2"],
  "notes": "Family friend"
}
```

The backend validates event IDs, generates the stable invitation token (32 random bytes, base64url, unique index), and creates the guest and its event associations in one Prisma transaction. The raw token is not returned by guest CRUD.

## 6.8 Public invitation and RSVP

```text
// GET /api/v1/public/invitations/:token
{
  "data": {
    "guest": { "name": "Rajesh Sharma", "maxGuests": 4, "rsvpStatus": "PENDING", "attendingCount": null },
    "wedding": { "brideName": "Princi", "groomName": "Akshay", "weddingDate": "2027-02-14",
                 "timeZone": "Asia/Kolkata", "title": "Our celebration", "location": "Jaipur, Rajasthan, India" },
    "events": [ { "name": "Wedding", "startsAt": "...", "endsAt": null, "venueName": "...",
                  "address": "...", "dressCode": "...", "description": "..." } ]
  }
}

// POST /api/v1/public/invitations/:token/rsvp
{ "status": "ATTENDING", "attendingCount": 3 }
{ "status": "NOT_ATTENDING", "attendingCount": 0 }

// Response
{ "data": { "status": "ATTENDING", "attendingCount": 3, "updatedAt": "..." } }
```

## 6.9 Expense and bulk email

```text
// POST /api/v1/expenses
{
  "title": "Photographer advance",
  "amount": "50000.00",
  "currency": "INR",
  "expenseDate": "2026-09-01",
  "category": "PHOTOGRAPHY",
  "eventId": "...",
  "vendorId": "...",
  "notes": "Advance payment"
}

// POST /api/v1/guests/actions/send-invitations
{ "scope": "SELECTED", "guestIds": ["...", "..."] }
// Response
{ "data": { "batchId": "batch-id", "jobsCreated": 437 } }

// GET /api/v1/email-batches/:batchId
{ "data": { "batchId": "...", "total": 437, "pending": 200, "processing": 30,
            "sent": 200, "failed": 7, "cancelled": 0, "completed": false } }
```

## 6.10 Photo upload flow

1. Client calls `POST /api/v1/photos/upload-url` with `filename`, `mimeType`, `sizeBytes` and optional `eventId`.
2. Backend validates MIME type, size and event ownership, then returns `uploadUrl`, `objectKey` and `expiresAt`.
3. Browser uploads the bytes directly to Amazon S3.
4. Client calls `POST /api/v1/photos` with the reserved object key and metadata; the backend verifies the key belongs to the current wedding’s upload namespace, then creates the Photo record.
5. Viewing and downloading use short-lived signed read URLs.

```text
// POST /api/v1/photos/upload-url
{ "filename": "IMG_1001.jpg", "mimeType": "image/jpeg", "sizeBytes": 5283912, "eventId": "..." }
// Response
{ "data": { "uploadUrl": "...", "objectKey": "weddings/.../gallery/...", "expiresAt": "..." } }

// GET /api/v1/photos?eventId=abc&limit=24
{ "data": [ { "id": "...", "eventId": "...", "url": "...", "originalFilename": "...",
              "uploaderType": "GUEST", "createdAt": "..." } ],
  "pagination": { "nextCursor": "..." } }
```

## 6.11 Dashboard

```text
{
  "data": {
    "countdown": { "weddingDate": "2027-02-14", "daysRemaining": 42 },
    "summary": {
      "events": 6,
      "tasks": { "total": 48, "completed": 32 },
      "guests": 186,
      "rsvps": { "pending": 54, "attending": 120, "notAttending": 12 },
      "totalExpenseAmount": "1245000.00",
      "vendors": 8
    },
    "upcomingEvents": [],
    "upcomingTasks": []
  }
}
```

# 7. Validation rules

Every external body, query parameter and route parameter passes through Zod. Validation errors return structured field details.

- Route parameters such as `eventId`, `guestId`, `vendorId`, `expenseId` and `membershipId` are validated as UUIDs before any query; malformed IDs return `400 VALIDATION_ERROR`.
- Zod validates at runtime; Prisma types do not replace it. Database constraints remain the final integrity layer.
- Guest creation: `name` required, valid optional email, `maxGuests` ≥ 1, event IDs valid UUIDs, phone length limits.
- Event, task and guest field limits are listed in Sections 5.4–5.6.
- References (event, vendor, assignee, membership) must belong to the current wedding.
- RSVP status and count must be consistent with capacity.
- Upload MIME type, size and event ownership are validated at issuance and again at confirmation.
- Google Place IDs and YouTube URLs must meet expected formats.
- Query filters use explicit allowlists, and body size is capped (8 KiB for guest bodies).

# 8. Pagination, filtering, sorting and search

## 8.1 Page-based pagination

Used for manageable admin datasets: guests, tasks, expenses, vendors. Parameters are `page` and `limit`, with an upper bound on `limit` (maximum 100). Defaults for implemented lists: page 1, limit 20.

## 8.2 Cursor pagination

Used for the photo gallery, where volume can grow and infinite scrolling is likely. The cursor is opaque to clients and represents ordering around `createdAt` and `id`. Response: `{ data: [], pagination: { nextCursor } }`. Organiser photo lists default to 24 per request (maximum 48) and include `total`.

## 8.3 Filtering

Use query parameters on collections, for example `/api/v1/tasks?status=TODO`, `/api/v1/guests?rsvpStatus=ATTENDING`, `/api/v1/expenses?category=CATERING`. Do not create endpoints such as `/api/v1/tasks/completed` or `/api/v1/tasks/high-priority` when filters solve the problem.

## 8.4 Sorting

Sorting is exposed only when a real UI needs it, and there is no generic `sortBy` system. Defaults are domain-specific:

| Resource | Default order |
|---|---|
| Events | startsAt ascending |
| Tasks | Newest created first, ID tie-breaker (implemented) |
| Guests | name ascending, ID tie-breaker (implemented) |
| Expenses | expenseDate descending |
| Photos | createdAt descending |

## 8.5 Search

Basic search is enough for V1: guests by name, email and phone; vendors by name and contact person. No Elasticsearch or separate search infrastructure.

# 9. Security and privacy

## 9.1 CSRF and CORS

- Authenticated APIs use cookies, so state-changing requests need CSRF protection: SameSite cookies, Origin/Referer validation on mutating requests, and an agreed CSRF token mechanism confirmed after implementation review.
- Serve the React app and the API from the same site (for example behind one reverse proxy, or on sibling subdomains) so that SameSite cookies work.
- If the frontend and API use different origins, CORS allows only the configured frontend origin with credentials. Wildcard origins are never allowed.

## 9.2 Rate limiting

At minimum, rate limit these endpoints. Photo flows additionally enforce upload-count and size limits.

| Endpoint | Notes |
|---|---|
| `POST /api/v1/auth/login` | Brute-force protection. |
| `POST /api/v1/auth/signup` |  |
| `POST /api/v1/auth/forgot-password` | Generic response. |
| `POST /api/v1/auth/reset-password` |  |
| `GET /api/v1/public/invitations/:token` |  |
| `POST /api/v1/public/invitations/:token/rsvp` | 300/min shared, 20 per invitation per 15 min. |
| `POST /api/v1/public/galleries/:token/upload-url` |  |
| `POST /api/v1/public/galleries/:token/photos` |  |

## 9.3 Public API data minimization

Public APIs return only what the page needs. They must not expose wedding members, guest email unless necessary, guest notes, expense data, vendor contracts, or internal IDs unnecessarily.

## 9.4 Token handling

Hashing every secret is correct for sessions and reset tokens. Guest invitation and gallery links, however, must be stable, reusable, repeatedly shareable and printable (the gallery QR), so a one-way hash cannot work. The V1 decision:

| Token | Storage |
|---|---|
| Session token | Hash only |
| Password reset token | Hash only (HMAC-SHA-256) |
| Wedding member invitation token | Hash only |
| Guest invitation token | High-entropy stable raw token (32 random bytes, base64url, unique index) |
| Gallery token | High-entropy stable raw token |

Guest and gallery tokens are unguessable “anyone with the link” secrets. They must have high entropy, never be sequential, never appear in logs, never appear in unrelated API responses, be excluded from default model reads, CRUD projections and errors, and be rotatable in future if compromised.

## 9.5 Logging

Application and error logs are written asynchronously to MongoDB Atlas, which holds technical logs only and no business data. Useful log fields: `requestId`, `method`, `route`, `status`, `userId`, `weddingId`, `duration`, `errorCode`. Never log passwords, cookies, Authorization headers, session tokens, reset tokens, member invitation tokens, guest invitation tokens, gallery tokens, S3 presigned URLs, guest phone or email, or request bodies.

## 9.6 Other requirements

- External APIs (Google Places, Resend, S3) stay behind the backend; the frontend never calls them directly.
- Cross-wedding access behaves as `NOT_FOUND`.
- Private and token-derived responses use `Cache-Control: no-store`; token-bearing pages use no-referrer and noindex.

# 10. Idempotency and concurrency

| Area | Approach |
|---|---|
| Bulk email | Idempotency key on each email job; endpoints return immediately after creating jobs. No exactly-once claim: design for retry and practical deduplication. |
| RSVP | Repeating the same state yields the same final state; atomic version and capacity checks. |
| Photo metadata | The same S3 object cannot create duplicates (unique `objectKey`); confirmation is idempotent. |
| Multi-row workflows | Prisma transactions: signup and session, wedding and Admin membership, invitation acceptance, guest and event associations, role changes with last-Admin check, RSVP update, photo confirmation. |
| Wedding creation | A user who already has a wedding receives a conflict. |
| Updates | An optimistic `version` column check returns `CONFLICT` when a concurrent write is detected. |

# 11. Implementation status

| Area | Status | Notes |
|---|---|---|
| **Events** | Implemented (2026-09-16) | Cover uploads deferred. |
| **Tasks** | Implemented (2026-09-16) | Full CRUD, filters, optimistic concurrency. |
| **Guest CRUD** | Implemented (2026-09-16) | Search, filters, capacity guards. |
| **Invitation link, public invitation, RSVP, RSVP summary** | Implemented (2026-09-16) | Sections 5.6 and 5.7. |
| **Guest email delivery, bulk actions, reminders** | Deferred | EmailJobs do not exist yet; guest deletion must cancel pending jobs when they do. |
| **Organiser gallery (upload, browse, download, delete)** | Implemented (2026-09-18) | Section 5.12. |
| **Public gallery routes, gallery settings, QR** | Deferred |  |
| **Cover image uploads** | Deferred | Same direct-upload architecture. |

# 12. Out of scope for V1

The V1 API includes no endpoints for:

- Multiple weddings per user
- Budget planning and payment installments
- Hotels, travel and transport
- Seating plans
- SMS and WhatsApp API automation
- Realtime notifications and WebSockets
- Activity logs
- Advanced photo moderation
- Vendor marketplace checkout and vendor payments
- Custom domains
- AI assistant and product analytics

# 13. Frozen design decisions

1. **REST through Express route handlers (Node.js with TypeScript), consumed by a React frontend.**
2. **Private APIs derive wedding context from the authenticated session.** The client does not control tenant identity.
3. **Admin and Manager share almost all functionality.** Only member-management mutations require Admin.
4. **Public guest APIs use high-entropy token URLs instead of login.**
5. **Page-based pagination for admin lists; cursor pagination for photos.**
6. **Zod at every external API boundary.**
7. **Consistent application error objects.**
8. **Action endpoints only where an operation is not simple CRUD** (send-invitation, send-reminder, accept, rsvp).
9. **Bulk emails return immediately after creating EmailJobs;** processing is asynchronous.
10. **Photo binaries never flow through normal API endpoints.** The API issues short-lived S3 presigned upload URLs and the browser uploads directly to a private bucket.
11. **PostgreSQL via Prisma is the single source of truth for business data.** MongoDB Atlas stores technical logs only.
12. **External APIs are hidden behind the backend.** The frontend never calls Google Places directly.
13. **Cross-wedding resource access behaves like NOT_FOUND.**

# 14. Typical end-to-end flow

```text
POST /api/v1/auth/signup
  → POST /api/v1/wedding
  → POST /api/v1/events
  → POST /api/v1/members/invitations
  → POST /api/v1/tasks
  → POST /api/v1/guests
  → POST /api/v1/guests/actions/send-invitations
  → Background email jobs
  → GET  /api/v1/public/invitations/:token
  → POST /api/v1/public/invitations/:token/rsvp
  → POST /api/v1/expenses
  → POST /api/v1/vendors
  → PATCH /api/v1/wedding/website
  → POST /api/v1/public/galleries/:token/upload-url
  → Direct Amazon S3 upload
  → POST /api/v1/public/galleries/:token/photos
```

# 15. Acceptance checklist and next step

- [ ] Every route has a method, path, access level and documented contract.
- [ ] No private route trusts a client-provided `weddingId`.
- [ ] Admin-only member-management rules are enforced by the backend.
- [ ] Guest endpoints work without accounts but require purpose-specific tokens.
- [ ] Lists are paginated, filtered and wedding-scoped.
- [ ] Cross-wedding access returns `NOT_FOUND`.
- [ ] Public responses contain only approved fields and no token-bearing route is logged.
- [ ] Photo bytes never pass through API routes; signed URLs are short-lived.
- [ ] Error responses are consistent and leak no provider or internal details.
- [ ] Sensitive routes are rate limited and logs exclude secrets.
- [ ] Tests cover cross-wedding access, Manager restrictions, token handling, RSVP rules and upload authorization.

With the PRD, System Design, Database Design and API Design frozen, the next document is **Application / Codebase Architecture**: backend folder structure, domain modules, route-handler and middleware structure, services, Prisma schema and repositories, Zod schemas, authentication and authorization utilities, error classes, and the email, S3 storage, logging and Google Places abstractions, followed by the React frontend architecture.
