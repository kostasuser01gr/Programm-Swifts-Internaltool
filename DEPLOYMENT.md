# Deployment Guide

> **Zero-cost deployment**: Frontend on Vercel Hobby (free) + Backend on Cloudflare Workers Free.

---

## Prerequisites

- **Node.js 22+** and **pnpm**
- GitHub account with Actions enabled
- Cloudflare account (free tier)
- Vercel account (hobby tier, free)

---

## 1. Backend — Cloudflare Workers

### One-time setup

```bash
cd worker

# Install dependencies
pnpm install

# Authenticate with Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create dataos-db
# Output: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# → Update worker/wrangler.toml: database_id = "<paste here>"

# Create the KV namespace
npx wrangler kv namespace create KV
# Output: id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# → Update worker/wrangler.toml: id = "<paste here>"

# Run DB migrations
pnpm db:migrate:prod

# Seed sample data (optional)
pnpm db:seed:prod

# Deploy
pnpm deploy
```

The API is now live at `https://dataos-api.<account>.workers.dev`.

### Updating

```bash
cd worker
pnpm deploy
```

New migrations are applied via:
```bash
pnpm db:migrate:prod
```

---

## 2. Frontend — Vercel

### Option A: Vercel Dashboard

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Framework: **Vite** (auto-detected from `vercel.json`)
3. Add environment variable:
   - `VITE_API_URL` = `https://dataos-api.<account>.workers.dev`
4. Deploy

### Option B: CLI

```bash
npx vercel --prod
```

### Option C: GitHub Actions (automatic)

The CI pipeline deploys on every push to `main`. Set these GitHub Secrets:

| Secret                 | Description                               |
|------------------------|-------------------------------------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Workers + Pages)    |
| `CLOUDFLARE_ACCOUNT_ID`| Cloudflare account ID                     |
| `VERCEL_TOKEN`         | Vercel personal access token (optional)   |

---

## 3. Environment Variables

### Frontend (Vite)

| Variable       | Description           | Default |
|----------------|-----------------------|---------|
| `VITE_API_URL` | Worker API base URL   | `""`    |

### Worker (`wrangler.toml` vars)

| Variable        | Description                 | Default                     |
|-----------------|-----------------------------|-----------------------------|
| `CORS_ORIGIN`   | Allowed frontend origin     | `https://dataos.vercel.app` |
| `MAX_USERS`     | Max registered users        | `50`                        |
| `MAX_RECORDS_PER_TABLE` | Max records per table | `10000`                     |
| `MAX_TABLES_PER_BASE` | Max tables per base     | `20`                        |

---

## 4. Free Tier Limits

| Resource              | Free Limit      | Fail-Closed At |
|-----------------------|-----------------|----------------|
| D1 reads / day        | 5,000,000       | 4,000,000 (80%)|
| D1 writes / day       | 100,000         | 80,000 (80%)   |
| KV reads / day        | 100,000         | 80,000 (80%)   |
| Worker requests / day | ~100,000        | 90,000 (90%)   |
| D1 storage            | 5 GB            | —              |
| KV storage            | 1 GB            | —              |
| Vercel deploys        | Unlimited       | —              |
| Vercel bandwidth      | 100 GB / month  | —              |

The Worker automatically returns **503 Service Limit Reached** when approaching these limits to prevent unexpected charges.

---

## 5. CORS Configuration

Update `CORS_ORIGIN` in `worker/wrangler.toml` to match your frontend domain:

```toml
[vars]
CORS_ORIGIN = "https://your-app.vercel.app"
```

For local development, the Worker dev server accepts all origins by default.

---

## 6. Monitoring

- **Cloudflare Dashboard**: Workers → Analytics (requests, CPU time, errors)
- **Admin API**: `GET /api/admin/usage` returns real-time free-tier usage percentages
- **Audit Log**: `GET /api/admin/audit-log` for all mutations with user + IP
