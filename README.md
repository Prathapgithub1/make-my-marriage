# Make My Marriage

Make My Marriage is a wedding-planning SaaS application. This repository is an npm workspaces monorepo with a React frontend and an Express API, written in TypeScript.

## Current status

The repository contains the initial application foundation: a Parcel-served React page, shared frontend providers and routing, an Express API with a health endpoint, and development tooling. Product features and database integration are not implemented yet. The approved product and architecture references are in [`Docs/`](Docs/).

## Requirements

- Node.js `24.16.x`
- npm `11.13.x`

The required Node version is recorded in [`.nvmrc`](.nvmrc), and npm workspaces are defined in [`package.json`](package.json).

## Getting started

Install the locked dependencies from the repository root:

```bash
npm ci
```

Start the frontend and API in separate terminals from the repository root:

```bash
npm run dev:web
```

```bash
npm run dev:api
```

Open the frontend at [http://localhost:1234](http://localhost:1234). The API health endpoint is [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health).

The API uses local defaults and does not require production credentials. To override its settings, copy [`.env.example`](.env.example) to `.env` in the repository root and edit the values. Never commit `.env` or put secrets in frontend environment variables.

## Useful commands

Run these from the repository root:

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev:web`      | Start the Parcel frontend development server     |
| `npm run dev:api`      | Start the Express API in watch mode              |
| `npm run build`        | Build each workspace that defines a build script |
| `npm run typecheck`    | Type-check the frontend and API                  |
| `npm test`             | Run workspace tests                              |
| `npm run lint`         | Lint application code                            |
| `npm run format`       | Format supported files                           |
| `npm run format:check` | Check formatting without changing files          |

## Repository layout

```text
apps/
  web/       React, TypeScript, Parcel, and Tailwind CSS frontend
  api/       Express, TypeScript modular-monolith API
prisma/      Reserved for the approved root Prisma schema and migrations
packages/    Reserved for shared packages when a concrete need is established
infrastructure/  Deployment configuration, added when implementation requires it
scripts/     Project automation, added when needed
Docs/        Approved product and architecture documents
```

Feature modules and infrastructure will be added incrementally in line with the approved documents. The Prisma schema and database dependencies remain deferred until the documented guest-link, RSVP-capacity, and wedding-location decisions are resolved.

## Approved references

- [Product Requirements Document](<Docs/Product Requirements Document (PRD V1).md>)
- [System Design and Architecture](Docs/System_Design_Architecture.md)
- [Database Design](Docs/Database_Design_V1.md)
- [REST API Design](<Docs/REST API Design V1.md>)
