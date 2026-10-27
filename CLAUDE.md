# Claude Code project guidance

Before working in this repository, read [`AGENTS.md`](AGENTS.md). It contains the shared project rules, approved architecture, document precedence, user approval boundaries, unresolved design discrepancies, and current run commands. Follow it for all work here.

## Claude-specific working notes

- Inspect the current files and relevant `Docs/` references before proposing or making changes. Treat approved product and architecture documents as authoritative; call out conflicts instead of guessing.
- Work only on the phase or feature the user authorized. A plan review is not permission to implement. The initial scaffold exists; product features and Prisma schema work still need explicit authorization.
- Keep changes incremental and consistent with the npm workspaces structure. Use React + TypeScript + Parcel + Tailwind for the frontend and the TypeScript + Express modular monolith for the API. Never substitute Vite.
- Preserve the existing `Docs/` directory and approved design references. Add feature folders only when they are needed; shared contracts and infrastructure remain optional until justified.
- The wedding time-zone default is `Asia/Kolkata`, and the user chose custom session code. The guest-link retrieval, RSVP capacity, and structured wedding location mismatches remain open. Do not make database/schema decisions for them without user input.
- Do not add a placeholder Prisma schema or dependencies to bypass unresolved design decisions. Review the approved authentication design before implementing sessions or cookies.
- Protect tenant boundaries and authorization on the server. Keep secrets out of the repository, browser build, logs, and commits.
- Follow the active request about tests and verification, and report only checks actually performed.

Root development commands and the exact application layout are listed in [`README.md`](README.md).
