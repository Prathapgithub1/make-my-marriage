# Agent instructions

## Product and source of truth

This repository builds Make My Marriage, a wedding-planning SaaS application. Before changing application behavior, review the relevant approved documents in `Docs/`:

- `Product Requirements Document (PRD V1).md`
- `System_Design_Architecture.md`
- `Database_Design_V1.md`
- `REST API Design V1.md`

Treat those documents as the source of truth. Do not invent product requirements or silently resolve disagreements between documents. Describe the conflict, its implementation impact, and ask the user when the documents do not support a clear resolution. Keep `Docs/` as the documentation directory; do not create a duplicate lowercase `docs/` folder. Do not edit approved design documents unless the user explicitly asks.

## Project progress tracking

- Maintain `Docs/PROJECT_STATUS.md` as the concise milestone log for completed major features and project foundations. It records delivery progress; the approved PRD and architecture documents remain the source of truth for requirements.
- After completing a major feature or foundation milestone, update the status log with the date, completion state, a short implementation summary, and the checks actually run. Note placeholder/demo data, deferred integrations, and known blockers when they affect what is complete.
- Keep the newest milestone first. Do not mark planned work as complete or update the log for every minor styling or maintenance change.
- When reporting verification, record only checks performed and their actual outcomes.

## Approval boundaries

- Work in the phase or feature the user explicitly authorized. Approval to review or plan does not authorize implementation.
- The initial repository scaffold is already in place. Do not add product features, database schema, or integrations unless the user authorizes that work.
- Make focused, incremental changes. Before a substantial implementation, explain important architectural choices and trade-offs.
- Do not install packages, run scaffolding, commit, push, or deploy unless that action is requested or authorized by the user.
- Never expose secrets, credentials, access tokens, or sensitive environment values. Keep secrets out of source, browser bundles, logs, and commits.

## Approved architecture

- npm workspaces monorepo with `apps/web` and `apps/api`.
- Frontend: React, TypeScript, Parcel, Tailwind CSS, React Router, TanStack Query, Zod, and React Hook Form.
- Backend: Node.js, TypeScript, Express, REST JSON API under `/api/v1`, organized as a modular monolith.
- PostgreSQL is the business-data source of truth; Prisma is the planned ORM. Keep the Prisma schema and migrations in the root `prisma/` directory once authorized and design decisions are resolved.
- Keep routes owned by their backend domain modules. Keep shared middleware, errors, configuration, and app composition outside domain route ownership.
- Add feature folders only as features are implemented. Keep `packages/contracts/` optional until a concrete shared-contract need exists.
- Do not introduce Vite, microservices, Kubernetes, or infrastructure beyond the approved design.
- External integrations must be configurable through environment variables. Basic local development must not require production credentials.

## Decisions that remain open

The user selected `Asia/Kolkata` as the wedding time-zone default and selected custom session code rather than a session-management library. Do not reverse those choices without asking.

Before implementing the database schema or affected business behavior, resolve these documented discrepancies with the user:

1. **Guest invitation link:** System and API designs require an organizer to retrieve the same share URL later, while the database design stores only a token hash. Do not choose a recoverable-token or regeneration strategy silently.
2. **RSVP capacity:** PRD/API behavior requires a per-invitation guest capacity, with `maxGuests` defaulting to 1 and constrained to 1–10,000; the database design does not currently model it. Confirm the storage/model change.
3. **Wedding location:** System/API designs use structured address and Places coordinates; the database design currently stores free text. Confirm how to reconcile the storage model.

Do not add a placeholder Prisma schema or Prisma dependencies as a workaround for these unresolved choices. Do not implement authentication/session behavior until the approved authentication design has been reviewed and any conflict is resolved.

## Repository map

- `apps/web/`: Parcel HTML entry, React app, shared frontend setup, and frontend tests.
- `apps/api/`: Express app/server, configuration, shared middleware/errors, domain modules, and API tests.
- `prisma/`: reserved for the approved root schema and migrations.
- `packages/`: reserved for shared packages when justified.
- `infrastructure/` and `scripts/`: add contents only when an approved implementation requires them.
- `Docs/`: approved product and architecture references.

## Engineering practices

- Enforce authentication, role permissions, and wedding tenant isolation on the server; frontend checks are not authorization.
- Validate request data at API boundaries with Zod and use standardized safe API errors.
- Keep logs useful and safe: use request IDs and never log credentials, session secrets, or sensitive tokens.
- Keep environment configuration validated and provide safe examples only; never commit a real `.env` file.
- Use database migrations for production changes; do not use production schema synchronization.
- Follow the existing TypeScript strict settings, workspace scripts, formatting, and naming patterns. Keep the lockfile in sync when package changes are authorized.
- Follow the active task's instructions about tests and verification. Report the exact checks actually run and their results; do not claim unperformed checks.

## Useful root commands

- `npm run dev:web` — start the Parcel frontend.
- `npm run dev:api` — start the Express API.
- `npm run build` — build configured workspaces.
- `npm run typecheck` — type-check configured workspaces.
- `npm test` — run configured workspace tests.
- `npm run lint` — lint application code.
- `npm run format:check` — check formatting.
