# Make My Marriage
## System Design Architecture Document

| Item | Detail |
|---|---|
| Version | V1 |
| Status | Approved Architecture Baseline |
| Architecture Style | Modular Monolith (backend) with a statically hosted React frontend |
| Application Type | Full-stack Web Application |
| Technology Stack Revision | 11 October 2026 |

---

# 1. Purpose

This document defines the high-level system architecture for **Make My Marriage**, a collaborative Indian wedding-management platform.

The purpose of this document is to establish:

- Overall architecture
- Major system components
- Application boundaries
- Backend structure
- Authentication and authorization model
- Data ownership and multi-tenancy
- Guest-access architecture
- File-storage architecture
- Email architecture
- Vendor-discovery integration
- Wedding website architecture
- Technical logging
- Deployment topology and CI/CD
- Security considerations
- Scaling strategy
- Reliability and failure-handling principles

This document intentionally remains at the **system-design level**.

Detailed:

- Prisma schemas and PostgreSQL table structures
- Index and constraint definitions
- API request/response contracts
- UI component architecture
- Individual API implementation
- Exact folder structure

will be defined separately.

---

# 2. Architecture Goals

The architecture should prioritize:

1. **Simplicity**
2. **Maintainability**
3. **Fast development**
4. **Clear domain boundaries**
5. **Production readiness**
6. **Low infrastructure overhead**
7. **Reasonable scalability**
8. **Security between weddings**
9. **Excellent mobile guest experience**
10. **Ability to evolve without premature distributed-system complexity**

The architecture should comfortably support approximately:

- Up to 1,000 guests per wedding
- Up to 5,000 photos per wedding
- Thousands of weddings over time

without requiring major architectural changes.

---

# 3. Architecture Principles

## 3.1 Start as a Modular Monolith

The entire backend will initially operate as one deployable API application built with Node.js and Express. The React frontend is built as a static bundle and delivered separately.

We will not introduce microservices unless a future scaling or organizational requirement justifies them.

---

## 3.2 Wedding is the Tenant Boundary

The primary unit of isolation is the:

**Wedding**

Almost every private domain object belongs to one wedding.

Examples:

- Events
- Tasks
- Guests
- Vendors
- Expenses
- Photos
- Invitations
- Wedding Members

This rule must be enforced consistently throughout the backend.

---

## 3.3 Explicit APIs

The React frontend and the Express backend are separate deployable units. They communicate exclusively through clearly designed REST APIs.

This creates clean boundaries between:

- UI
- Authentication
- Validation
- Business logic
- Data persistence

---

## 3.4 Guests Require No Accounts

Wedding Guests should never be forced through an authentication flow.

Guest-facing functionality will rely on secure, sufficiently random access tokens.

---

## 3.5 Managed Infrastructure Where Possible

The product should avoid unnecessary infrastructure management.

Managed services will be used for:

- Frontend hosting and delivery (S3 + CloudFront)
- API hosting (ECS Fargate + ALB)
- Relational database (Amazon RDS PostgreSQL)
- Technical logs (MongoDB Atlas)
- Object storage (Amazon S3)
- Email (Resend)
- Vendor discovery (Google Places API)

---

# 4. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + TypeScript | UI and user interactions |
| API | Node.js + Express + TypeScript | HTTP APIs and business logic |
| ORM | Prisma | Database queries and migrations |
| Main database | Amazon RDS PostgreSQL | Persistent business data |
| Technical logs | MongoDB Atlas | Errors, diagnostics and request logs |
| File storage | Amazon S3 | Wedding photos and gallery files |
| Email | Resend | Invitations and password-reset emails |
| Frontend delivery | S3 + CloudFront | Static frontend hosting and delivery |
| API deployment | ECS Fargate + ALB | Container hosting and HTTPS routing |
| CI/CD | GitHub Actions + AWS OIDC | Automated tests and deployments |

## 4.1 Supporting Conventions and Integrations

| Concern | Choice |
|---|---|
| Language | TypeScript (frontend and backend) |
| API Style | REST |
| Architecture | Modular Monolith (backend) |
| Validation | Zod |
| Authentication | Custom authentication |
| Sessions | Server-side sessions (PostgreSQL) + secure cookies |
| Background Email | PostgreSQL email jobs + in-process worker + small batches |
| Vendor Discovery | Google Places API |
| Livestream | YouTube Embed |
| Realtime | Not used in V1 |
| Product Analytics | Not used in MVP |

## 4.2 Data Ownership Between Databases

- **PostgreSQL (RDS)** is the single source of truth for all business data: users, sessions, weddings, memberships, events, tasks, guests, vendors, expenses, photo metadata, email jobs and rate-limit counters.
- **MongoDB Atlas** stores technical logs only: errors, diagnostics and request logs.
- No business rule, authorization decision or user-facing feature may depend on data stored in MongoDB Atlas.

---

# 5. High-Level System Architecture

```text
                             ┌───────────────────────┐
                             │        Browser        │
                             │   Members + Guests    │
                             └───────────────────────┘
                                         │
                                         │ HTTPS
                                         ▼
                             ┌───────────────────────┐
                             │      CloudFront       │
                             └───┬───────────────┬───┘
                                 │               │
                        static   │               │ /api/*
                                 ▼               ▼
                          ┌─────────────┐ ┌─────────────┐
                          │  Amazon S3  │ │     ALB     │
                          │  React SPA  │ │HTTPS routing│
                          └─────────────┘ └──────┬──────┘
                                                 │
                                                 │
                                                 ▼
                     ┌───────────────────────────────────────┐
                     │      Express API on ECS Fargate       │
                     │                                       │
                     │          REST Route Handlers          │
                     │           Business Services           │
                     │      Persistence Layer (Prisma)       │
                     │        Background Email Worker        │
                     └───────────────────┬───────────────────┘
                                         │
                                         │
         ┌───────────────┬───────────────┼───────────────┬───────────────┐
         ▼               ▼               ▼               ▼               ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │     RDS     │ │MongoDB Atlas│ │  Amazon S3  │ │   Resend    │ │Google Places│
  │ PostgreSQL  │ │  Tech logs  │ │   Photos    │ │    Email    │ │   Vendors   │
  │  App data   │ │             │ │             │ │             │ │             │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

# 6. Modular Monolith Architecture

Although the entire backend is deployed as one application, business functionality should be divided into domain modules.

Conceptually:

```text
API Application

├── Auth
├── Wedding
├── Wedding Members
├── Events
├── Tasks
├── Guests
├── Invitations
├── Expenses
├── Vendors
├── Wedding Website
├── Gallery
├── Livestream
└── Email
```

Each module should own its business logic.

For example:

```text
Guests

