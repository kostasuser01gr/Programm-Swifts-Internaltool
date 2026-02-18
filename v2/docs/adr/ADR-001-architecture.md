# ADR-001: V2 Architecture — Next.js + Hono Monorepo

**Status:** Accepted  
**Date:** 2026-02-18  
**Deciders:** Lead Architect

## Context

The V1 codebase is a root-level Vite SPA (`src/`) with a Cloudflare Worker backend (`worker/`). There is also residual drift in `apps/` from an earlier monorepo experiment. V1 ships but has several structural problems:

- No server-side rendering; the SPA has limited SEO / first-paint capability.
- The Vite SPA uses `BrowserRouter` with lazy routes but no middleware layer for auth guards.
- The `worker/` directory is isolated from the frontend with no shared types.
- `apps/web` (Next.js) and `apps/api` exist but were never completed or connected.

## Decision

V2 adopts a **pnpm workspace monorepo** with three packages:

| Package | Tech | Purpose |
|---------|------|---------|
| `apps/web` | Next.js 15 (App Router) + Tailwind 4 + shadcn/ui | Server-rendered frontend with middleware-level auth |
| `apps/api` | Hono 4 on Cloudflare Workers + D1 + KV | REST API with RBAC |
| `packages/shared` | TypeScript + Zod | Shared types, validation schemas, API contract |

### Why Next.js over Vite SPA

1. **Auth middleware at the edge:** Next.js `middleware.ts` can check the session cookie and redirect unauthenticated users before the page loads. Vite SPA can only check client-side.
2. **Server Components:** Reduce JS shipped to the client for data-display pages (workspaces list, table grid).
3. **SEO / meta:** Proper `<head>` management for internal tools that may be shared via links.
4. **Incremental adoption:** V1 can coexist; V2 is in `v2/` folder until ready.

### Why keep Hono on CF Workers

1. Already proven in V1; D1/KV bindings work.
2. Zero cold-start on Cloudflare.
3. Hono's middleware model maps cleanly to our RBAC needs.

### Why shared package

1. API response types used by both web and api → single source of truth.
2. Zod schemas validate on both client (forms) and server (request bodies).
3. Avoids type drift between frontend and backend.

## Consequences

- V2 lives in `v2/` until migration is complete; V1 continues to work.
- `apps/` in the root is deprecated; V2's `v2/apps/` is canonical.
- Team must learn Next.js App Router patterns (RSC, `use client`, middleware).
