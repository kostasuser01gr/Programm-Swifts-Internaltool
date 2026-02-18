# DataOS V2

> Enterprise Data Platform — Next.js 15 + Hono on Cloudflare Workers

## Architecture

| Layer | Tech | Package |
|-------|------|---------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui | `apps/web` |
| API | Hono 4, Cloudflare Workers, D1, KV | `apps/api` |
| Shared | TypeScript + Zod schemas | `packages/shared` |

See [ADR-001](docs/adr/ADR-001-architecture.md) for rationale.

## Quick Start

```bash
# Prerequisites: Node ≥ 22, pnpm ≥ 10
cp .env.example .env
pnpm install
pnpm -r dev          # starts web + api in parallel
```

| Script | What it does |
|--------|-------------|
| `pnpm -r dev` | Start all apps in dev mode |
| `pnpm -r lint` | ESLint across all packages |
| `pnpm -r typecheck` | TypeScript strict check |
| `pnpm -r test` | Vitest across all packages |
| `pnpm -r build` | Production builds |

## Project Structure

```
v2/
├── apps/
│   ├── api/           # Hono API on CF Workers
│   │   ├── src/
│   │   │   ├── routes/       # auth, workspaces, tables
│   │   │   ├── middleware/   # auth, RBAC, rate-limit
│   │   │   ├── utils/        # crypto, rbac helpers
│   │   │   └── db/           # D1 migrations
│   │   └── wrangler.toml
│   └── web/           # Next.js 15 frontend
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/   # UI + feature components
│           └── lib/          # API client, utils
├── packages/
│   └── shared/        # Types + Zod schemas
└── docs/
    └── adr/           # Architecture Decision Records
```

## Vertical Slice

The V2 delivers a complete path through the app:

1. **Login** → POST `/api/auth/login` → session cookie
2. **Workspaces list** → GET `/api/workspaces` → workspace cards
3. **Workspace detail** → shows tables for the default base
4. **Table detail** → records grid with create/edit/delete (RBAC-gated)

## Auth Model

Cookie-first authentication. See [ADR-002](docs/adr/ADR-002-auth-model.md).

- `HttpOnly`, `SameSite=Lax` session cookies
- No tokens in `localStorage` in production
- Bearer tokens for programmatic API access
- CSRF protection via `Content-Type` enforcement

## RBAC

Workspace membership with three roles. See [ADR-003](docs/adr/ADR-003-rbac-model.md).

| Role | Read | Write | Delete workspace |
|------|------|-------|-----------------|
| viewer | yes | no | no |
| editor | yes | yes | no |
| owner | yes | yes | yes |

Anti-enumeration: non-members receive `404` (not `403`).

## Security

- PBKDF2-SHA256 (100K iterations) for passwords
- Per-IP rate limiting via KV
- Auth middleware on all `/api/*` routes (except login/register)
- Input validation with Zod on every endpoint

## CI/CD

| Workflow | Trigger | What |
|----------|---------|------|
| `v2-ci` | PR / push to main | lint → typecheck → test → build |
| `deploy-api` | push to main (api paths) | Deploy Worker to Cloudflare |
| `deploy-web` | push to main (web paths) | Build & deploy to Vercel |

## Migration from V1

See [docs/MIGRATION.md](docs/MIGRATION.md) for the incremental cutover plan.

## License

Private — all rights reserved.
