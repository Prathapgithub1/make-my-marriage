# Make My Marriage

Make My Marriage is a modern wedding-planning SaaS platform engineered to help couples and their families collaboratively coordinate Indian weddings from a single source of truth.

The repository is built as an npm workspaces monorepo containing a high-performance React frontend and an Express modular-monolith REST API, completely written in TypeScript.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Security](#architecture--security)
- [Authentication Status](#authentication-status)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)
- [Documentation & References](#documentation--references)

---

## Overview

Planning an Indian wedding involves dozens of events, large families, hundreds of guests, vendors, budgets, invitations, and photos. Most families juggle fragmented spreadsheets, WhatsApp groups, notes, and physical paper.

Make My Marriage brings these disparate workflows into one collaborative workspace:

- **Centralized Wedding Workspace:** Bride, groom, family members, and trusted planners manage everything from one dashboard.
- **Multi-Event Coordination:** Dedicated management for Mehendi, Sangeet, Haldi, Wedding Ceremony, and Reception.
- **Frictionless Guest Experience:** Guests view itineraries, RSVP, and upload candid photos without burdensome authentication.
- **Data Privacy & Multi-Tenancy:** Each wedding acts as a strictly isolated tenant boundary with role-based access control (Admin, Manager).

---

## Tech Stack

### Frontend (`apps/web`)

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Parcel 2](https://parceljs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Server State & Caching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Testing:** [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/)

### Backend (`apps/api`)

- **Runtime:** [Node.js](https://nodejs.org/) (`>= 24.16.x`)
- **Server Framework:** [Express 5](https://expressjs.com/) (Modular Monolith)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) via [Prisma 7](https://www.prisma.io/) with [`@prisma/adapter-pg`](https://www.npmjs.com/package/@prisma/adapter-pg) connection pooling
- **Security & Hashing:** [Argon2id](https://github.com/ranisalt/node-argon2) for password hashing, cryptographically secure opaque token generators
- **Logging & Diagnostics:** [Pino](https://getpino.io/) + `pino-http` structured JSON logger
- **Email Delivery:** [Resend](https://resend.com/) transactional API with a zero-dependency local terminal console fallback for development (`createConsoleMailer`)
- **API Documentation:** Interactive [Swagger UI](https://swagger.io/tools/swagger-ui/) and raw [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) endpoint

### Root Tooling

- **Package Manager:** npm workspaces (`npm@11.13.x`)
- **Code Quality:** [ESLint 10](https://eslint.org/) (Flat Config) + [Prettier 3](https://prettier.io/)

---

## Architecture & Security

### Backend Security Principles

1. **Stateful PostgreSQL Sessions:**
   - Sessions are stored in the `sessions` table in PostgreSQL.
   - The browser receives an opaque session identifier inside an `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie (`mmm_session`).
   - Only the SHA-256 hash of the session token is persisted in the database; raw session tokens are never stored.
   - Sessions have an absolute 7-day time-to-live (`SESSION_TTL_MS`).
2. **CSRF Protection:**
   - Enforces a signed double-submit cookie pattern (`mmm_csrf` cookie + `X-CSRF-Token` header) alongside strict `Origin` and `Referer` validation for all mutating operations (`POST`, `PUT`, `PATCH`, `DELETE`).
3. **Password Security:**
   - Argon2id password hashing with constant-time dummy verification when an account is not found, preventing user enumeration through timing attacks.
   - Password reset links expire in 30 minutes, are single-use, pass the token in the URL hash fragment (`#token=...`) to avoid browser referrer leakage, and automatically revoke all active sessions upon password change.
4. **Sliding-Window Rate Limiting:**
   - Atomic sliding-window rate limits stored in the `auth_rate_limits` PostgreSQL table using raw SQL upserts (`ON CONFLICT (key) DO UPDATE`).
   - Automatically throttles login, signup, forgot-password, and reset-password attempts by hashed IP keys.
5. **Safe Logging & Diagnostics:**
   - Passwords, reset tokens, session tokens, email addresses, and third-party response bodies are never logged. Every request is assigned a unique `X-Request-Id`.

---

## Authentication Status

The V1 Authentication foundation is implemented and covered by unit, integration, and end-to-end route tests:

| Flow / Endpoint          | Method | Route                          | Description                                                                                                                               |
| ------------------------ | ------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **CSRF Token**           | `GET`  | `/api/v1/auth/csrf`            | Issues a signed CSRF token and sets the `mmm_csrf` cookie                                                                                 |
| **Sign Up**              | `POST` | `/api/v1/auth/signup`          | Validates name, email, and 12+ character password; creates user and session; returns HTTP 201                                             |
| **Sign In**              | `POST` | `/api/v1/auth/login`           | Authenticates credentials with Argon2id; sets secure session cookie; returns user profile                                                 |
| **Session Restoration**  | `GET`  | `/api/v1/auth/me`              | Validates session cookie against PostgreSQL; returns authenticated user and wedding membership state                                      |
| **Sign Out**             | `POST` | `/api/v1/auth/logout`          | Revokes the active session in PostgreSQL and clears cookies                                                                               |
| **Forgot Password**      | `POST` | `/api/v1/auth/forgot-password` | Returns generic HTTP 202 to prevent user enumeration; generates 30-min token and sends reset link via Resend (or terminal console in dev) |
| **Reset Password**       | `POST` | `/api/v1/auth/reset-password`  | Validates single-use token, updates password, and revokes all active sessions                                                             |
| **Protected Navigation** | UI     | `/wedding/setup`, `/dashboard` | Client-side route guards redirect unauthenticated users to `/login`                                                                       |

---

## Repository Structure

```text
make-my-marriage/
├── apps/
│   ├── web/                     # React 19 + Parcel frontend
│   │   ├── src/
│   │   │   ├── app/             # Router, providers, and main App entry
│   │   │   ├── features/
│   │   │   │   ├── auth/        # Auth pages, forms, hooks, and schemas
│   │   │   │   └── home/        # Marketing homepage sections & illustrations
│   │   │   ├── lib/             # API client, HTTP error handling
│   │   │   └── styles/          # Tailwind CSS configuration and design tokens
│   │   └── tests/               # Frontend Jest + Testing Library test suites
│   └── api/                     # Express 5 backend modular monolith
│       ├── src/
│       │   ├── config/          # Environment configuration, logger
│       │   ├── infrastructure/  # PostgreSQL pool and Prisma client setup
│       │   ├── middleware/      # CORS, helmet, error handling
│       │   ├── modules/
│       │   │   ├── auth/        # Auth routes, schemas, security, and service
│       │   │   ├── docs/        # OpenAPI specification and Swagger UI routes
│       │   │   └── health/      # Liveness and database health endpoints
│       │   └── server.ts        # Server entry point
│       └── tests/               # API route, auth, docs, and health Jest tests
├── prisma/                      # Prisma 7 schema and migration history
│   ├── migrations/              # Incremental SQL migrations
│   └── schema.prisma            # Database models (User, Session, ResetToken, etc.)
├── scripts/                     # Developer utility scripts (DB inspection, QA)
└── Docs/                        # Approved PRD, Architecture, and API specifications
```

---

## Getting Started

### Prerequisites

- **Node.js:** `>= 24.16.0 < 25` (recommended: use `nvm` with `.nvmrc`)
- **npm:** `11.13.0`
- **PostgreSQL:** Local PostgreSQL 14+ instance running

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Prathapgithub1/make-my-marriage.git
cd make-my-marriage
npm ci
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

Generate secure random secrets for `SESSION_SECRET` and `CSRF_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Update your `.env` file with your local PostgreSQL connection string and generated secrets:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/makeMyMarriage?schema=public
SESSION_SECRET=your-generated-session-secret-at-least-32-chars
CSRF_SECRET=your-generated-csrf-secret-at-least-32-chars
```

### 3. Generate Prisma Client & Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

### 4. Start Development Servers

Run the frontend and backend in separate terminal windows:

```bash
# Terminal 1: Start Express API (runs on port 3104)
npm run dev:api

# Terminal 2: Start Parcel Frontend (runs on port 1234)
npm run dev:web
```

- **Frontend App:** [http://localhost:1234](http://localhost:1234)
- **API Health Check:** [http://localhost:3104/api/v1/health](http://localhost:3104/api/v1/health)
- **Interactive Swagger Docs:** [http://localhost:3104/api-docs](http://localhost:3104/api-docs)

---

## Environment Variables

| Variable         | Required | Default                        | Description                                                                        |
| ---------------- | -------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | —                              | PostgreSQL connection URL with schema parameter                                    |
| `PORT`           | No       | `3104`                         | Port number for Express API server                                                 |
| `API_PORT`       | No       | `3104`                         | Alternative port override for Express server                                       |
| `LOG_LEVEL`      | No       | `info`                         | Logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`)   |
| `WEB_ORIGIN`     | No       | `http://localhost:1234`        | Allowed CORS and CSRF frontend origin                                              |
| `API_BASE_URL`   | No       | `http://localhost:3104/api/v1` | Base URL used by the web application to contact the API                            |
| `SESSION_SECRET` | Yes      | —                              | Cryptographic secret for signing session identifiers (minimum 32 characters)       |
| `CSRF_SECRET`    | Yes      | —                              | Cryptographic secret for signing double-submit CSRF tokens (minimum 32 characters) |
| `RESEND_API_KEY` | Optional | —                              | API key for transactional emails via [Resend](https://resend.com)                  |
| `EMAIL_FROM`     | Optional | `onboarding@resend.dev`        | Verified sender address for transactional emails                                   |
| `APP_BASE_URL`   | No       | `http://localhost:1234`        | Public frontend URL used to construct password reset links                         |
| `AUTH_DEMO_MODE` | No       | `false`                        | When `true`, frontend signup displays client demo feedback without contacting API  |

> **Note:** In local development without Resend credentials configured, password reset links are automatically printed to the API terminal console via `createConsoleMailer`.

---

## Available Commands

Execute these commands from the monorepo root:

| Command                      | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `npm run dev:web`            | Starts the Parcel development server with HMR at `http://localhost:1234` |
| `npm run dev:api`            | Regenerates Prisma Client and starts the Express API with `nodemon`      |
| `npm run prisma:generate`    | Generates the Prisma 7 client into `apps/api/src/generated/prisma`       |
| `npm run prisma:migrate:dev` | Runs incremental Prisma migrations on the development database           |
| `npm run build`              | Builds configured workspace packages for production                      |
| `npm run typecheck`          | Runs TypeScript type-checks across both web and api workspaces           |
| `npm test`                   | Runs all Jest test suites across the monorepo                            |
| `npm run lint`               | Lints frontend and backend source files using ESLint                     |
| `npm run format`             | Automatically formats all codebase files using Prettier                  |
| `npm run format:check`       | Verifies code formatting against Prettier rules                          |

---

## API Documentation

The Express backend features built-in OpenAPI documentation:

- **Interactive Swagger UI:** Accessible in development at [http://localhost:3104/api-docs](http://localhost:3104/api-docs).
- **OpenAPI 3.0 Specification:** Served directly as JSON at [http://localhost:3104/api-docs/openapi.json](http://localhost:3104/api-docs/openapi.json).

_Tip:_ When testing authenticated endpoints in Swagger UI, execute `GET /api/v1/auth/csrf` first. The Swagger UI client will automatically capture the CSRF cookie and include the `X-CSRF-Token` header on subsequent requests.

---

## Roadmap

- [x] **Monorepo Foundation:** Workspaces, TypeScript configuration, Parcel, Tailwind CSS, Jest, ESLint, Prettier.
- [x] **Public Marketing Homepage:** Responsive wedding planning landing page with illustrations, feature highlights, and FAQs.
- [x] **V1 Authentication:** Email/password signup, login, session restoration, logout, password reset, rate limiting, and CSRF protection.
- [ ] **Wedding Setup & Multi-Tenancy:** Onboarding flow to create bride & groom profiles, wedding dates, and venue details.
- [ ] **Multi-Event Timeline:** Schedule management for Mehendi, Sangeet, Haldi, Wedding, and Reception.
- [ ] **Guest & Invitation Management:** Guest list import, group categorization, RSVP limits, and digital invitation links.
- [ ] **Budget & Expense Tracking:** Expense logging, vendor allocations, and payment tracking.
- [ ] **Vendor Directory:** Contracts, quotes, and payment milestones.
- [ ] **Shared Media Gallery:** Amazon S3 presigned guest photo uploads and gallery curation.

---

## Documentation & References

Approved product and technical architecture specifications reside in [`Docs/`](Docs/):

- [`Product Requirements Document (PRD V1)`](<Docs/Product Requirements Document (PRD V1).md>)
- [`System Design & Architecture`](Docs/System_Design_Architecture.md)
- [`Database Design V1`](Docs/Database_Design_V1.md)
- [`REST API Design V1`](<Docs/REST API Design V1.md>)
- [`Project Milestone Status Log`](Docs/PROJECT_STATUS.md)

---

## License

Private and proprietary. All rights reserved.
