# Make My Marriage — Project Status

This file tracks delivered project milestones. The approved PRD, System Design, Database Design, and REST API Design remain the source of truth for product and architecture requirements.

## Current snapshot

- **Wedding Onboarding & Workspace Dashboard:** Complete end-to-end. Authenticated users without a wedding can complete the Stitch-inspired onboarding form, persist their workspace in PostgreSQL, become its Admin in a transaction, and land on their real dashboard. Users with an existing wedding return to that workspace. Dashboard renders actual database details and honest empty states without fabricated data.
- **Brand System & Dynamic Context:** Approved M-and-heart vector mark and dynamic uppercase page subtitles integrated across all public, auth, onboarding, and workspace routes.
- **Resilient Frontend Architecture:** React ErrorBoundary, 404 route handling, and optimized asset delivery via HTML preload and CSS styling (resolving Parcel asset bundling).
- **Authentication flow:** Complete with server-side sessions, Argon2 hashing, CSRF protection, and Resend password reset integration.
- **Repository foundation & database:** Complete with PostgreSQL and Prisma 7 ORM migrations.

## Milestones

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

1. **Wedding Member Management & Team Invitations (PRD §9.4, REST API §5.3):**
   - Admin invites family members/organizers via email with roles (`ADMIN`, `MANAGER`).
   - Secure invitation tokens, expiration, and acceptance flow (`/api/v1/members`, `/api/v1/members/invitations`, `/api/v1/member-invitations/:token/accept`).
   - Settings UI for member list, role changes, and member removals.
2. **Wedding Events Management (PRD §9.5, REST API §5.4):**
   - Multi-event scheduling (Engagement, Mehendi, Haldi, Sangeet, Wedding, Reception).
   - Event dates, start/end times, venues, dress codes, and descriptions.
3. **Wedding Tasks & Collaboration (PRD §9.6, REST API §5.5):**
   - Task creation, assignments to members, due dates, priority, status tracking (`TODO`, `IN_PROGRESS`, `COMPLETED`).
4. **Guests & Digital Invitations (PRD §9.7, REST API §5.6):**
   - Guest list management, household grouping, unique guest invitation links, and RSVP tracking.
5. **Vendors & Expense Tracking (PRD §9.8, §9.9):**
   - Booked vendors, category tracking, budget and expense logging.
6. **Wedding Website & Photo Gallery (PRD §9.10, §9.11):**
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
