# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ryder Cup Par00 — a golf tournament match play scoring app with real-time score entry, leaderboard tracking, spectator links, player invitations, and a betting system. Currency is Colombian Pesos (COP). Mobile-first PWA design.

## Monorepo Structure

npm workspaces with three packages:
- **`packages/api`** — Fastify v4 REST API (TypeScript, PostgreSQL)
- **`packages/web`** — Next.js 14 App Router frontend (React 18, Tailwind CSS v3.4)
- **`packages/shared`** — Shared TypeScript type definitions (no runtime deps)

## Common Commands

### Root
```bash
npm run dev          # Start API in dev mode (ts-node-dev --respawn)
npm run build        # Build all workspaces
npm run test         # Run tests across all workspaces
npm run test:watch   # Tests in watch mode
```

### API (`packages/api`)
```bash
npm run dev          # ts-node-dev --respawn --transpile-only src/index.ts
npm run build        # tsc
npm run test         # vitest run --no-threads
npm run test:watch   # vitest (interactive)
npm run migrate      # ts-node src/scripts/migrate.ts
npm run seed         # ts-node scripts/seed-tournament.ts
```

### Web (`packages/web`)
```bash
npm run dev          # next dev
npm run build        # next build
npm run lint         # next lint
```

### Running a single API test
```bash
cd packages/api && npx vitest run tests/path/to/test.ts --no-threads
```

## Architecture

### API Layered Pattern
`Routes → Services → Repositories → PostgreSQL`

- **Routes** (`src/routes/`) — HTTP handlers, request validation, auth middleware
- **Services** (`src/services/`) — Business logic
- **Repositories** (`src/repositories/`) — Raw SQL queries via `pg` Pool
- **Scoring Engine** (`src/scoring/`) — Match play calculations: handicap, stroke allocation, net scores, match status, point allocation. Supports singles (1v1), fourball (2v2 best ball), and scramble (team)
- **Middleware** (`src/middleware/`) — JWT auth verification, role-based access (`requireOrganizer`, `requireFlightAccess`)

API starts in `src/index.ts` → builds app from `src/app.ts` → runs migrations on startup → listens.

### Web App Structure
- **Pages** use Next.js App Router (`src/app/`)
- **State** via React Context: `AuthProvider`, `SyncProvider`, `EventProvider` (no external state library)
- **Data fetching** via custom hooks in `src/hooks/` using manual fetch/refetch patterns
- **API client** singleton in `src/lib/api.ts` (fetch-based, Bearer token from localStorage)
- **Offline support**: IndexedDB (`src/lib/db.ts`) queues scores offline, `SyncService` (`src/lib/sync.ts`) auto-syncs on reconnect. Mutation IDs ensure idempotent score submissions.
- **Path alias**: `@/*` maps to `./src/*`

### Key Domain Concepts
- **Events** — tournaments with members, courses, flights
- **Flights** — groups of 4 players playing together
- **Segments** — front 9 (individual play) and back 9 (scramble)
- **Teams** — Red vs Blue (CSS vars: `--team-red`, `--team-blue`)
- **Match play scoring** — not stroke play; points from head-to-head match results
- **Spectator tokens** — public read-only leaderboard access without auth

## Database

PostgreSQL via `pg` Pool. Migrations are SQL files in `packages/api/migrations/` (001-011), run via `postgres-migrations`. Migrations run automatically on API startup.

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `DATABASE_URL_TEST` — Test database (used when `NODE_ENV=test`)
- `JWT_SECRET` — JWT signing key (defaults to `'supersecret'` in dev)
- `NEXT_PUBLIC_API_URL` — API URL for the web frontend

## Testing

API tests in `packages/api/tests/` (29 test files) use Vitest + Fastify `inject()` for in-memory HTTP testing. Tests require a running PostgreSQL instance with `DATABASE_URL_TEST`. No web component tests yet.

## Deployment

Google Cloud Run via `cloudbuild.yaml`. Docker images built with Node 20 Alpine. API exposes port 3002, Web (standalone Next.js) exposes port 3000.

## TypeScript

All packages use strict mode. API targets ES2020/CommonJS. Web targets ESNext/bundler. Shared targets ES2020/CommonJS.