API Layer (Express)
   ↓
Guest Validation (Zod)
   ↓
Guest Service
   ↓
Guest Persistence (Prisma)
   ↓
PostgreSQL
```

API route handlers should remain thin.

They should primarily:

1. Parse request
2. Authenticate user where required
3. Validate request
4. Call business service
5. Return HTTP response

Business logic should not become embedded inside individual route files.

---

# 7. Application Surfaces

The product has three fundamentally different application surfaces. All three are delivered by the same React frontend, which is served from S3 through CloudFront and talks to the Express API under `/api/*`.

---

## 7.1 Private Wedding Dashboard

Example:

```text
/app/*
```

Requires authenticated Wedding Member access.

Includes:

- Dashboard
- Events
- Tasks
- Guests
- Invitations
- RSVP management
- Expenses
- Vendors
- Wedding website configuration
- Photo management
- Livestream
- Settings
- Wedding Members

---

## 7.2 Public Wedding Website

Example:

```text
/w/akshay-princi-14022027
```

Does not require authentication.

Contains intentionally public wedding information configured by Wedding Members, loaded from the public API (`/api/public/*`).

Possible sections:

- Couple information
- Wedding date
- Events
- Venues
- Gallery
- Livestream

---

## 7.3 Token-Protected Guest Experience

Examples:

```text
/invite/:token

/gallery/:token
```

No account or login required.

Access is controlled by possession of an unpredictable secret token.

These pages include:

### Invitation

- Guest-specific invitation
- Invited events
- RSVP

### Gallery

- View wedding photos
- Upload wedding photos

---

## 7.4 Single-Page Application Delivery

Because the frontend is a static React bundle, CloudFront serves `index.html` for any client-side route (for example `/w/akshay-princi-14022027`), and the React application resolves the route in the browser.

Token-bearing routes (`/invite/*` and `/gallery/*`) receive additional protective response headers from CloudFront, such as `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`. API responses carrying private or token-derived data are sent with `Cache-Control: no-store`.

---

# 8. Authentication Architecture

Make My Marriage will implement custom email/password authentication in the Express API.

No external authentication framework will be required for V1.

---

## 8.1 Signup Flow

```text
User
 │
 ▼
POST /api/auth/signup
 │
 ▼
Validate Input
 │
 ▼
Check Existing Email
 │
 ▼
Hash Password
 │
 ▼
Create User
 │
 ▼
Create Session
 │
 ▼
Set Secure Cookie
 │
 ▼
Create Wedding / Join Wedding
```

No email verification is required in V1.

---

# 9. Password Security

Passwords must never be stored directly.

The application should store only a secure password hash using an industry-standard password-hashing library.

Conceptually:

```text
Plain Password
      ↓
Password Hashing Algorithm
      ↓
Password Hash
      ↓
PostgreSQL
```

Authentication code should never implement cryptographic primitives manually.

---

# 10. Session Architecture

The preferred authentication model is server-side sessions.

Conceptually:

```text
Login
  ↓
Create Session
  ↓
Store session in PostgreSQL
  ↓
Return random session token
  ↓
Store token in secure cookie
```

Session metadata may include:

```text
sessionId
userId
createdAt
expiresAt
```

Browser cookie should use appropriate protections such as:

- HttpOnly
- Secure
- SameSite

The cookie contains a session identifier rather than trusted authorization information.

CloudFront routes `/api/*` to the ALB, so the browser sees the frontend and the API under one site. This keeps cookie handling simple and avoids cross-origin requests.

---

# 11. Logout

Logout flow:

```text
User
 ↓
POST /api/auth/logout
 ↓
Invalidate Session
 ↓
Delete Session Cookie
```

Sessions should also expire automatically after a defined period.

---

# 12. Password Reset

Password reset still requires email even though email verification does not.

Flow:

```text
Forgot Password
      ↓
Enter Email
      ↓
Generate Secure Reset Token
      ↓
Store Token Hash + Expiry
      ↓
Send Reset Email through Resend
      ↓
User Opens Link
      ↓
Set New Password
      ↓
Invalidate Reset Token
```

Existing active sessions may optionally be invalidated when a password is reset.

---

# 13. Wedding Membership Model

Authenticated users interact with weddings through a membership relationship.

Conceptually:

```text
User
 │
 ▼
WeddingMembership
 │
 ├── weddingId
 └── role
```

Roles:

```text
ADMIN
MANAGER
```

---

# 14. Authorization

Authorization will be intentionally simple.

### Admin

Can perform all wedding-management operations.

Additionally:

- Invite Wedding Members
- Remove Wedding Members
- Change Wedding Member roles

### Manager

Can perform normal wedding-management operations.

Cannot:

- Invite Wedding Members
- Remove Wedding Members
- Modify Wedding Member roles

---

# 15. Authorization Flow

Every private API request should conceptually perform:

```text
Request
   ↓
Authenticate Session
   ↓
Resolve Current User
   ↓
Resolve Wedding Membership
   ↓
Resolve weddingId
   ↓
Check Required Permission
   ↓
Perform Operation
```

Example:

```text
PATCH /api/tasks/:taskId
```

The backend should not simply load:

```text
Task where id = taskId
```

Instead it should validate that the task belongs to the authenticated user's wedding.

Conceptually:

```text
Task where

id = taskId
AND
weddingId = currentWeddingId
```

This prevents cross-wedding access.

---

# 16. Multi-Tenancy

Even though users can only participate in one wedding in V1, the application is still multi-tenant.

Each Wedding represents one tenant.

Data isolation must be enforced at the backend.

Example:

```text
Wedding A
 ├── Events
 ├── Tasks
 ├── Guests
 └── Expenses

Wedding B
 ├── Events
 ├── Tasks
 ├── Guests
 └── Expenses
```

Members of Wedding A must never have access to Wedding B data.

Front-end filtering alone is not sufficient.

Isolation must happen in backend queries.

---

# 17. Wedding Creation Flow

```text
New User
   ↓
Authenticated
   ↓
No Wedding Membership Found
   ↓
Create Wedding
   ↓
Create Wedding Membership
   ↓
Role = ADMIN
   ↓
Redirect to Dashboard
```

Creating a wedding and creating its initial membership should happen atomically in a single Prisma transaction, with appropriate error handling.

---

# 18. Wedding Member Invitation Architecture

Admins can invite another person by email.

Example:

```text
rahul@example.com
Role: MANAGER
```

The system creates a Wedding Member Invitation containing information such as:

```text
weddingId
email
role
tokenHash
status
expiresAt
```

---

# 19. Wedding Member Invitation Flow

```text
Admin
  ↓
Invite Email
  ↓
Create Invitation
  ↓
Send Email through Resend
  ↓
Recipient Opens Invite
```

If recipient does not have an account:

```text
Invitation
   ↓
Signup
   ↓
Create User
   ↓
Accept Invitation
   ↓
Create Membership
```

If recipient already has an account:

```text
Invitation
   ↓
Login
   ↓
Accept Invitation
   ↓
Create Membership
```

No email verification is required.

If the user already belongs to another wedding, the invitation should be rejected because V1 supports one wedding per user.

---

# 20. Wedding Member Safety Rules

The backend should prevent:

- Manager inviting another Manager
- Manager changing roles
- Manager removing members
- Wedding ending with zero Admins
- Unauthorized membership modification
- Joining multiple weddings

---

# 21. Guest Architecture

Guests are fundamentally different from Wedding Members.

A guest:

- Has no User account
- Has no password
- Has no session
- Has no application role

A Guest is simply wedding data.

Conceptually:

```text
Wedding
  ↓
Guest
  ↓
Invitation Token
```

---

# 22. Guest Invitation Tokens

Guest URLs should never expose predictable identifiers.

Avoid:

```text
/invite/12345
```

Use:

```text
/invite/Fkm28KmSx92L...
```

The token should have enough entropy that guessing another guest's link is practically infeasible.

V1 uses the deliberate stable-sharing exception in `API_DESIGN.md` §44: store a high-entropy random invitation token on the Guest record so organisers can later retrieve the same sharing URL. Exclude it from ordinary queries and all guest CRUD responses; never log it. This supersedes the earlier optional hash-only suggestion for guest invitations. Session and member invitation tokens remain HMAC-hashed under their existing rules.

---

# 23. Guest RSVP Flow

```text
Guest Opens
/invite/:token
      ↓
Validate Token
      ↓
Resolve Guest
      ↓
Load Invited Events
      ↓
Display Invitation
      ↓
Guest Submits RSVP
      ↓
Validate Maximum Guest Count
      ↓
Update RSVP
```

Guest may return to the same link later and modify their RSVP.

Implemented 2026-09-16: Admin/Manager guest details retrieve the stable sharing URL; public `/invite/:token` and invitation APIs require no account. Guest invitation services own token resolution, minimal public projections, capacity validation, repeat-response idempotency, and wedding-scoped summaries. The events repository loads only active invited events in that wedding. Atomic guest version/capacity checks prevent lost updates across organiser edits and RSVP submissions.

The public page follows the approved Stitch floral hero, overlapping RSVP status card, dated itinerary, and formal response form. It retains input on failure and refreshes permitted details on focus. Generic unavailable states hide deleted or invalid links. Application logging excludes token-bearing request paths, and no-store/no-referrer/noindex protections apply. RSVP writes reuse the PostgreSQL-backed rate-limit mechanism (300/minute globally; 20 per invitation/15 minutes) with HMAC counter keys. Token/owner resolution and capacity validation precede quota use; per-invitation admission precedes shared admission, so invalid links and rejected per-invitation attempts do not spend shared capacity. Dashboard RSVP groups and people attending use saved data.

Guest email delivery, bulk actions, reminders, deadlines, individual guest rosters, dietary preferences, transport, and room allocation are outside this increment.

---

# 24. Gallery Guest Access

Gallery access uses a wedding-level token rather than guest-specific tokens.

Example:

```text
/gallery/7hP3kD9a...
```

This URL may be shared using:

- Wedding website
- WhatsApp
- Printed material
- QR code

Access to this URL allows guests to:

- View wedding photos
- Upload wedding photos

No account is required.

---

# 25. QR Code Architecture

The QR code should simply encode the stable gallery URL.

Example:

```text
https://makemymarriage.com/gallery/7hP3kD9a...
```

The QR image itself does not need to be persisted.

It can be generated whenever an organiser requests it.

This ensures:

- QR remains lightweight
- URL remains stable
- Previously printed QR codes continue to function

---

# 26. Wedding Website Architecture

Each Wedding has a public website.

Example:

```text
/w/akshay-princi-14022027
```

The React application resolves the slug to a Wedding through the public API.

The website renderer then loads public information such as:

- Couple details
- Wedding date
- Event information
- Theme
- Gallery settings
- Livestream configuration

---

# 27. Wedding Slug Generation

Initial slug generation may use:

```text
brideName-groomName-weddingDate
```

Example:

```text
akshay-princi-14022027
```

Slug generation should:

1. Normalize names
2. Remove unsupported characters
3. Add wedding date
4. Check uniqueness
5. Add suffix if collision exists

Example collision:

```text
akshay-princi-14022027

akshay-princi-14022027-2
```

Uniqueness is enforced by a unique constraint in PostgreSQL, not only by an application-level check.

The slug should remain stable after creation.

Changing:

- Bride name
- Groom name
- Wedding date

should not automatically change an already published URL.

This prevents broken shared links.

---

# 28. Wedding Themes

All themes operate over the same wedding data.

Conceptually:

```text
Wedding Data
     ↓
Theme Selection
     ↓
Theme Renderer (React)
     ↓
Wedding Website
```

Example:

```text
Theme = CLASSIC
Theme = MINIMAL
Theme = MODERN
```

Themes should modify presentation rather than duplicate wedding content.

---

# 29. Event Architecture

Events belong to a Wedding.

Other modules can optionally reference Events.

Conceptually:

```text
Wedding
  ↓
Event
```

Then:

```text
Task ───────→ Event
Guest Invite → Event
Vendor ─────→ Event
Expense ────→ Event
Photo ──────→ Event
```

These associations are optional depending on the entity.

For example, an expense does not necessarily have to belong to an event.

---

# 30. Task Architecture

Tasks belong to the wedding and may reference:

- Assigned Wedding Member
- Wedding Event

The backend should validate that:

- Assigned member belongs to the same Wedding
- Related Event belongs to the same Wedding

This prevents accidental cross-tenant references.

---

# 31. Guest Data Architecture

Guests belong directly to the Wedding.

A Guest may be associated with several Events.

Conceptually:

```text
Guest
 ├── Wedding
 ├── Invited Events[]
 ├── RSVP Status
 └── Number Attending
```

Individual family members are not modelled.

---

# 32. Expense Architecture

Expenses belong to the Wedding.

Expenses can optionally reference:

```text
Event
Vendor
```

Conceptually:

```text
Expense
 ├── weddingId
 ├── eventId?
 └── vendorId?
```

The Expense Tracker does not implement budgets or payment schedules.

---

# 33. Vendor Architecture

Two different concepts exist:

## My Vendors

Application-owned vendor records saved by Wedding Members.

## Vendor Discovery

External business search powered by Google Places.

---

# 34. Vendor Discovery Flow

```text
Wedding Member
      ↓
Choose Vendor Category
      ↓
Choose Location
      ↓
Express API
      ↓
Google Places API
      ↓
Return Results
```

The default location should come from the Wedding.

Users should be allowed to modify the search location.

---

# 35. Wedding Location Data

Wedding location should be stored as structured information rather than only free text.

Conceptually:

```text
formattedAddress
city
state
country
latitude
longitude
googlePlaceId
```

Coordinates allow efficient nearby-vendor searches.

---

# 36. Add Discovered Vendor Flow

```text
Google Places Result
        ↓
User clicks
"Add to My Vendors"
        ↓
Extract Relevant Vendor Information
        ↓
Create Internal Vendor Record
        ↓
Vendor now belongs to Wedding
```

After this point, the application's Vendor record should not rely exclusively on Google remaining available.

---

# 37. Photo Storage Architecture

Actual image files should not be stored inside the database.

Architecture:

```text
PostgreSQL (RDS)
   ↓
Photo Metadata

Amazon S3
   ↓
Actual Image Binary
```

PostgreSQL may store:

```text
weddingId
eventId
objectKey
fileName
mimeType
size
uploaderType
createdAt
```

Amazon S3 stores the physical files. The photo bucket is private and blocks all public access.

---

# 38. Why Direct-to-S3 Uploads

Large files should not travel through the API containers if avoidable.

Avoid:

```text
Phone
 ↓
Express API (ECS)
 ↓
Amazon S3
```

Preferred:

```text
Phone
      ↓
Request Upload Permission
      ↓
Express API
      ↓
Generate Presigned Upload URL
      ↓
Phone
      ↓
Direct Upload
      ↓
Amazon S3
```

---

# 39. Photo Upload Flow

Detailed flow:

```text
Guest / Member
       ↓
POST Request for Upload URL
       ↓
Validate Wedding / Gallery Access
       ↓
Validate File Metadata
       ↓
Generate Presigned S3 Upload URL
       ↓
Return URL
       ↓
Browser Uploads Directly to S3
       ↓
Upload Success
       ↓
Notify Backend
       ↓
Create Photo Metadata in PostgreSQL
```

For authenticated Wedding Members, session authorization is used.

For Guests, gallery token authorization is used.

---

# 40. Upload Security

Guest uploads are anonymous from an account perspective, so upload security is important.

The backend should validate:

- Allowed MIME types
- File extensions where relevant
- Maximum file size
- Number of files per request
- Gallery token validity
- Upload URL expiration

Presigned URLs should be short-lived.

Guest should not receive broad bucket permissions.

---

# 41. Photo Moderation

There is no moderation workflow in V1.

Guest upload:

```text
Upload
   ↓
Gallery
```

Wedding Members can delete unwanted photos afterwards.

---

# 42. Photo Download and Viewing

Gallery users should primarily load appropriately optimized images for browsing.

Original files can remain available for downloading if required.

The initial version should avoid building a complicated custom image-processing pipeline.

Image optimization can be improved later depending on:

- Storage use
- Bandwidth
- Gallery performance
- User behaviour

---

# 43. Livestream Architecture

No streaming infrastructure will be built.

Wedding Member enters a YouTube Live URL.

```text
Wedding Settings
      ↓
YouTube URL
      ↓
Validate
      ↓
Store URL / Video Identifier
      ↓
Wedding Website
      ↓
Embedded YouTube Player
```

Make My Marriage is therefore only responsible for displaying the stream.

---

# 44. Email Architecture

Resend will be the external email delivery provider.

Email categories include:

### Authentication

- Password reset

### Wedding Members

- Wedding Member invitation

### Guests

- Wedding invitation
- RSVP reminder

---

# 45. Internal Email Abstraction

The application should have an internal email service.

Conceptually:

```text
Business Module
      ↓
Email Service
      ↓
Resend Adapter
      ↓
Resend API
```

Business code should not call the Resend SDK throughout the application.

This allows:

- Centralized email templates
- Easier testing
- Provider replacement later
- Consistent error handling

---

# 46. Immediate Emails

Some emails should be sent synchronously or close to synchronously.

Examples:

```text
Password Reset

Single Wedding Member Invitation

Single Guest Invitation
```

These operations do not justify background infrastructure.

---

# 47. Bulk Email Problem

A wedding may contain up to approximately:

```text
1,000 Guests
```

If Admin chooses:

```text
Send Invitations to All Guests
```

the application should not attempt hundreds of provider calls inside the user-facing request.

---

# 48. Lightweight Background Email Architecture

Rather than:

- Redis
- BullMQ
- RabbitMQ
- Kafka
- Dedicated worker server

V1 will use:

```text
PostgreSQL (email_jobs)
+
In-process worker inside the API service
+
Small Resend Batches
```

---

# 49. Email Job Flow

```text
Admin
  ↓
Send Invitations to 700 Guests
  ↓
Express API
  ↓
Create Email Jobs
  ↓
Return Success to User
```

Background:

```text
Email Worker (timer inside API process)
    ↓
Atomically Claim Pending Email Jobs
    ↓
Mark Processing
    ↓
Process Small Batch
    ↓
Resend
    ↓
Update Job Status
```

---

# 50. Email Job States

Conceptually:

```text
PENDING

PROCESSING

SENT

FAILED
```

Useful metadata:

```text
attempts
lastAttemptAt
errorMessage
sentAt
```

Exact schema belongs in database design.

---

# 51. Batch Size

The system should intentionally use small batches.

For example:

```text
25–50 emails
```

per processing cycle.

Exact values should remain configurable.

This protects:

- Container resource limits
- Email provider rate limits
- Application reliability

---

# 52. Email Retries

Failed email jobs may be retried a limited number of times.

Example:

```text
Attempt 1
   ↓ Fail

Attempt 2
   ↓ Fail

Attempt 3
   ↓ Fail

Mark FAILED
```

Retries should not continue forever.

The application should avoid duplicate delivery through careful job-state handling and provider-level idempotency where available.

---

# 53. Concurrency Protection for Background Jobs

The API service may run more than one Fargate task, so two workers can run at the same time. The same email must not be sent twice.

Therefore workers need a safe claiming mechanism.

Conceptually:

```text
PENDING
   ↓ atomic claim
PROCESSING
```

Only one worker should successfully claim a particular job. In PostgreSQL this is done with a single atomic statement that selects pending rows using row locking with `FOR UPDATE SKIP LOCKED` and marks them as processing in the same operation (executed through Prisma's raw-query support).

Jobs left in `PROCESSING` beyond a defined timeout (for example after a task is stopped mid-batch) are returned to `PENDING` so they can be retried.

---

# 54. Worker Scheduling

The email worker runs inside the API process on a configurable interval. It has no public endpoint, so no externally callable trigger or cron secret is required.

On shutdown (for example when ECS stops a task during a deployment), the worker stops claiming new jobs and finishes or releases its current batch before the process exits.

---

# 55. Database Connection Architecture

PostgreSQL on Amazon RDS will be accessed through Prisma.

The application should reuse database connections across requests.

Avoid:

```text
Request
 ↓
Open New Database Connection
 ↓
Query
 ↓
Close
```

Instead use a single reusable Prisma Client per process.

Conceptually:

```text
Application
      ↓
Prisma Client (one per process)
      ↓
Connection Pool
      ↓
RDS PostgreSQL
```

The pool size per task must be chosen so that the total across all running Fargate tasks stays within the connection limit of the RDS instance.

---

## 55.1 Technical Log Store Connection

MongoDB Atlas is connected separately and used only by the logging service. It must never sit on the critical path of a user request (see Section 62).

---

# 56. Database Design Philosophy

The exact database model is outside this document, but several rules are already established.

Model the domain as normalized relational tables connected by foreign keys.

Do not store large collections inside a single record or JSON column.

Avoid:

```text
Wedding {
  thousandsOfGuests: [...],
  thousandsOfPhotos: [...],
  allTasks: [...],
  allExpenses: [...]
}
```

Instead each major entity should have its own table, and every wedding-owned table carries a `weddingId` foreign key.

Examples:

```text
users
sessions
weddings
wedding_memberships
member_invitations

events
tasks

guests

vendors
expenses

photos

email_jobs
rate_limit_counters
```

Exact naming and structure will be decided during database design.

Schema changes are managed exclusively through Prisma migrations.

Technical logs live in MongoDB Atlas collections (for example error logs, request logs and diagnostics) and are not part of the relational model.

---

# 57. API Architecture

The application will use REST APIs served by Express.

Examples:

```text
/api/auth/*

/api/wedding/*

/api/members/*

/api/events/*

/api/tasks/*

/api/guests/*

/api/invitations/*

/api/expenses/*

/api/vendors/*

/api/gallery/*

/api/livestream/*
```

Public APIs may live under:

```text
/api/public/*
```

---

# 58. API Layer Responsibilities

Route handlers should perform:

```text
Authentication
Authorization
Input parsing
Zod validation
Calling services
Mapping errors
Returning HTTP responses
```

They should not contain complicated business rules.

---

# 59. Service Layer Responsibilities

Business service modules should contain:

- Domain rules
- Permission-independent business validation
- Cross-entity validation
- Workflow coordination
- Repository/database operations

Example:

```text
GuestService.createGuest()

TaskService.assignTask()

WeddingService.createWedding()

InvitationService.submitRSVP()

GalleryService.createUploadPermission()
```

---

# 60. Validation Strategy

Zod will validate external inputs.

Examples:

- Signup payload
- Event creation
- Task creation
- Guest creation
- RSVP submission
- Expense creation
- Vendor creation

Validation should happen at the system boundary.

Prisma's typed schema and PostgreSQL constraints (NOT NULL, UNIQUE, foreign keys and CHECK constraints) additionally protect database integrity.

These layers serve different purposes.

---

# 61. Error Handling

Errors should eventually map into consistent categories through a central Express error-handling middleware.

Examples:

```text
VALIDATION_ERROR

UNAUTHENTICATED

FORBIDDEN

NOT_FOUND

CONFLICT

RATE_LIMITED

INTERNAL_ERROR
```

API responses should not expose internal stack traces to users.

---

# 62. Logging

V1 uses MongoDB Atlas as the technical log store.

Stored there:

- Errors
- Diagnostics
- Request logs

Example log context:

```text
requestId
userId
weddingId
operation
route
statusCode
durationMs
error
timestamp
```

Rules:

- Logging goes through a single internal logging service.
- Logging must never block or fail a user request. Writes are asynchronous, and if MongoDB Atlas is unavailable the logger drops or buffers entries rather than returning an error to the user.
- Sensitive information such as passwords and tokens must never be logged. Token-bearing paths are logged in their route form (for example `/invite/:token`).
- Log collections use a retention policy (for example a TTL index) so they do not grow without limit.
- MongoDB log data is for diagnostics only and must never be used for business decisions.

---

# 63. No External Observability Platform in MVP

V1 will not initially introduce:

- Sentry
- Datadog
- New Relic
- PostHog

These can be introduced later once usage justifies them.

The architecture should not prevent adding them later.

---

# 64. Security Architecture

Security is particularly important because weddings contain private family information and guest data.

Primary areas:

1. Authentication security
2. Authorization
3. Tenant isolation
4. Guest-token security
5. Upload security
6. Input validation
7. Rate limiting
8. Secret management
9. External API security
10. Network isolation

---

# 65. API Authorization

Private routes must require a valid authenticated session.

Protected services must never trust:

```text
weddingId supplied by frontend
```

as proof of access.

Wedding identity should be derived from the authenticated membership.

---

# 66. Object-Level Authorization

Consider:

```text
PATCH /api/events/123
```

The existence of event `123` is not enough.

Backend should verify:

```text
event.id = 123

AND

event.weddingId = currentWeddingId
```

This rule applies to:

- Events
- Tasks
- Guests
- Vendors
- Expenses
- Photos
- Other wedding-owned resources

---

# 67. Rate Limiting

The most sensitive endpoints for rate limiting include:

```text
POST /api/auth/login

POST /api/auth/signup

POST /api/auth/forgot-password

POST /api/public/invite/:token/rsvp

POST /api/public/gallery/:token/upload-request
```

The first version uses a lightweight PostgreSQL-backed counter mechanism (keyed by HMAC of the identifier and a time window) so that limits are shared across all running API tasks without introducing Redis or another infrastructure dependency.

Rate-limiting architecture can evolve separately from core business services.

---

# 68. Secret Management

Sensitive credentials must exist only in server-side environment configuration, injected into the ECS task at runtime.

Examples:

```text
PostgreSQL connection URL

MongoDB Atlas URI

S3 bucket configuration

Resend API key

Google Places key

Session secret

HMAC secret
```

AWS access for S3 uses the ECS task IAM role, so no long-lived AWS access keys exist in the running application.

These values must never be exposed in browser bundles.

---

# 69. Google Places Security

Google Places requests should primarily originate from the backend.

Flow:

```text
Browser
  ↓
Make My Marriage API
  ↓
Google Places API
```

This allows:

- Credential protection
- Request validation
- Centralized API usage
- Potential caching later

---

# 70. File Security

The Amazon S3 photo bucket must block all public access and must not make uploaded images publicly writable.

Uploads should use narrowly scoped, expiring presigned URLs.

Private gallery behaviour should be respected when deciding how objects are served: photos are served through short-lived presigned read URLs rather than public object URLs.

---

# 71. Data Privacy

Private wedding-management information should only be available to Wedding Members.

Guest invitation pages expose only information relevant to that invitation.

Public wedding website exposes only intentionally published information.

Gallery exposes only content intended for gallery participants.

---

# 72. Performance Strategy

V1 should focus on straightforward optimizations rather than advanced distributed caching.

Primary techniques:

- Proper PostgreSQL indexes
- Pagination
- Connection reuse through Prisma's connection pool
- Direct file uploads to S3
- CloudFront caching for the static frontend
- Efficient API queries
- Small email batches

---

# 73. Pagination

Large tables should never assume all data can be loaded indefinitely in one request.

Likely candidates:

- Guests
- Photos
- Tasks
- Expenses
- Vendors

Example:

```text
GET /api/guests?page=1&limit=50
```

Exact pagination style can be determined during API design.

---

# 74. PostgreSQL Indexing

Indexes will be important for:

```text
weddingId

email

session token hash

guest invitation token

gallery token hash

wedding slug

event date

task due date

RSVP status

email job status
```

Unique indexes also enforce rules such as one account per email and one wedding per slug.

Composite indexes (typically starting with `weddingId`) should be defined according to actual query patterns during database design.

---

# 75. Caching

No dedicated Redis caching layer is required initially.

We should first rely on:

- Efficient PostgreSQL queries
- CloudFront and browser caching for static frontend assets
- Cache-Control headers on API responses where clearly appropriate

Caching should be introduced only when measurable performance needs justify it.

---

# 76. Realtime Updates

V1 will not implement:

- WebSockets
- Server-Sent Events
- Live multi-user collaboration

If one Manager updates a task, another Manager may see the new value when:

- navigating
- refreshing
- triggering normal refetching

This is acceptable for the first version.

---

# 77. Deployment Architecture

Production deployment:

```text
                             ┌───────────────────────┐
                             │        Browser        │
                             │   Members + Guests    │
                             └───────────────────────┘
                                         │
                                         │ HTTPS
                                         ▼
                             ┌───────────────────────┐
                             │      CloudFront       │
                             └───┬───────────────┬───┘
                                 │               │
                        static   │               │ /api/*
                                 ▼               ▼
                          ┌─────────────┐ ┌─────────────┐
                          │  Amazon S3  │ │     ALB     │
                          │  React SPA  │ │HTTPS routing│
                          └─────────────┘ └──────┬──────┘
                                                 │
                                                 │
                                                 ▼
                     ┌───────────────────────────────────────┐
                     │          ECS Fargate service          │
                     │     ┌────────────┐ ┌────────────┐     │
                     │     │ API task 1 │ │ API task N │     │
                     │     └────────────┘ └────────────┘     │
                     │       Express + Prisma (Docker)       │
                     └───────────────────┬───────────────────┘
                                         │
                                         │
         ┌───────────────┬───────────────┼───────────────┬───────────────┐
         ▼               ▼               ▼               ▼               ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │     RDS     │ │MongoDB Atlas│ │  Amazon S3  │ │   Resend    │ │Google Places│
  │ PostgreSQL  │ │  Tech logs  │ │   Photos    │ │    Email    │ │   Vendors   │
  │  App data   │ │             │ │             │ │             │ │             │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 77.1 Frontend Delivery

The React application is built into static files and uploaded to a private S3 bucket. CloudFront is the only public entry point to that bucket. CloudFront also forwards `/api/*` requests to the ALB, so the browser communicates with a single site.

Unknown client-side routes return `index.html` so that deep links such as `/w/akshay-princi-14022027` work.

---

## 77.2 API Deployment

The Express API is packaged as a Docker image and runs as an ECS Fargate service. The ALB terminates HTTPS and distributes traffic across the running tasks, and health checks remove unhealthy tasks from rotation. Tasks run in private networking; the ALB is the only entry point.

RDS PostgreSQL is reachable only from the API tasks. Amazon S3 is accessed from the tasks through the task IAM role. Rolling deployments replace tasks gradually so releases do not cause downtime.

---

## 77.3 CI/CD Pipeline

GitHub Actions builds, tests and deploys the application. Workflows authenticate to AWS through OpenID Connect (OIDC): each workflow assumes a narrowly scoped IAM role for the duration of the job, so no long-lived AWS access keys are stored in GitHub.

```text
Pull Request / Push
        ↓
  GitHub Actions
        ↓
Lint · Type-check · Tests
        ↓
   (main branch only)
        ↓
Assume AWS role via OIDC
        ↓
  ┌─────┴───────────────┐
  ▼                     ▼
Frontend              Backend
  ↓                     ↓
Build React bundle    Build Docker image
  ↓                     ↓
Upload to S3          Push image to registry
  ↓                     ↓
Invalidate            Run Prisma migrations
CloudFront cache      (one-off ECS task)
                        ↓
                      Update ECS service
                      (rolling deployment)
```

Principles:

- Pull requests run tests only and never deploy.
- Deployments run from the main branch.
- Database migrations run with `prisma migrate deploy` before the new API version starts receiving traffic. Migrations should be backward-compatible with the previous API version so a rolling deployment remains safe.
- Separate IAM roles are used per environment and per purpose (frontend deploy, backend deploy).

---

# 78. Environment Separation

At minimum, the application should distinguish:

```text
Local Development

Production
```

A staging environment can be introduced once needed.

Each environment should ideally have isolated credentials, including its own database, S3 bucket and IAM roles.

At minimum, production data must not accidentally be used during local development.

---

# 79. Deployment Simplicity

There is no:

- Kubernetes
- Self-managed servers to patch
- Manual Node cluster
- Microservice deployment

Fargate runs the API containers without any servers to manage, and CloudFront and S3 serve the frontend. Docker is required, but only to package the API for ECS.

---

# 80. Scaling Strategy

The system should follow an incremental scaling strategy.

---

## Stage 1

Initial launch.

```text
React on S3 + CloudFront
Express on ECS Fargate (small number of tasks)
RDS PostgreSQL
MongoDB Atlas (logs)
S3
Resend
Google Places
```

No additional infrastructure.

---

## Stage 2

Increasing usage.

Optimize:

- PostgreSQL indexes
- Query design
- Pagination
- Fargate task count and sizing
- S3 delivery
- Email batching
- API rate limits

---

## Stage 3

Significant scale.

Only then consider:

- Dedicated job queue
- Redis
- Specialized worker service
- RDS read replicas
- More advanced image processing
- CDN changes
- Read-heavy caching
- Search infrastructure

---

# 81. Failure Handling

The system must assume external services can fail.

Examples:

- RDS PostgreSQL temporarily unavailable
- MongoDB Atlas (log store) unavailable
- Resend API error
- Google Places unavailable
- S3 upload failure
- YouTube link invalid

Failures should degrade gracefully where possible.

---

# 82. Resend Failure

If a single transactional email fails:

```text
Request
 ↓
Resend Failure
 ↓
Return Appropriate Error
 ↓
Allow Retry
```

For bulk email:

```text
Email Job
 ↓
Failure
 ↓
Retry
 ↓
Eventually FAILED
```

---

# 83. S3 Upload Failure

If direct upload fails:

- Do not create completed Photo metadata
- Allow guest/user to retry
- Display clear upload failure state

If an object uploads successfully but metadata creation fails, the system may temporarily have an orphaned object.

A future cleanup mechanism (for example an S3 lifecycle rule or a reconciliation job) can remove old orphaned uploads if required.

---

# 84. Google Places Failure

Vendor Discovery should fail independently.

Example:

```text
"Vendor discovery is temporarily unavailable."
```

Existing wedding-management functionality should remain fully usable.

---

# 85. YouTube Failure

An invalid or unavailable livestream must not break the wedding website.

Instead hide the player or show an appropriate fallback.

---

## 85.1 Technical Log Store Failure

If MongoDB Atlas is unavailable, user-facing functionality must be unaffected. Log entries may be dropped or buffered with a bounded size, and the failure itself should be surfaced to operators without ever failing the user's request.

---

# 86. Data Consistency

PostgreSQL transactions (Prisma interactive transactions) should be used where multiple related writes must succeed together.

Examples:

### Create Wedding

```text
Create Wedding
+
Create Initial Admin Membership
```

### Accept Member Invitation

```text
Create Membership
+
Mark Invitation Accepted
```

Not every operation requires a transaction.

---

# 87. Soft Delete vs Hard Delete

This should be decided per domain during database design.

Examples:

Tasks may be hard deleted.

Wedding Members may require stronger historical handling.

Photos may require S3 deletion plus metadata deletion.

Weddings themselves may eventually require soft deletion to protect against accidental complete data loss.

The V1 database design should explicitly decide this for major entities.

---

# 88. External Dependencies

The system relies on:

### Amazon RDS PostgreSQL

Primary application data.

### MongoDB Atlas

Technical logs.

### Amazon S3

Wedding media and static frontend files.

### CloudFront

Frontend delivery.

### ECS Fargate and ALB

API hosting and HTTPS routing.

### Resend

Email.

### Google Places

Vendor discovery.

### YouTube

Livestream embedding.

### GitHub Actions and AWS OIDC

Build, test and deployment automation.

The application should minimize unnecessary coupling to these providers by using internal abstractions where valuable.

---

# 89. Internal Integration Abstractions

Recommended internal service boundaries:

```text
EmailService
   ↓
Resend

StorageService
   ↓
Amazon S3

VendorDiscoveryService
   ↓
Google Places

LoggingService
   ↓
MongoDB Atlas
```

This avoids leaking third-party SDKs throughout business logic.

---

# 90. Testing Considerations

Detailed testing strategy belongs in another document, but architecture should support:

### Unit Tests

Business services and utility logic.

### Integration Tests

API + PostgreSQL behaviour.

### Authorization Tests

Cross-wedding isolation.

### Guest Token Tests

Invitation/gallery security.

### End-to-End Tests

Critical journeys such as:

```text
Signup
→ Create Wedding
→ Add Event
→ Add Guest
→ Send Invite
→ RSVP
```

All automated tests run in the GitHub Actions pipeline before any deployment.

---

# 91. Critical Security Tests

Testing must explicitly cover:

```text
Wedding A user cannot fetch Wedding B event.

Wedding A Manager cannot modify Wedding B task.

Manager cannot manage Wedding Members.

Guest token cannot expose another guest.

Guest cannot exceed allowed attendee count.

Invalid gallery token cannot upload.

Expired reset token cannot reset password.
```

---

# 92. Important Architectural Decisions

## ADR-01: Modular Monolith

**Decision:** Build one backend application rather than microservices.

**Reason:** Product complexity does not justify distributed infrastructure.

---

## ADR-02: React Frontend and Express API

**Decision:** Build the frontend as a React + TypeScript application and the backend as a separate Node.js + Express + TypeScript API, connected through explicit REST endpoints.

**Reason:** Clear boundary between UI and business logic, and the static frontend and the API can be deployed and scaled independently.

---

## ADR-03: PostgreSQL on Amazon RDS with Prisma

**Decision:** Use Amazon RDS PostgreSQL as the main database, accessed through Prisma.

**Reason:** Wedding data is relational (weddings, members, events, guests, expenses), benefits from foreign keys and constraints for tenant integrity, and RDS provides managed production infrastructure.

---

## ADR-04: Custom Authentication

**Decision:** Build email/password auth internally.

**Reason:** Maintain control and educational clarity without introducing Better Auth, Clerk or Auth0.

**Constraint:** Use established password hashing and secure session practices rather than custom cryptography.

---

## ADR-05: No Email Verification

**Decision:** Users can immediately create/join weddings after signup.

**Reason:** Reduce friction and MVP complexity.

---

## ADR-06: Wedding-Level Multi-Tenancy

**Decision:** Wedding acts as tenant boundary.

**Reason:** Almost all private product information logically belongs to a Wedding.

---

## ADR-07: Amazon S3 for Media

**Decision:** Store actual media files in Amazon S3.

**Reason:** Avoid storing large binary media in the database and support direct presigned uploads.

---

## ADR-08: Guest Token Access

**Decision:** Guests do not authenticate.

**Reason:** Keep RSVP and photo sharing frictionless.

---

## ADR-09: Resend

**Decision:** Use Resend as email provider.

**Reason:** Simple transactional email integration suitable for V1.

---

## ADR-10: PostgreSQL-Backed Email Jobs

**Decision:** Use a PostgreSQL job table, an in-process worker and small batches.

**Reason:** Avoid Redis and dedicated job infrastructure for the initial scale, while atomic row claiming keeps multiple API tasks safe.

---

## ADR-11: Google Places Vendor Discovery

**Decision:** Do not build a proprietary vendor marketplace.

**Reason:** Google Places provides sufficient vendor discovery for V1.

---

## ADR-12: AWS Hosting (S3 + CloudFront and ECS Fargate + ALB)

**Decision:** Host the static frontend on S3 behind CloudFront and run the API containers on ECS Fargate behind an ALB.

**Reason:** Managed, scalable hosting without servers to maintain, with the whole platform in one cloud account.

---

## ADR-13: MongoDB Atlas for Technical Logs Only

**Decision:** Keep errors, diagnostics and request logs in MongoDB Atlas, separate from business data.

**Reason:** Log data is high-volume, schema-flexible and disposable, so it should not compete with transactional data in PostgreSQL.

---

## ADR-14: GitHub Actions with AWS OIDC

**Decision:** Automate tests and deployments with GitHub Actions authenticating to AWS through OIDC.

**Reason:** Repeatable releases without storing long-lived AWS credentials.

---

# 93. Architecture Explicitly Excluded from V1

We will not use:

- Microservices
- NestJS
- GraphQL
- Kafka
- RabbitMQ
- Redis initially
- BullMQ initially
- WebSockets
- Server-Sent Events
- Kubernetes
- Elasticsearch
- Better Auth
- Clerk
- Auth0
- Email verification
- Photo moderation
- Dedicated image-processing service
- External observability platform
- Product analytics platform

---

# 94. Final System Summary

Make My Marriage V1 will operate as a **TypeScript system made of a React frontend and a modular-monolith Node.js + Express API**, communicating through explicit REST APIs.

The React application is hosted on S3 and delivered through CloudFront. The Express API runs as containers on ECS Fargate behind an ALB.

Authenticated bride, groom and family members will interact through server-side sessions and secure cookies. Every Wedding represents an isolated application tenant.

Guests will interact without accounts through unpredictable invitation and gallery tokens.

Amazon RDS PostgreSQL will persist all business data through Prisma, while Amazon S3 will store wedding photos through direct presigned uploads. MongoDB Atlas will hold technical logs only.

Resend will deliver transactional email. Larger invitation/reminder campaigns will use a lightweight PostgreSQL-backed email-job mechanism processed in small batches by an in-process worker.

Google Places will provide local vendor discovery, while selected vendors are stored as normal internal Vendor records.

Wedding websites will be rendered by the React application using stable slugs and predefined themes.

YouTube will provide livestream infrastructure, with Make My Marriage only embedding the configured stream.

GitHub Actions with AWS OIDC will test and deploy both the frontend and the API, without queues, cache clusters or microservices.

The system is deliberately optimized for:

> **Simple architecture, strong domain boundaries, secure wedding isolation, low operational overhead and enough scalability to support a real publicly available wedding-management product.**

---

# 95. Next Design Documents

With this system architecture frozen, the recommended design sequence is:

1. **Database Design**
   - Tables
   - Relationships
   - Prisma schema
   - Indexes
   - Constraints
   - Tokens
   - Sessions
   - Email jobs
   - Technical log collections in MongoDB Atlas

2. **API Design**
   - REST endpoints
   - Request/response structures
   - Authentication rules
   - Authorization rules
   - Error responses

3. **Application / Module Design**
   - Codebase organization
   - Module boundaries
   - Services
   - Repositories
   - Validation
   - Shared utilities

4. **Frontend Architecture**
   - Routes
   - Layouts
   - Data fetching
   - State management
   - Forms
   - Static hosting and routing behaviour

5. **Security Design**
   - Authentication implementation
   - Sessions
   - CSRF considerations
   - Tokens
   - Rate limiting
   - File-upload security

6. **Deployment Design**
   - Environments
   - Environment variables
   - RDS PostgreSQL
   - MongoDB Atlas
   - Amazon S3
   - S3 + CloudFront
   - ECS Fargate + ALB
   - Resend
   - GitHub Actions + AWS OIDC release workflow

---

# 96. Organiser Gallery Storage Implementation

Implemented 2026-09-18.

`src/modules/photos` owns schemas, the Photo model, wedding-scoped persistence, and gallery use cases. `src/server/storage/s3.ts` owns S3 signing and object operations. The AWS S3 client and request presigner are used directly against Amazon S3; no external queue or service is introduced.

The private adapter reads only server-side configuration (the S3 bucket name and AWS region). In deployed environments it authenticates through the ECS task IAM role, so no static access keys exist; locally it uses a developer credential profile scoped to the development bucket. The bucket blocks all public access. Bucket CORS needs only `Content-Type` for browser PUTs (`Content-Length` is set by the browser), plus GET/PUT/HEAD methods and the allowed app origins. Never expose credentials or make the bucket public. Development and production use separate buckets with separately scoped IAM permissions; any additional environment (for example staging) requires its own bucket and role.

The browser uploads directly to a staging key. The server verifies length, MIME, and a 16-byte format signature, pinning inspection and copying to the same ETag. S3 copies into an independent final key, then PostgreSQL atomically publishes the row. Neither the upload body nor downloaded originals pass through an app API. See the API and database lifecycle clarifications for retry and deletion rules.

The initial browser uses lazy-loaded originals with cursor pagination, and un-cropped originals in the viewer. Thumbnail derivatives and image optimisation remain deferred: browsing can download up to 10 MiB per image. Signed private photos are deliberately served through short-lived presigned URLs and are not cached publicly by CloudFront. The general recommendation above to optimise gallery images remains follow-up work, not a claim about this first implementation. Cleanup/reconciliation of abandoned objects also remains follow-up work.

Selected files and partial results remain in memory across session expiry in the same tab; confirmation can retry after signing in again. An identity/wedding change discards that draft. Refreshing/closing the tab cannot restore File objects; the existing unsaved-changes guard warns before navigation. No persistent file cache is stored in localStorage.

Verification: `npm test` uses mocked persistence/storage and component tests. `RUN_S3_SMOKE=1 npm test -- src/server/storage/s3.integration.test.ts` explicitly loads `.env.local`, refuses any bucket other than make-my-marriage-dev, and uploads/reads/deletes only a unique test-fixtures prefix. It never uses the database.
