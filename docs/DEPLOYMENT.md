# Deployment Guide

> **Zero-cost deployment**: Frontend on Vercel (free) · Backend on Cloudflare Workers (free).

## Architecture

```text
┌─────────────────────────┐       ┌──────────────────────────────┐
│  Vercel (Vite SPA)      │──────▶│  Cloudflare Workers (Hono)   │
│  /  → dist/index.html   │ REST  │  /api/*  → worker/           │
│  Static assets + CSP    │       │  D1 (SQLite) + KV (cache)    │
└─────────────────────────┘       └──────────────────────────────┘
```

**Canonical source layout:**

| Component | Path | Runtime |
|-----------|------|---------|
| Vite SPA (React) | `src/`, `index.html` | Vercel (static) |
| Worker API (Hono) | `worker/` | Cloudflare Workers |

> `apps/*` and `packages/*` are legacy/experimental and **not** part of the production deployment.

---

## Prerequisites

- **Node.js 22+** and **pnpm 9+**
- GitHub account with Actions enabled
- Cloudflare account (free tier)
- Vercel account (hobby tier, free)

---

## 1. Backend — Cloudflare Workers (`worker/`)

### One-time setup

```bash
cd worker

# Authenticate with Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create dataos-db
# → Copy the database_id into worker/wrangler.toml

# Create the KV namespace
npx wrangler kv namespace create KV
# → Copy the id into worker/wrangler.toml

# Run DB migrations
pnpm db:migrate:prod

# (Optional) Seed sample data
pnpm db:seed:prod

# Deploy
pnpm deploy
```

### Updating

```bash
cd worker
pnpm deploy           # redeploy code
pnpm db:migrate:prod  # apply new migrations
```

---

## 2. Frontend — Vercel

### Option A: Vercel Dashboard (recommended)

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `.` (repo root).
3. Framework: **Vite** (auto-detected).
4. Add environment variable:
   - `VITE_API_URL` = `https://dataos-api.<account>.workers.dev`
5. Deploy.

### Option B: GitHub Actions

The `deploy-vercel.yml` workflow deploys on push to `main` when secrets are set:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Personal access token from vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |

---

## 3. Worker deployment via GitHub Actions

The `deploy-workers.yml` workflow deploys on push to `main` when `worker/` files change:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from CF dashboard |

---

## 4. Environment Variables

### Frontend (Vite — root)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Worker API base URL | `""` |

### Worker (`worker/wrangler.toml` vars)

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed frontend origin | `https://dataos.vercel.app` |
| `MAX_USERS` | Max registered users | `50` |
| `MAX_RECORDS_PER_TABLE` | Max records per table | `10000` |
| `MAX_TABLES_PER_BASE` | Max tables per base | `20` |
| `SESSION_TTL_SECONDS` | Session lifetime | `86400` |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Global rate limit | `60` |

---

## 5. Free Tier Limits

| Resource | Free Limit |
|----------|-----------|
| D1 reads / day | 5,000,000 |
| D1 writes / day | 100,000 |
| KV reads / day | 100,000 |
| Worker requests / day | ~100,000 |
| D1 storage | 5 GB |
| Vercel bandwidth | 100 GB / month |

The Worker returns **503** when Cloudflare enforces D1 quota limits.

---

## 6. Monitoring

- **Cloudflare Dashboard** → Workers → Analytics (requests, CPU, errors).
- **Admin API**: `GET /api/admin/usage` — usage summary.
- **Audit Log**: `GET /api/admin/audit-log` — all mutations with user + IP.
