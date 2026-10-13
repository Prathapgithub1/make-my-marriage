# Make My Marriage — Project Status

This file tracks delivered project milestones. The approved PRD, System Design, Database Design, and REST API Design remain the source of truth for product and architecture requirements.

## Current snapshot

- **Repository foundation:** Complete. The npm workspaces monorepo contains the Parcel-based React + TypeScript + Tailwind frontend and the TypeScript + Express API foundation. The API currently provides its health endpoint and shared application setup.
- **Public homepage:** Frontend UI implemented with sample content. It is not yet integrated with backend data or product workflows.
- **Business features and database:** Not implemented. Prisma schema work and affected behavior remain deferred until the documented guest-link, RSVP-capacity, and wedding-location decisions are resolved.

## Milestones

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
