# Make My Marriage — Project Status

This file tracks delivered project milestones. The approved PRD, System Design, Database Design, and REST API Design remain the source of truth for product and architecture requirements.

## Current snapshot

- **Workspace Settings & Configuration Console (V1 — Stitch Design Reference):** Complete end-to-end (2026-11-22). Full-featured workspace governance console based on the Google Stitch prototype (`/settings`). Top sticky header with breadcrumb navigation (`Workspace & Configuration • Settings Console`), live countdown chip (`• 120 Days to Go`), ceremony date & venue chips, user identity pill (`Akshitha Rao Host & Admin`), and dirty-state-guarded `Discard` and `Save Changes` actions. Left vertical sub-navigation with 7 sections: (01) General Profile with 1200x400 Master Celebration Cover banner, pre-signed AWS S3 cover image uploads with 15MB size limits, curated heritage palace presets, bride/groom identity form, date, timezone (`Asia/Kolkata`), venue, and story description; (02) Workspace Members roster with Admin/Manager role switches, co-host invitations with Resend email dispatch; (03) Roles & Permissions architecture breakdown with a granular capability matrix; (04) Privacy & Access governance covering website publishing, gallery QR token access, and guest count privacy; (05) Notifications & Alerts preferences; (06) Workspace Data & Export with client-side CSV downloads for guests, financial expenses, and vendor directories; and (07) Danger Zone with atomic workspace deletion guarded by typing the exact celebration title. Verified with 19 backend and 5 frontend unit tests passing, zero TypeScript errors across monorepo.
- **Photo & Video Gallery Module (Production AWS S3 Cloud Architecture Redevelopment):** Complete end-to-end (2026-11-20). Production-ready cloud storage architecture where PostgreSQL stores only metadata and references to S3 objects, and AWS S3 (`make-my-marriage-gallery-dev-rana-2026`) stores all binary photos and videos. Complete removal of mock storage, `.storage/` disk directories, and server-side file proxies. Direct browser-to-S3 uploads using AWS SDK v3 pre-signed PUT URLs with client-side progress reporting. Mandatory independent backend verification via `s3Service.headObject()` (`HeadObjectCommand`) before marking media records as `UPLOADED`, preventing false-positive uploads. Solved AWS SDK v3 automatic CRC32 empty-payload checksum injection (`x-amz-checksum-crc32=AAAAAA==`) via `requestChecksumCalculation: 'WHEN_REQUIRED'`. Dynamic pre-signed GET URLs with short expiry for private media streaming and attachment download headers. Resilient non-blocking media deletion with automatic album cover reassignment. Resolved React 19 empty `src=""` rendering warnings with image fallback placeholders. Verified with 0 TypeScript errors across monorepo and 93/93 frontend tests passing.
- **Photo & Video Gallery Module (V1 — Stitch Design Reference & AWS S3 Integration):** Complete end-to-end (2026-11-17). Comprehensive wedding media management module based on the Google Stitch prototype and system architecture. PostgreSQL tables `gallery_albums` and `gallery_media` backed by Prisma migration `20261117140000_add_gallery_management` with relations to `Wedding`, `Event`, and `User`. Direct browser-to-S3 uploads via AWS SDK v3 presigned PUT URLs, presigned GET URLs for secure streaming and downloads with attachment headers, tenant isolation (`weddings/{weddingId}/gallery/...`), and offline/dev mock storage fallback. Complete backend REST API under `/api/v1/gallery` (12 endpoints: summary, albums CRUD, media listing/filtering, upload URL request, upload confirmation, download URL, delete) with 14 passing backend tests. Frontend suite at `/gallery` inside `AuthenticatedLayout` with Dashboard metrics (Total Photos, Total Videos, Event Albums, Storage Used with visual progress bar), Event Albums carousel/grid with preset chips and custom album creation/editing, multi-file drag-and-drop direct S3 upload dialog with individual & overall progress bars, responsive Media Grid with Photo/Video tabs, search and Grid/List view switchers, and full-screen luxury Media Lightbox viewer supporting photos and HTML5 video playback with Esc/Arrow keyboard navigation. Verified with 14 backend and 7 frontend tests passing (93 web tests total passing), 0 TypeScript errors across monorepo, and clean Parcel production build in 8.64s.
- **Wedding Website Builder Module (V1 — Stitch Design Reference & UX Hardening):** Complete end-to-end (2026-11-17). Comprehensive editorial wedding website builder and guest-facing celebration portal inspired by Google Stitch prototype. Database-backed with `website_settings` table and structured `content` JSONB. Backend REST API under `/api/v1/website` and public rate-limited endpoints under `/api/v1/public/weddings/:slug` supporting custom slug validation, template switching, draft saving, live publishing/unpublishing, guest RSVP lookup by name/email/token, and real-time attendance syncing directly into `Guest` and `GuestEvent` PostgreSQL records. Full frontend at `/website` and `/wedding/website` with persistent layout, overview KPI cards (Invited, Attending, Declined, Pending, Response Rate), 4 curated architectural templates (`Royal Heritage`, `Modern Minimal`, `Floral Romance`, `Bohemian Sunset`), 3-panel visual editor with collapsible Page Sections panel (shrinks to slim vertical rail for maximal canvas space), dedicated section form controls & Theme Styler, and interactive live studio canvas with Desktop (1020px with browser URL bar), Tablet (768px frame), and Mobile (375px frame) device framing. Includes Domain & Privacy settings modal, Publish confirmation dialog with shareable links and QR code generation, resilient production URL generator (`https://make-my-marriage.shop/w/{slug}` with isolated copy action), persistent sidebar collapse tooltips with pointer arrows and elevated z-index, and standalone public routes at `/w/:slug` and `/website/:slug` with full mobile-first guest RSVP interaction. Verified with 135 backend tests and 86 frontend tests passing, 0 TypeScript errors across all workspaces, and zero regressions.
- **Vendor Management Module (V1 — Stitch Design Reference):** Complete end-to-end (2026-11-14). Comprehensive vendor production suite based on Google Stitch design reference (`Curated Wedding Partners & Production`). Full PostgreSQL schema with tables `vendors`, `vendor_services`, `vendor_events`, `vendor_bookings`, `vendor_payments`, and `vendor_documents` via Prisma migration `20261114120000_add_vendor_management_suite`. REST API under `/api/v1/vendors` with tenant isolation, CSRF protection, integer-paise math, and bidirectional expense synchronization (creating/updating bookings and payments updates the wedding expense ledger atomically). Complete frontend at `/vendors` with persistent sidebar, sub-nav VIEW STATE tabs, live sync badge, 8 KPI cards, Booking Pipeline Funnel (5 stages), Budget Allocation by Tier (segmented progress bar & top categories), Upcoming Vendor Milestones, Activity & Audit Trail, Vendor Directory with Grid/Table views, 18 Curated Categories, Vendor Profile Deep Dive (4 sub-tabs), Payments & Ledger, Side-by-Side Comparison matrix, and Production Schedule Timeline with conflict detection. Verified with 13 backend and 4 frontend vendor tests passing, 0 TypeScript errors, and 0 ESLint errors.
- **Expenses, Budget & Vendor Management Module (V1):** Complete end-to-end (2026-11-12). PostgreSQL tables (`wedding_budgets`, `event_budgets`, `expenses`) with `NUMERIC(12,2)` monetary columns and SQL `CHECK` constraints via Prisma migration `20261112215000_add_expenses_budgets_vendors`. Modular backend REST API under `/api/v1/expenses` and `/api/v1/vendors` featuring integer-paise arithmetic to avoid floating-point drift, tenant-isolated CRUD, cross-wedding association checks, installment payment tracking (`PENDING`, `PARTIAL`, `PAID`, `OVERDUE`, `CANCELLED`), overall wedding & ceremony-specific budgets, over-budget detection, pagination, filtering, and analytics (category, event, payment status/method, vendor, and monthly breakdowns). Full frontend suite at `/expenses` inside `AuthenticatedLayout` with KPI cards, utilization progress bar, filterable ledger, Add/Edit/Detail/Budget modals, inline Quick Add Vendor, CSV report export, pure SVG/CSS analytics visualizations, and live integration across the Workspace Dashboard (`SummaryCard`, `QuickActions`, checklist) and `EventDetailPage` Expenses tab.
- **Guest List & RSVP Management Module (V1):** Complete end-to-end (PRD §9.3, REST API §5.6). Full attendee lifecycle tracking with `RsvpStatus` (`PENDING`, `ATTENDING`, `NOT_ATTENDING`), per-guest party capacity constraints (`maxGuests`), multi-event ceremony invitations, Resend email dispatch, batch reminder capabilities, and public mobile-first RSVP submission. REST API under `/api/v1/guests` and `/api/v1/public/invitations/:token` with tenant isolation, rate limiting, and CSRF protection. Interactive organizer frontend at `/guests` with KPI metrics ribbon (Total, Attending, Pending, Declined, Invitations Sent), search & multi-event filters, Add/Edit modal, Guest Detail modal, one-click WhatsApp sharing, and invitation link generation. Public invitation experience at `/invite/:token` with traditional Indian auspicious invocation, wedding itinerary timeline, and interactive attendance form. Monorepo verified with passing tests (72 web, 17 api guest tests), zero TypeScript errors, and clean Parcel & API production builds.
- **Task Management Module (V1):** Complete end-to-end (PRD §9.2, REST API §5.5). Full task lifecycle tracking with `TaskStatus` (`TO_DO`, `IN_PROGRESS`, `COMPLETED`) and `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`). REST API with tenant isolation, assigned member & event cross-wedding validation, paginated filtering, text search, and metrics breakdown. Interactive frontend suite (`/tasks`) matching the approved warm aesthetic (`#FAF8F5`, `#8A4B35`, `#556251`, `Playfair Display`), tabs (All Tasks, My Tasks, Completed), interactive creation/editing modals with dynamic team member and event selectors, task detail viewer, and dashboard quick actions integration. Monorepo verified with 149 passing tests (67 web, 82 api), zero TypeScript errors, and clean production builds.
- **Lighthouse Performance Audit (V1):** Audit complete; bottlenecks identified; optimization pending user approval. Primary findings: 937 KB hero-image global preload on every page, monolithic 710 KB JS bundle with zero route-level code splitting, and render-blocking Google Fonts stylesheet. Implementation plan prepared; no code changes applied yet.
- **Secret hygiene fix:** Real credentials (Resend API key, DB password, session/CSRF secrets) removed from `.env.example` and replaced with safe placeholder values before push; commit amended to keep secrets out of GitHub history. Keys should be rotated by the operator.
- **Global Persistent Application Layout & Viewport Responsiveness:** Complete end-to-end. Unified `AuthenticatedLayout` with static 270px left sidebar (`DashboardSidebar`) and persistent top header (`DashboardHeader`) spanning all authenticated routes (`/dashboard`, `/events`, `/events/:eventId`, `/settings/members`, `/members`, `/tasks`, `/guests`, `/expenses`, `/vendors`, `/website`, `/gallery`, `/settings`). Sidebar never unmounts, reloads, or flickers during navigation. Elimination of duplicate vertical scrollbars, window clipping, and horizontal overflow. Sleeker, well-proportioned hero card and quick actions with fully responsive grid alignment.
- **Wedding Events Management (V1):** Complete end-to-end (PRD §9.5, REST API §5.4). Multi-event scheduling with preset chips (Roka, Engagement, Mehendi, Haldi, Sangeet, Cocktail, Wedding, Reception) and custom names, date/time validation, venue and dress code tracking, status lifecycle (`PLANNED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), overview page with informational metrics, event details page with tabbed associations, and workspace dashboard timeline integration.
- **Security Hardening & QA Audit Fixes (V1):** Complete end-to-end. Open redirect mitigation (CWE-601) across authentication forms, environment-gated invitation acceptance verification, clean Parcel bundle module resolution, and expanded frontend/backend test suites (133 tests passing).
- **Wedding Member Management & Team Invitations:** Complete end-to-end (PRD §9.4, REST API §5.3). Role-based access control (`ADMIN`, `MANAGER`), secure team invitations with cryptographically hashed tokens and Resend email delivery, atomic race-condition-protected invitation acceptance, member role upgrades/downgrades with last-admin guard, and member offboarding.
- **Wedding Onboarding & Workspace Dashboard:** Complete end-to-end. Authenticated users without a wedding can complete the Stitch-inspired onboarding form, persist their workspace in PostgreSQL, become its Admin in a transaction, and land on their real dashboard. Users with an existing wedding return to that workspace. Dashboard renders actual database details and honest empty states without fabricated data.
- **Brand System & Dynamic Context:** Approved M-and-heart vector mark and dynamic uppercase page subtitles integrated across all public, auth, onboarding, and workspace routes.
- **Resilient Frontend Architecture:** React ErrorBoundary, 404 route handling, and optimized asset delivery via HTML preload and CSS styling (resolving Parcel asset bundling).
- **Favicon & PWA Assets:** Complete. SVG, ICO, PNG 16/32/48/180/192/512 favicons and `site.webmanifest` generated and wired into `index.html` with `theme-color` meta.
- **Authentication flow:** Complete with server-side sessions, Argon2 hashing, CSRF protection, and Resend password reset integration.
- **Repository foundation & database:** Complete with PostgreSQL and Prisma 7 ORM migrations.

## Milestones

### 2026-11-22 — Workspace Settings & Configuration Console (V1 — Stitch Design Reference) — Complete

- **Stitch-Inspired Settings Console Architecture:**
  - Implemented the complete `/settings` workspace settings console matching the approved Google Stitch design reference (`13090291010869205174?node-id=2dc3a74b55e0479795f56e8feee2aeb7`).
  - Warm terracotta (`#7B341E`), amber gold (`#9A6218`), and cream (`#FAF8F5`) aesthetic with responsive sidebar navigation and persistent header.
- **Section 01 — General Information & Master Cover:**
  - Master Celebration Cover banner with 1200x400 framing, dark gradient overlay, and bottom-left typography.
  - S3 pre-signed PUT upload flow (`/wedding/cover/upload-url`) supporting JPG, PNG, and WebP up to 15MB, alongside curated royal palace presets (Bangalore Palace, The Oberoi Udaivilas, Rambagh Palace, Taj Falaknuma).
  - Couple identity fields, ceremony date, venue, timezone (`Asia/Kolkata`), and celebration description with dirty tracking.
- **Section 02 — Workspace Members & Team Roster:**
  - Member cards displaying roles, avatar monograms, email addresses, and joined dates.
  - Role management (Administrator vs Manager) protected by single-admin guard logic.
  - Team invitation modal with atomic cryptographic token generation and Resend email dispatch.
- **Section 03 — Roles & Permissions Matrix:**
  - Comprehensive capability breakdown matrix comparing Administrator full access with Manager operational scope across all 10 wedding modules.
- **Section 04 — Privacy & Access Controls:**
  - Public website publishing toggle, guest attendee count visibility, and gallery QR token generator.
- **Section 05 — Notifications & Alerts:**
  - Preferences for daily digests, real-time RSVP notifications, task due alerts, and payment reminders.
- **Section 06 — Workspace Data & Export Center:**
  - Client-side CSV data export generators for guest attendee records, expense ledgers, and vendor directories.
- **Section 07 — Danger Zone & Deletion Guard:**
  - Workspace termination modal guarded by typing the exact celebration title, executing atomic cascade cleanup across PostgreSQL.
- **Verification:**
  - Verified with 19 backend tests (`apps/api/tests/wedding.test.ts`) and 5 frontend tests (`apps/web/tests/settings.test.tsx`) passing.
  - Monorepo typecheck passed cleanly with zero TypeScript errors across all workspaces.

### 2026-11-20 — Photo & Video Gallery Module (Production AWS S3 Cloud Architecture Redevelopment) — Complete

- **Production Cloud Architecture & Mock Storage Removal:**
  - Strictly redeveloped using cloud-native direct-to-S3 storage: PostgreSQL stores only metadata and S3 object keys; AWS S3 (`make-my-marriage-gallery-dev-rana-2026`) stores all binary media.
  - Totally eliminated local mock-storage route handlers (`/api/v1/gallery/mock-storage`), local file streams, and disk persistence directories (`apps/api/.storage/`).
  - The Node.js Express server does not serve or accept media binaries, keeping memory and bandwidth consumption minimal.
- **Direct S3 Upload & Pre-signed Put URLs:**
  - Client-side uploads bypass the Node.js backend entirely, streaming directly from the browser to AWS S3 using pre-signed PUT URLs with real-time `XMLHttpRequest` progress reporting (0% to 100%).
  - Resolved AWS SDK v3 flexible checksum parameter (`x-amz-checksum-crc32: AAAAAA==`) by configuring `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'` on `S3Client`.
  - Object keys strictly formatted as `weddings/{weddingId}/gallery/{albumId}/{mediaId}/{sanitizedFileName}` ensuring tenant isolation and collision prevention.
- **Mandatory Independent Backend Verification:**
  - `POST /api/v1/gallery/media/confirm` executes `s3Service.headObject(media.s3ObjectKey)` (`HeadObjectCommand`) to confirm the object physically exists in the AWS S3 bucket before marking `uploadStatus: 'UPLOADED'`.
  - If S3 verification fails (404 / NotFound), the database record is updated to `uploadStatus: 'FAILED'` and rejected with `400 UPLOAD_VERIFICATION_FAILED`. False-positive confirmations are prevented.
- **Dynamic Secure Media Viewing & Downloads:**
  - The S3 bucket remains private with Block Public Access enabled.
  - Ephemeral pre-signed GET URLs (300-second expiry) are generated dynamically on query, preventing stale or expired links upon page reload.
  - Downloads use `ResponseContentDisposition: attachment; filename="..."` for clean user downloads.
- **Resilient Media Deletion & Album Cover Fallback:**
  - S3 deletion via `DeleteObjectCommand` is wrapped in safe exception handling so that missing S3 objects do not prevent database cleanup.
  - Album covers are automatically reset or reassigned upon deletion of their cover image.
- **Frontend Hardening & DX Improvements:**
  - Guarded `<img src="">` and `<video src="">` in `MediaGrid.tsx` and `MediaLightboxModal.tsx` against empty strings, eliminating React DOM hydration/download warnings.
  - Fixed Parcel `PublicInvitationPage.tsx` hero image import with `url:` prefix.
  - Updated `apps/api/package.json` nodemon command to watch `.env` for automatic process reload upon credential updates.
  - Added safe, masked diagnostic logging in `apps/api/src/modules/gallery/s3.ts`.
- **Verification & Test Coverage:**
  - `npm run typecheck` &rarr; 0 errors across `@mmm/api` and `@mmm/web`.
  - `npm --workspace @mmm/web test` &rarr; 13/13 test suites passed, 93/93 tests passing.
  - S3 pre-signed PUT and GET URL generation verified live against AWS S3 bucket `make-my-marriage-gallery-dev-rana-2026`.

### 2026-11-17 — Photo & Video Gallery Module (V1 — Stitch Design Reference & AWS S3 Integration) — Complete

- **Database Architecture & Data Persistence:**
  - Backed by PostgreSQL `gallery_albums` and `gallery_media` tables via Prisma migration `20261117140000_add_gallery_management`.
  - Added enums `MediaType` (`IMAGE`, `VIDEO`) and `MediaUploadStatus` (`PENDING`, `UPLOADED`, `FAILED`, `DELETED`).
  - Added foreign key relations to `Wedding`, `Event`, and `User`.
  - Enforced unique album names per wedding (`[weddingId, name]`) and unique S3 object keys.
  - Comprehensive index coverage on `[weddingId, uploadStatus, createdAt]`, `[weddingId, albumId]`, `[weddingId, eventId]`, and `[weddingId, mediaType]`.
- **AWS S3 Direct Upload Architecture:**
  - Client-side uploads bypass server memory bottlenecks by uploading directly from browser to AWS S3 using pre-signed PUT URLs generated via `@aws-sdk/s3-request-presigner` and `@aws-sdk/client-s3`.
  - Object keys strictly structured under `weddings/${weddingId}/gallery/${mediaType.toLowerCase()}s/${mediaId}/${sanitizedFileName}` ensuring tenant isolation.
  - Pre-signed GET URLs for secure, authenticated media streaming and downloads with `Content-Disposition: attachment`.
  - Offline / local development emulation fallback (`/api/v1/gallery/mock-storage/:s3Key`) ensuring local tests and development run smoothly without requiring live AWS credentials.
  - Environment variables: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_S3_PUBLIC_BASE_URL`, `AWS_S3_PRESIGNED_EXPIRES_SECONDS`, `AWS_S3_UPLOAD_MAX_SIZE_BYTES`.
- **Backend REST API (`/api/v1/gallery`):**
  - Modular domain architecture in `apps/api/src/modules/gallery/`: `s3.ts`, `schemas.ts`, `service.ts`, `routes.ts`.
  - Endpoints:
    - `GET /api/v1/gallery/summary`: Returns total photos, total videos, total albums, storage bytes used, formatted storage string, and recent media items.
    - `GET /api/v1/gallery/albums`: Returns all albums with live media count and event links.
    - `POST /api/v1/gallery/albums`: Creates an album with wedding tenant validation and duplicate name prevention.
    - `GET /api/v1/gallery/albums/:albumId`: Returns single album details.
    - `PATCH /api/v1/gallery/albums/:albumId`: Updates album details.
    - `DELETE /api/v1/gallery/albums/:albumId`: Safely deletes album while preserving media items.
    - `GET /api/v1/gallery/media`: Paginated media listing with album, event, type, and search filters.
    - `POST /api/v1/gallery/media/upload-url`: Validates MIME types (JPEG, PNG, WebP, MP4, MOV, WebM) and file size (<= 100MB), creates `PENDING` staging record, and returns signed S3 PUT URL.
    - `POST /api/v1/gallery/media/confirm`: Marks upload as `UPLOADED`, records dimensions and duration, auto-assigns cover photo if album has none.
    - `GET /api/v1/gallery/media/:mediaId/download`: Issues presigned download URL.
    - `PATCH /api/v1/gallery/media/:mediaId`: Updates caption, album, or event associations.
    - `DELETE /api/v1/gallery/media/:mediaId`: Deletes object from S3 and marks deleted in database.
  - 14 backend unit/integration tests in `apps/api/tests/gallery.test.ts` passing (14/14).
- **Frontend UI & Stitch Design Reference (`/gallery` & `/wedding/gallery`):**
  - Implemented in `apps/web/src/features/gallery/`:
    - `GalleryPage.tsx`: Main page orchestrator with sticky header, action buttons, summary cards, album grid, and media viewer.
    - `GalleryStats.tsx`: 4 luxury metric cards with visual storage progress bar and custom SVG icon vector accents.
    - `AlbumCard.tsx` & `AlbumModal.tsx`: Event-based album cards with cover photos or elegant editorial fallbacks, item count badges, event chips, and creation/editing modals with preset chips (Engagement, Haldi, Mehendi, Sangeet, Cocktail, Wedding Ceremony, Reception).
    - `MediaUploadModal.tsx`: Multi-file drag-and-drop zone, file type/size validation, local preview thumbnails, individual and overall progress bars, album/event selection, and concurrent direct S3 upload engine via `uploadFileDirectToS3`.
    - `MediaGrid.tsx`: Filterable media grid with All/Photos/Videos tabs, text search, Grid vs List view switcher, and hover action pills.
    - `MediaLightboxModal.tsx`: Full-screen luxury viewer with image zoom/fit, custom HTML5 video player, thumbnail filmstrip, download trigger, delete action, and Esc/Arrow keyboard navigation.
  - Integrated into persistent sidebar navigation in `DashboardSidebar.tsx` as a live first-class feature.
  - All Parcel asset conventions respected (`url:` prefix used for static images; no static images imported as plain JS modules).
  - 7 frontend unit/integration tests in `apps/web/tests/gallery.test.tsx` passing (7/7; 93 web tests total passing).
- **Verification & Build Health:**
  - `npm --workspace @mmm/api run typecheck` &rarr; 0 errors.
  - `npm --workspace @mmm/web run typecheck` &rarr; 0 errors.
  - `npm --workspace @mmm/api test -- gallery.test.ts` &rarr; 14 tests passing.
  - `npm --workspace @mmm/web test` &rarr; 13 test suites, 93 tests passing.
  - `npm --workspace @mmm/web run build` &rarr; Built cleanly in 8.64s (`dist/wedding-hero.2233e765.jpg` bundled cleanly, zero resolution errors).


### 2026-11-17 — Wedding Website Builder Module (V1 — Stitch Design Reference) — Complete

- **Database Architecture & Data Persistence:**
  - Backed by PostgreSQL `website_settings` table (`id`, `wedding_id`, `slug`, `theme`, `is_published`, `content` JSONB, `published_at`, `created_at`, `updated_at`).
  - Zero brittle schema migrations needed; structured `content` JSONB stores rich sections, color palettes, custom typography, and SEO metadata with strict Zod validation.
- **Backend REST API (`/api/v1/website` & `/api/v1/public/weddings`):**
  - Modular domain architecture in `apps/api/src/modules/website/`: `schemas.ts`, `service.ts`, `routes.ts`.
  - 8 core endpoints:
    - `GET /api/v1/website`: Returns full configuration, live sections, active theme, settings, and calculated RSVP metrics.
    - `GET /api/v1/website/templates`: Returns curated architectural templates with styles.
    - `PATCH /api/v1/website`: Updates custom slug, sections content, theme parameters, with CSRF and same-origin protection.
    - `POST /api/v1/website/publish` & `/unpublish`: Toggles public accessibility and sets `published_at` timestamp.
    - `POST /api/v1/website/template`: Applies an architectural template preset atomically without overwriting couple names or ceremony schedules.
    - `GET /api/v1/public/weddings/:slug`: Public guest endpoint returning sanitized, published celebration data and ceremony timelines. Rate limited to 120 req/min.
    - `POST /api/v1/public/weddings/:slug/rsvp/lookup`: Guest attendance lookup by name, email, or invitation token. Rate limited to 30 req/min.
    - `POST /api/v1/public/weddings/:slug/rsvp`: Public guest RSVP submission that automatically syncs into PostgreSQL `Guest` and `GuestEvent` tables. Rate limited to 20 req/15min.
  - 11 backend unit/integration tests in `apps/api/tests/website.test.ts` passing (11/11).
- **Frontend UI & Stitch Design Reference (`/website` & `/w/:slug`):**
  - Implemented in `apps/web/src/features/website/`:
    - `WeddingWebsitePage.tsx`: Main page orchestrator with sub-navigation tabs (`Dashboard`, `Visual Editor`, `Templates Gallery`), live status badge, and sticky header.
    - `WebsiteDashboardView.tsx`: Overview KPI ribbon (Total Guest List, Attending, Declined, Pending, Response Rate), shareable URL bar with 1-click copy, Quick Actions, and 11-section page status breakdown.
    - `TemplateGalleryView.tsx`: 4 architectural style cards (`Royal Heritage`, `Modern Minimal`, `Floral Romance`, `Bohemian Sunset`) with detail modals and "Apply Design" workflow.
    - `WebsiteEditorView.tsx`: Three-panel layout:
      - Left: 11 reorderable sections with drag/move controls and eye visibility toggles.
      - Center: Dedicated section controls (`Hero`, `Couple`, `Story`, `Events`, `Venue`, `Gallery`, `Family`, `Travel`, `RSVP`, `Contact`, `Footer`) and `ThemeStylerPanel` (5 palette presets, custom hex pickers, typography pairings, button shapes, card styles, background linen patterns).
      - Right: Live reactive preview canvas with Desktop (100%), Tablet (768px), and Mobile (375px) device frames.
    - `WebsiteSettingsModal.tsx`: Custom slug management (`/w/[slug]`), password protection, SEO tags, and display overrides.
    - `PublishSuccessModal.tsx`: Published celebration modal with shareable link, SVG QR code generator, and WhatsApp broadcast button.
    - `PublicWeddingWebsitePage.tsx`: Standalone guest celebration portal at `/w/:slug` and `/website/:slug` with password gate (when enabled) and full interactive RSVP modal.
  - 5 frontend integration tests in `apps/web/tests/website.test.tsx` passing (5/5).
- **Verification Outcomes:**
  - `npm --workspace @mmm/api run typecheck`: Passed (0 errors).
  - `npm --workspace @mmm/web run typecheck`: Passed (0 errors).
  - `npm --workspace @mmm/api test -- tests/website.test.ts`: Passed (11/11 tests).
  - `npm --workspace @mmm/web test -- tests/website.test.tsx`: Passed (5/5 tests).
  - Full backend test suite (`npm --workspace @mmm/api test`): 135 passed, 0 failed.
  - Full frontend test suite (`npm --workspace @mmm/web test`): 86 passed, 0 failed.
  - Total repository tests passing: 221 tests. Zero regressions.

### 2026-11-14 — Vendor Management Suite (V1 — Stitch Design Reference) — Complete

- **Database Architecture & Data Integrity:**
  - Added Prisma models `Vendor`, `VendorService`, `VendorEvent`, `VendorBooking`, `VendorPayment`, and `VendorDocument` with integer-paise math and `NUMERIC(12,2)` columns.
  - Added enums `VendorCategory` (18 verticals), `VendorPriceRange`, `VendorStatus`, and `VendorBookingStatus`.
  - Applied migration `20261114120000_add_vendor_management_suite` to PostgreSQL with non-negative constraints and relational foreign keys.
  - Regenerated Prisma Client 7.10.0 with full type safety.
- **Backend REST API (`/api/v1/vendors`):**
  - Modular domain architecture in `apps/api/src/modules/vendors/`: `schemas.ts`, `service.ts`, `routes.ts`.
  - Implemented 17 endpoints covering vendor CRUD, booking creation, payment disbursements, itemized services, pipeline status changes, favorite shortlist toggling, Stitch KPI dashboard analytics, comparison matrix, and production calendar.
  - Automatic bidirectional synchronization between `VendorBooking` / `VendorPayment` and `Expense`: creating or updating vendor bookings immediately updates the master wedding expense ledger in atomic transactions.
  - 13 backend unit/integration tests in `apps/api/tests/vendors.test.ts` passing (13/13).
- **Frontend UI & Stitch Design Reference (`/vendors`):**
  - Implemented full vendor management suite in `apps/web/src/features/vendors/`:
    - `VendorsPage.tsx`: Main page orchestrator with persistent layout, top sub-nav `VIEW STATE:` tabs, and `Live Sync Enabled` badge.
    - `VendorDashboardView.tsx`: 8 KPI cards, Booking Pipeline Funnel (5 stages), Budget Allocation by Tier (segmented progress bar & category cards), Upcoming Vendor Milestones, Activity & Audit Trail.
    - `VendorDirectoryView.tsx`: Search bar, category filter, status tabs, grid/table view toggle, rating stars, favorite toggle heart, and quick booking triggers.
    - `VendorCategoriesView.tsx`: Interactive grid of 18 wedding categories with allocation totals and settlement bars.
    - `VendorProfileDeepDiveView.tsx`: Selected vendor hero card and 4 deep-dive sub-tabs (Overview & Packages, Bookings & Contracts, Payment History, Team Notes & Riders).
    - `VendorPaymentsLedgerView.tsx`: 4 financial ledger KPI cards and transaction table with search, vendor, and method filters.
    - `VendorComparisonView.tsx`: Checkbox selector for 2–4 vendors with side-by-side metric evaluation matrix.
    - `VendorScheduleTimelineView.tsx`: Chronological production schedule with milestone cards, ceremony tags, and conflict detection banner.
    - Modals: `AddEditVendorModal.tsx`, `VendorBookingModal.tsx`, and `RecordVendorPaymentModal.tsx`.
  - Wired `/vendors` and `/wedding/vendors` routes in `apps/web/src/app/router.tsx` and updated `DashboardSidebar.tsx` to remove "Coming Soon" and display dynamic vendor count badge.
  - 4 frontend tests in `apps/web/tests/vendors.test.tsx` passing (4/4).
- **Verification:**
  - TypeScript typecheck (`npm run typecheck`): 0 errors across `@mmm/api` and `@mmm/web`.
  - ESLint (`npx eslint`): 0 errors across all vendor source and test files.
  - Backend tests (`npm --workspace @mmm/api test -- tests/vendors.test.ts`): 13 passed, 13 total.
  - Frontend tests (`npm --workspace @mmm/web test -- tests/vendors.test.tsx`): 4 passed, 4 total.
  - Cross-module regression tests (`tests/expenses.test.ts` and `tests/expenses.test.tsx`): 17 passed, 17 total.

- **Database Architecture & Data Integrity:**
  - Added `RsvpStatus` (`PENDING`, `ATTENDING`, `NOT_ATTENDING`) enum in `prisma/schema.prisma`.
  - Added `Guest` model with party capacity (`maxGuests`, default 1), attendance tally (`attendingCount`), secure token tracking (`invitationToken`, `invitationTokenHash`), email dispatch timestamps (`invitationSentAt`, `lastReminderSentAt`), and reminder count.
  - Added `GuestEvent` join table for granular multi-ceremony access (inviting select guests to specific ceremonies like Haldi or Mehendi while reserving general ceremonies for all).
  - Applied migration `20261111180000_add_guest_management` to PostgreSQL and regenerated Prisma Client 7.10.0.
- **Backend REST API (`/api/v1/guests` & `/api/v1/public/invitations`):**
  - Modular domain architecture in `apps/api/src/modules/guests/`: `schemas.ts`, `service.ts`, `routes.ts`.
  - `POST /api/v1/guests`: Creates guest party with cross-wedding event validation and tenant boundary enforcement.
  - `GET /api/v1/guests`: Paginated list with filtering by RSVP status, event assignment, invitation delivery status, and text search.
  - `GET /api/v1/guests/dashboard`: Returns aggregate metrics (`totalGuests`, `pendingRsvps`, `attendingGuests`, `notAttendingGuests`, `expectedAttendeeCount`, `invitationsSentCount`).
  - `GET /api/v1/guests/:guestId`: Returns single guest details with ceremony schedule.
  - `PATCH /api/v1/guests/:guestId`: Updates party size, contact info, notes, and ceremony assignments.
  - `DELETE /api/v1/guests/:guestId`: Removes guest within the wedding workspace.
  - `GET /api/v1/guests/:guestId/invitation-link`: Generates and retrieves stable personal share link.
  - `POST /api/v1/guests/:guestId/invitation/send`: Sends digital invitation via Resend email.
  - `POST /api/v1/guests/reminders/send`: Batch dispatches courteous follow-up reminder emails to all pending guests.
  - `GET /api/v1/public/invitations/:token`: Public rate-limited invitation inspection.
  - `POST /api/v1/public/invitations/:token/rsvp`: Public rate-limited RSVP submission with party size validation constrained to `maxGuests`.
  - Dashboard integration: Updated `getDashboard` in `wedding/service.ts` to compute real guest headcount and RSVP status counts directly from the database.
  - 17 unit/integration tests in `apps/api/tests/guests.test.ts` passing.
- **Frontend UI & Application Integration (`/guests` & `/invite/:token`):**
  - Implemented `apps/web/src/features/guests/`: `guestsApi.ts`, `GuestsPage.tsx`, `GuestModal.tsx`, `GuestDetailModal.tsx`, `SendRemindersModal.tsx`.
  - Implemented public invitation view: `apps/web/src/features/invitations/PublicInvitationPage.tsx`.
  - Replaced the `/guests` roadmap placeholder with the interactive Guest Management suite inside `AuthenticatedLayout`.
  - Top KPI Ribbon: Total Parties, Attending Headcount, Pending RSVPs, Declined, and Invitations Sent percentage.
  - Filter and search bar: Search by guest name/email/phone, RSVP status tabs with counts, ceremony dropdown filter, dispatch status filter, and sort direction.
  - Guest table: Displays name, contact details, RSVP status badge, party size, ceremony chips, one-click link copy, and WhatsApp share button.
  - `GuestModal`: Dialog for adding and editing guests with multi-event ceremony selection and capacity stepper.
  - `GuestDetailModal`: Comprehensive guest view with invitation actions, WhatsApp sharing, and Resend email triggers.
  - `SendRemindersModal`: Confirmation modal for batch RSVP follow-ups.
  - `PublicInvitationPage`: Mobile-first responsive invitation with couple banner, auspicious Ganesh invocation, itinerary schedule, and RSVP response form.
  - Dashboard & Sidebar Integration: Dynamic guest count badge in `DashboardSidebar`, real metrics in `SummaryCard` GUESTS & RSVP card, and direct routing in `QuickActions` "Add Guest".
  - Frontend test suite in `apps/web/tests/guests.test.tsx` verifying metric display, guest table rendering, modal workflows, and public RSVP submission (5/5 passing).
- **Verification:**
  - TypeScript strict typecheck across monorepo: `npm run typecheck` passed (code 0).
  - Web test suite: `npm --workspace @mmm/web test` passed (72/72 tests passing).
  - Production build: `npm run build` passed (Parcel client bundle and API server build completed cleanly).

### 2026-11-09 — Wedding Task Management Module (V1) — Complete

- **Database Architecture & Data Integrity:**
  - Added `TaskStatus` (`TO_DO`, `IN_PROGRESS`, `COMPLETED`) and `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`) enums in `prisma/schema.prisma`.
  - Added `Task` model with foreign keys to `Wedding`, `Event` (optional), `WeddingMembership` (optional assignee), and `User` (creator).
  - Configured cascade deletion on `Wedding` and `ON DELETE SET NULL` on `assignedMember` and `event` to preserve task history on member offboarding or event removal.
  - Generated Prisma Client 7.10.0 and migration `20261109180000_add_task_management`.
- **Backend REST API (`/api/v1/tasks`):**
  - Implemented modular domain structure in `apps/api/src/modules/tasks/`: `schemas.ts`, `service.ts`, `routes.ts`.
  - `POST /api/v1/tasks`: Validates title, optional description, priority, due date, event association, and assignee membership. Enforces strict wedding tenant boundary and CSRF protection.
  - `GET /api/v1/tasks`: Supports pagination (`page`, `limit`), filtering by status, priority, eventId, assignedMemberId, `mine=true`, case-insensitive text search on title, dynamic sort ordering, and computed metrics (`total`, `todoCount`, `inProgressCount`, `completedCount`, `overdueCount`).
  - `GET /api/v1/tasks/:taskId`: Returns single task details with creator, assignee member user details, and linked event metadata.
  - `PATCH /api/v1/tasks/:taskId`: Updates fields and associations with tenant verification and cross-wedding validation.
  - `PATCH /api/v1/tasks/:taskId/status`: Quick status update with automatic `completedAt` timestamp tracking.
  - `DELETE /api/v1/tasks/:taskId`: Deletes task securely within the caller's wedding workspace.
  - Comprehensive unit test suite in `apps/api/tests/tasks.test.ts` covering validation, CSRF, auth, filtering, pagination, updates, and isolation (12/12 passing).
- **Frontend UI & Application Integration (`/tasks` & `/wedding/tasks`):**
  - Implemented `apps/web/src/features/tasks/`: `tasksApi.ts`, `TasksPage.tsx`, `TaskModal.tsx`, `TaskDetailModal.tsx`.
  - Replaced the `/tasks` roadmap placeholder with the full interactive Task Management suite inside `AuthenticatedLayout`.
  - Metrics row: Total Tasks, To Do, In Progress, Completed with real-time indicators and overdue warning counter.
  - Tabs: All Tasks, My Tasks (auto-filtered by caller membership), and Completed Tasks.
  - Filter and search bar: Search by title, status filter, priority filter, event filter, and sort ordering (Due Date, Priority, Title, Created).
  - Task List: Instant checkbox toggle for quick completion, priority badges (`HIGH`, `MEDIUM`, `LOW`), due date indicators with overdue highlighting, assignee avatar/initials, and event tags.
  - `TaskModal`: Clean dialog for creating and editing tasks with real-time validation, due date picker, priority selector, dynamic wedding team member dropdown, and event selector.
  - `TaskDetailModal`: Task inspection modal with status switcher pills, details breakdown, and delete confirmation.
  - Workspace dashboard integration: Connected the Quick Action "Create Task" button and the "Tasks to focus on" widget in `apps/web/src/features/wedding/` to `/tasks`.
  - Frontend test suite in `apps/web/tests/tasks.test.tsx` verifying metric display, task rendering, filtering, and creation (4/4 passing).
- **Verification:**
  - Backend tests: 82 passed, 1 skipped (database integration requiring live PG), 0 failed (`npm --workspace @mmm/api test`).
  - Frontend tests: 67 passed, 8 suites passed (`npm --workspace @mmm/web test`).
  - Strict typecheck: Passed across all workspaces with 0 errors (`npm run typecheck`).
  - Production build: Succeeded with Parcel web bundling and TypeScript compilation (`npm run build`).
  - Lint and code style: 0 ESLint errors and 100% Prettier compliance (`npm run lint`, `npm run format:check`).

### 2026-11-08 — Secret Hygiene Fix — Complete

- **Root cause:** `.env.example` contained live Resend API key, production DB password, and session/CSRF secrets committed to version control.
- **Fix:** Replaced all real credential values with safe documented placeholders before the GitHub push. Used `git commit --amend` to ensure the secrets never landed in GitHub history (commit `497a2de`).
- **Action required:** Rotate the exposed Resend API key and DB password. Generate new `SESSION_SECRET` and `CSRF_SECRET` for all environments using `node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"`.
- **Verification:** `git push origin dev` succeeded with GitHub push protection satisfied.

### 2026-11-08 — Lighthouse Performance Audit — Complete (implementation pending approval)

- **Audit scope:** Reviewed entire frontend architecture across Dashboard, Events, Sidebar, Layout, Auth, images, fonts, routing, and third-party dependencies.
- **Critical findings identified:**
  1. `apps/web/index.html` lines 23-28: `<link rel="preload" as="image" href="./src/assets/images/wedding-hero.jpg">` — the 937 KB hero JPEG is preloaded globally on **every** page including `/login` and `/`. On Lighthouse 4G throttling (~1.6 Mbps) this alone consumes 5-8 seconds of network bandwidth, directly causing FCP 22.6s and LCP 28.4s.
  2. `apps/web/src/app/router.tsx`: All 15 route components statically imported — the entire 710 KB minified bundle downloads before any page can render (TBT 740 ms).
  3. `apps/web/index.html` lines 19-22: Google Fonts loaded as synchronous render-blocking `<link rel="stylesheet">`.
  4. `wedding-hero.jpg` is 937 KB uncompressed JPEG with no WebP/AVIF variant.
- **Proposed fixes (pending user approval):**
  - Remove hero-image preload from global `index.html`; load it lazily only where used.
  - Convert Google Fonts link to `media="print" onload="this.media='all'"` async pattern.
  - Add `React.lazy()` + `<Suspense>` route-level code splitting for all 10 authenticated routes.
  - Convert hero image to WebP/AVIF (target ≤ 100 KB).
- **Verification:** Audit runs confirmed: `npm run build` ✓, `npm test` 133/133 ✓, `npm run typecheck` ✓.

### 2026-11-08 — Global Persistent Application Layout & Dashboard Responsiveness — Complete

- **Persistent Application Layout (`AuthenticatedLayout`):**
  - Implemented shared `AuthenticatedLayout` wrapped inside `<ProtectedRoute requireWedding>` in `apps/web/src/app/router.tsx`.
  - Persistent 270px left sidebar (`DashboardSidebar`) remains permanently visible and mounted across all authenticated routes (`/dashboard`, `/events`, `/events/:eventId`, `/settings/members`, `/members`, `/tasks`, `/guests`, `/expenses`, `/vendors`, `/website`, `/gallery`, `/settings`).
  - Navigating between pages updates only the right-side main content area via React Router `<Outlet />`, with zero unmounting or re-rendering of the sidebar.
  - Active route highlighting powered by `isItemActive`: exact matching for `/dashboard`, prefix matching for `/events` & `/wedding/events`, and disambiguated paths for `/settings` vs `/settings/members`.
  - Feature placeholder page (`FeaturePlaceholderPage`) with warm editorial styling for roadmap modules (`/tasks`, `/guests`, `/expenses`, `/vendors`, `/website`, `/gallery`, `/settings`).
  - Seamless backward compatibility: pages detect `useIsInsideAuthenticatedLayout()` to avoid rendering duplicate standalone headers or sidebars, ensuring 100% of existing isolated unit tests continue to pass.
- **Dashboard Sizing, Spacing & Viewport Responsiveness:**
  - Standardized shell grid layout: `lg:grid lg:grid-cols-[270px_minmax(0,1fr)] min-h-screen w-full` with content container `min-w-0 flex flex-col flex-1 w-full`.
  - Pinned desktop sidebar: `w-[270px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-[#EAE6E1] bg-white` with independent scroll only when height is exceeded.
  - Completely eliminated duplicate inner vertical scrollbars and horizontal scrollbars.
  - Streamlined `WeddingOverview` hero card to make it attractive and compact (reduced padding to `p-5 sm:p-6`, tightened metadata chips, and adjusted heading proportions to `text-2xl sm:text-3xl lg:text-[32px]`).
  - Responsive column alignment:
    - Large desktop: 4 quick actions, 4 summary cards, 2-column bento grid.
    - Tablet: 2 quick actions per row, 2 summary cards per row, stacked sections.
    - Mobile: Single-column canvas with drawer sidebar triggered from header hamburger menu.
- **Verification:**
  - `npm.cmd run typecheck`: Passed with 0 errors across `@mmm/web` and `@mmm/api`.
  - `npm.cmd run lint`: Passed with 0 errors across all workspaces.
  - `npm.cmd run format:check`: Passed with 100% Prettier compliance.
  - `npm.cmd test --workspace @mmm/web`: 7 of 7 test suites passed (63 of 63 tests).
  - `npm.cmd test --workspace @mmm/api`: 6 of 6 test suites passed (70 of 70 tests).
  - `npm.cmd run build`: Built production distribution in 9.81s with Parcel and TypeScript.

### 2026-11-08 — Wedding Management Suite Dashboard Redesign — Complete

- **Visual Fidelity & Layout Alignment (Screenshots 1 & 2):**
  - **Sidebar Navigation:** Clean, navigation-only sidebar matching Screenshot 1. Structured into `MAIN MENU` (Dashboard, Events, Tasks, Guests & RSVP, Expenses, Vendors, Wedding Website, Gallery) and `ADMINISTRATION` (Settings, Wedding Members). Active item highlighted with `#FBF4F0` background, burgundy text, and dot indicator. Real and preview badges displayed (`3` on Events, `4 Due` on Tasks, `184` on Guests, `Live` on Website, `3` on Members). Duplicate bottom user profile and workspace switchers removed.
  - **Minimal Top Header:** Clean, role-aware header without duplicate workspace or branding elements. Features notification bell with unread count `3`, circular avatar with status dot, user display name, dynamic role badge (`Admin`, `Manager`, `Organizer`), and profile dropdown with smooth sign out.
  - **Wedding Overview Hero Card:** Features "Welcome to your wedding workspace" pill, large serif wedding title, concierge workspace synchronization subtitle, three metadata cards (Scheduled Ceremony date, Celebration Destination, and Days to Go countdown pill), subtle rotated diamond watermark, and "Edit Wedding Details" trigger.
  - **Quick Actions Bar:** 4 horizontal action cards (Create Event with `#964F38` terracotta accent linking to `/events`, Create Task, Add Guest, Add Expense). Non-implemented tools trigger clean Coming Soon modal.
  - **Four Dashboard Summary Cards (Screenshot 2):** Upcoming Events (`3 Scheduled`, next ceremony indicator), Task Progress (`24 / 28`, `86%` progress bar, urgent task count), Guests & RSVP (`184 Total`, attending & pending breakdown), and Recorded Expenses (`₹18,45,000`, confirmed payments indicator).
  - **Two-Column Main Content Area (Screenshot 2):**
    - **Left Column (~58%):** `Upcoming Events` ("Ceremonies & Itinerary", "+ Add Ceremony", "View All →", vertical ceremony cards with month/day date boxes, time range, venue location, guest counts, status badges, and options menu).
    - **Right Column (~42%):** `Tasks to Focus On` ("Priority checklist", "+ New Task", interactive task cards with checkboxes, priority badges `HIGH`, `MED`, `Normal`, due dates, and assignee avatars with initials).
  - **Component Modularization:** Extracted dashboard into discrete components (`DashboardSidebar`, `DashboardHeader`, `WeddingOverview`, `QuickActions`, `SummaryCard`, `UpcomingEventsCard`, `TaskFocusList`, `EditWeddingDetailsModal`, `ComingSoonModal`).
- **Data Integration & Graceful Fallbacks:**
  - Database-first resolution for real wedding workspace data (`Wedding`, `Event`, countdown calculation).
  - Isolated demo and mock data maintained in `apps/web/src/features/wedding/dashboardMockData.ts` without database pollution.
  - Coming Soon modals for unbuilt modules (Guest list, Budget tracker, Vendors).
- **Verification:**
  - `npm run typecheck`: Passed with 0 errors across `@mmm/web` and `@mmm/api`.
  - `npm --workspace @mmm/web test`: Passed with 63 passed tests across 7 test suites (`brand.test.tsx`, `events.test.tsx`, `members.test.tsx`, `signup.test.tsx`, `auth.test.tsx`, `app.test.tsx`, `wedding.test.tsx`).
  - `npm --workspace @mmm/web run build`: Production Parcel build succeeded in 11.00s with all assets (including 8 favicon formats and hero image) cleanly bundled.

- **Database Models & PostgreSQL Migration:**
  - Added `Event` model and `EventStatus` enum (`PLANNED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) to Prisma schema mapping to `events`.
  - Added database check constraint `events_time_order` ensuring `ends_at >= starts_at`.
  - Added indexes on `(weddingId, startsAt)` and `(weddingId, status)` with foreign key cascade on `weddingId`.
  - Applied migration `20261108170000_wedding_events` and generated Prisma Client 7.10.0.
- **Backend REST API (`/api/v1/events`):**
  - Implemented `POST /api/v1/events`: Creates event with Zod 4 validation, name/time constraints, and strict wedding tenant resolution via user membership.
  - Implemented `GET /api/v1/events`: Paginated event listing with status filtering, date range, search, sorting, and aggregated metrics (`total`, `upcoming`, `completed`, `cancelled`).
  - Implemented `GET /api/v1/events/:eventId`: Detailed event lookup scoped to current wedding.
  - Implemented `PATCH /api/v1/events/:eventId`: Partial update with chronological time validation and status updates (including quick cancellation).
  - Implemented `DELETE /api/v1/events/:eventId`: Confirmed event deletion with tenant boundary isolation.
  - State-modifying endpoints enforce `requireSameOrigin` and double-submit CSRF cookie/header protection.
  - Updated `GET /api/v1/dashboard` to provide real event counts and chronological upcoming events list.
- **Frontend Workspace & UI (`apps/web`):**
  - Implemented `EventsPage` (`/events`, `/wedding/events`): Responsive overview with metric summary cards, search filter, status filter, date sort, empty states, and delete confirmation modal.
  - Implemented `EventModal`: Create/Edit modal with event name presets (Roka, Engagement, Mehendi, Haldi, Sangeet, Cocktail, Wedding, Reception), custom name input, date & time pickers, venue details, dress code suggestions, and curated cover photo presets.
  - Implemented `EventDetailPage` (`/events/:eventId`): Hero cover banner, timing, dress code, venue location, status actions, and tabbed view for Overview, Invited Guests, Related Tasks, Related Expenses, and Related Vendors with honest empty states.
  - Updated `DashboardPage` (`/dashboard`): Real event metric card, dynamic upcoming events list with direct detail navigation, and checklist setup link.
  - Resilient API unwrapping in `eventsApi.ts` ensuring safe defaults and preventing unhandled undefined property errors.
- **Verification:**
  - `npm run typecheck`: Passed with 0 errors across `@mmm/web` and `@mmm/api`.
  - `npm test --workspace=@mmm/web`: Passed with 63 passed tests across 7 test suites.
  - `npm test --workspace=@mmm/api`: Passed with 70 passed tests across 6 test suites (1 skipped).
  - Total automated test suite: 133 passed tests across 13 test suites.
  - `npm run lint`: Passed with 0 errors and 0 warnings.
  - `npm run format:check`: Passed with all files formatted according to Prettier.
  - `npm run build`: Production build succeeded across all workspaces (`apps/web` Parcel build configured with isolated cache).

### 2026-11-05 — Security Hardening, Open Redirect Mitigation & QA Verification — Complete

- **Security & Authorization Hardening:**
  - Neutralized Open Redirect (CWE-601) vulnerabilities in `/login` and `/signup` by introducing strict local relative pathname sanitization (`sanitizeRedirectUrl` in `apps/web/src/lib/api-client.ts`).
  - Gated the self-invitation acceptance testing shortcut in `apps/api/src/modules/members/service.ts` exclusively to non-production environments and strictly enforced recipient email matching to prevent unauthorized invitation redemption in production.
  - Hardened CSRF token cookie reading and auto-recovery in the frontend API client.
- **Frontend Build & Dependency Optimization:**
  - Resolved Parcel runtime HMR module resolution for authentication components by co-locating `sanitizeRedirectUrl` within the core `api-client` dependency.
  - Added `.temp-cache/` to `.gitignore` to prevent Parcel temporary build cache pollution.
- **Automated Test Coverage Expansion:**
  - Added unit test coverage for `sanitizeRedirectUrl` validating local path preservation and rejection of external protocol, schema-relative, and backslash targets.
  - Added component test coverage for `LoginPage` external redirect sanitization.
  - Added test coverage for the restricted `MANAGER` role view on `/settings/members` confirming hidden admin controls and absence of pending invitation management.
  - Resolved React `act(...)` test lifecycle warnings on members data fetching.
- **Verification:**
  - `npm run typecheck`: Passed with 0 errors across `@mmm/web` and `@mmm/api`.
  - `npm test --workspace=@mmm/web`: Passed with 58 passed tests across 6 suites.
  - `npm test --workspace=@mmm/api`: Passed with 54 passed tests across 5 suites (1 skipped).
  - Total automated test suite: 112 passed tests across 11 test suites.
  - `npm run lint`: Passed with 0 errors and 0 warnings.
  - `npm run format:check`: Passed with all files formatted according to Prettier.

### 2026-10-28 — Wedding Member Management & Team Invitations — Complete

- **Database models & migration:** Added `MemberInvitation` and `InvitationStatus` enum (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`) with migration `20261027055829_member_invitations` with foreign keys, indexes on token hash and workspace status, and 7-day expiration.
- **Backend REST APIs under `/api/v1`:**
  - `GET /api/v1/members`: Lists active workspace members with roles and user profile info.
  - `POST /api/v1/members/invitations`: Admin-only invite creation with rate limiting (15 req/15m), SHA-256 token hashing, and Resend email dispatch.
  - `GET /api/v1/members/invitations`: Admin-only listing of pending invitations.
  - `DELETE /api/v1/members/invitations/:id`: Admin-only revocation of pending invitations.
  - `PATCH /api/v1/members/:id`: Admin-only role promotion/demotion protected by last-admin safety rule.
  - `DELETE /api/v1/members/:id`: Admin-only member removal protected by last-admin safety rule.
  - `GET /api/v1/public/member-invitations/:token`: Public preview of wedding and inviter info for invitees.
  - `POST /api/v1/member-invitations/:token/accept`: Atomic acceptance flow using conditional row lock and transaction ensuring no double-acceptance race condition (rate limited to 20 req/15m).
- **Frontend UI & Pages:**
  - Screen `/settings/members` (`MembersPage.tsx`): Active team roster, role changer, member removal, pending invitation list with revoke action, and invite modal with instant copyable invitation link.
  - Screen `/invitations/members/:token` (`AcceptInvitationPage.tsx`): Warm ivory invitation acceptance card with wedding details, inviter name, role badge, session synchronization, and authentication redirects.
  - Navigation: Quick link on `/dashboard` and header navigation linking to team management.
- **Verification:**
  - `npm run typecheck`: Passed with exit code 0 across `@mmm/web` and `@mmm/api`.
  - `npm run lint`: Passed with 0 errors and 0 warnings.
  - `npm run format:check`: Passed with all files complying with Prettier styling.
  - `npm test`: Passed with 106 passed tests across 11 test suites (52 web tests passed across 6 suites, 54 API tests passed across 5 suites, 1 skipped).
  - `npm run build`: Passed with exit code 0 for both Parcel web dist and TypeScript API build.

### 2026-10-27 — Wedding Onboarding & Workspace Dashboard (V2) — Complete

- **Database models & migration:** `Wedding`, `WeddingMembership`, `WeddingRole`, `WebsiteSettings`, `WebsiteTheme`, `GalleryAccessToken` with migration `20261025083557_wedding_workspace` enforcing 1 user belongs to 1 wedding in V1.
- **Backend REST APIs under `/api/v1`:**
  - `POST /api/v1/wedding` (creates wedding, assigns creator as Admin, generates website settings & slug, and gallery token in a single database transaction).
  - `GET /api/v1/wedding` and `PATCH /api/v1/wedding` (workspace retrieval and editing).
  - `GET /api/v1/dashboard` (aggregates wedding metadata, live countdown calculation, and summary counts).
  - Updated `GET /api/v1/auth/me` and `login` to return user's membership and wedding context.
- **Frontend UI & Stitch reproduction:**
  - Screen 1 (`/wedding/setup`): Warm ivory aesthetic, serif typography, countdown calculation, pre-filled creator name, and responsive layout.
  - Screen 2 (`/dashboard`): Welcome hero with days-to-go pill, 4 metric cards, planning sections with honest empty states, and bento quick action cards.
  - Shared brand mark (`BrandMark.tsx`): Authentic M-and-heart vector mark and page-driven subtitle system across all 17 page variants.
  - Reliability & asset loading: Top-level `ErrorBoundary`, fallback `NotFoundPage`, and high-resolution hero background preload.
- **Verification:**
  - `npx prisma migrate dev`: Migration `20261025083557_wedding_workspace` applied cleanly to PostgreSQL database.
  - `npm run typecheck`: Passed with code 0 across `@mmm/web` and `@mmm/api`.
  - `npm test`: Passed with 85 passed tests across 9 active suites (49 Web tests passed across 5 suites, 36 API tests passed across 4 suites, 1 skipped).
  - `npm run lint`: Passed with 0 errors and 0 warnings.
  - `npm run build`: Both Parcel frontend bundle and Express build succeeded without errors.

## Next planned features & roadmap

> [!IMPORTANT]
> Three open design discrepancies must be resolved with the user before implementing Guest/RSVP features. See `AGENTS.md` for details.

1. **Lighthouse Performance Optimization (target 90+):**
   - Remove 937 KB hero-image global `<link rel="preload">` from `index.html` (affects every page including `/`).
   - Convert Google Fonts `<link rel="stylesheet">` to non-render-blocking async load.
   - Add route-level code splitting with `React.lazy()` + `<Suspense>` to cut 710 KB monolithic bundle to < 180 KB initial entry.
   - Convert `wedding-hero.jpg` (937 KB) to WebP/AVIF (target < 100 KB).
   - **Pending user approval** before any code changes are applied.
2. **Guest List & RSVP Management (PRD §9.3, REST API §5.6):**
   - Guest records, party size, attendance tracking, dietary requirements, and invitation link generation.
   - Resolve three open design discrepancies first (invitation link storage, RSVP capacity model, wedding location model).
3. **Wedding Tasks & Collaboration (PRD §9.6, REST API §5.5):**
   - Task creation, assignments to members, due dates, priority, status tracking (`TODO`, `IN_PROGRESS`, `COMPLETED`).
4. **Vendors & Expense Tracking (PRD §9.8, §9.9):**
   - Booked vendors, category tracking, budget and expense logging.
5. **Wedding Website & Photo Gallery (PRD §9.10, §9.11):**
   - Public wedding website with customizable themes and guest photo uploads via QR code.

### 2026-10-13 — Public homepage — Complete (frontend UI)

- Added the responsive public marketing homepage with feature, workflow, wedding-website, guest-experience, FAQ, and call-to-action sections.
- Updated the dashboard illustration to follow the approved visual reference, with guest responses, a sample wedding website, upcoming events, and a planning checklist.
- Names, dates, counts, and progress values in the illustrations are placeholders. The homepage is static and has no backend integration yet.
- **Verification:** `npm run typecheck --workspace @mmm/web` passed; `npm run build --workspace @mmm/web` passed; targeted Prettier check passed; the local page was visually inspected and had no browser console errors. Jest tests were not run.

### 2026-10-12 — Repository foundation — Complete

- Created the npm workspaces monorepo with `apps/web` and `apps/api`.
- Set up React, TypeScript, Parcel, and Tailwind CSS for the frontend, plus the TypeScript + Express API foundation and health endpoint.
- Added baseline workspace tooling, tests, environment example, README, and approved design documents.
- Prisma schema and business features were intentionally deferred; see the unresolved design decisions in `AGENTS.md` and the approved design documents.
