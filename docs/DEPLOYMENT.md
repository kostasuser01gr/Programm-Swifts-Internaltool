# DataOS — Deployment Guide

> Zero-cost production deployment on Vercel (Hobby) + Cloudflare Workers (Free).

---

## Architecture Overview

```
┌──────────────┐        HTTPS         ┌──────────────────────┐
│   Browser    │ ◄──────────────────► │  Vercel (Frontend)   │
│              │                      │  React SPA + CDN     │
└──────────────┘                      └──────────────────────┘
       │                                        │
       │  API calls                             │
       ▼                                        │
┌──────────────────────┐                        │
│ Cloudflare Workers   │ ◄──────────────────────┘
│ (Hono REST API)      │        VITE_API_URL
│ ┌──────┐ ┌────────┐  │
│ │  D1  │ │   KV   │  │
│ │(SQL) │ │(cache) │  │
│ └──────┘ └────────┘  │
└──────────────────────┘
```

---

## 1. Frontend → Vercel Hobby (Free)

### Via Dashboard

1. Push code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo.
3. **Framework Preset**: Vite (auto-detected).
4. **Build Command**: `pnpm build` (auto-detected).
5. **Output Directory**: `dist` (auto-detected).
6. **Environment Variables**:
   | Variable | Value | Required |
   |----------|-------|----------|
   | `VITE_API_URL` | `https://dataos-api.<account>.workers.dev` | Yes (for API mode) |
7. Click **Deploy**.

Your app will be live at `https://<project>.vercel.app`.

### Via CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod

# Set env var
vercel env add VITE_API_URL production
# Enter: https://dataos-api.<account>.workers.dev
```

### SPA Routing

The `public/_redirects` file handles SPA fallback:

```
/*    /index.html   200
```

Vercel also supports `vercel.json` rewrites if needed:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Free Tier Limits (Vercel Hobby)

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Builds | 6,000 minutes/month |
| Serverless Functions | 100 GB-hrs/month |
| Custom Domains | Unlimited |
| HTTPS | Auto (Let's Encrypt) |
| Preview Deployments | Unlimited |

---

## 2. Backend → Cloudflare Workers (Free)

### Initial Setup

```bash
cd worker

# Install Wrangler CLI (included in devDependencies)
pnpm install

# Login to Cloudflare
npx wrangler login
```

### Create Resources

```bash
# Create D1 database
npx wrangler d1 create dataos-db
# ➜ Copy the database_id into wrangler.toml

# Create KV namespace (production)
npx wrangler kv namespace create KV
# ➜ Copy the namespace id into wrangler.toml

# Create KV namespace (preview/dev)
npx wrangler kv namespace create KV --preview
# ➜ Copy the preview_id into wrangler.toml
```

### Configure `wrangler.toml`

```toml
name = "dataos-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "dataos-db"
database_id = "<YOUR_DATABASE_ID>"

[[kv_namespaces]]
binding = "KV"
id = "<YOUR_KV_NAMESPACE_ID>"
preview_id = "<YOUR_KV_PREVIEW_ID>"
```

### Run Migrations & Seed

```bash
# Local development
pnpm db:migrate        # Apply schema to local D1
pnpm db:seed           # Insert sample data

# Production
pnpm db:migrate:prod   # Apply schema to remote D1
pnpm db:seed:prod      # Insert sample data
```

### Deploy

```bash
# Development (local)
pnpm dev               # Starts wrangler dev server at localhost:8787

# Production
pnpm deploy            # Deploys to https://dataos-api.<account>.workers.dev
```

### Free Tier Limits (Workers Free)

| Resource | Limit |
|----------|-------|
| Requests | 100,000/day |
| CPU time | 10ms/invocation |
| D1 reads | 5,000,000/day |
| D1 writes | 100,000/day |
| D1 storage | 5 GB |
| KV reads | 100,000/day |
| KV writes | 1,000/day |
| KV storage | 1 GB |

### Fail-Closed Safety

The backend enforces **fail-closed** limits at **80%** of free-tier capacity:

- At 80% of daily D1 reads/writes → API returns `503 Service Limit Reached`
- Usage tracked via KV counters, exposed at `GET /api/admin/usage`
- See `docs/COST_SAFETY.md` for the full safety checklist

---

## 3. Docker (Local / Self-hosted)

For local development or self-hosting without Vercel/Cloudflare:

```bash
# Build the frontend image
docker build -t dataos .

# Run
docker run -p 8080:80 dataos
# Open http://localhost:8080
```

The `Dockerfile` uses multi-stage builds:
1. **Stage 1**: Node 22 — `pnpm install && pnpm build`
2. **Stage 2**: Nginx Alpine (~25 MB) — serves `dist/` with gzip + security headers

Configuration: `docker/nginx.conf`

### Docker Compose (Full Stack)

```bash
docker compose up -d
```

This starts:
- Frontend (Nginx) on port 8080
- Backend proxied from the Cloudflare Worker URL (set `VITE_API_URL`)

---

## 4. CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

The pipeline runs automatically on push to `main` and on PRs:

| Job | What it does |
|-----|-------------|
| `lint` | ESLint 9 (flat config) |
| `typecheck` | `tsc --noEmit` |
| `audit` | `pnpm audit --audit-level=moderate` |
| `test` | Vitest (103 tests) |
| `build` | `vite build` + artifact upload |
| `deploy-frontend` | Cloudflare Pages deploy (main only) |
| `deploy-worker` | Wrangler deploy (main only) |

### Required Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `CLOUDFLARE_API_TOKEN` | GitHub repo secrets | Workers + Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub repo secrets | Cloudflare account |
| `VERCEL_TOKEN` | GitHub repo secrets | (Optional) Vercel CLI deploy |

### CodeQL Security Scanning

Runs via `.github/workflows/codeql.yml`:
- **Trigger**: PRs to `main` + weekly (Monday 03:00 UTC)
- **Languages**: JavaScript/TypeScript, Python
- **Copilot Autofix**: Auto-suggests patches for alerts

---

## 5. Environment Variables

### Frontend (Vite)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | — | Worker API base URL. If unset, app runs in demo/mock mode. |

### Backend (Wrangler)

| Binding | Type | Description |
|---------|------|-------------|
| `DB` | D1 | SQLite database |
| `KV` | KV | Rate limiting + cache |
| `ENVIRONMENT` | Var | `production` or `development` |

---

## 6. Custom Domain (Optional)

### Vercel

```bash
vercel domains add yourdomain.com
# Add CNAME: yourdomain.com → cname.vercel-dns.com
```

### Cloudflare Workers

```bash
# In Cloudflare Dashboard:
# Workers & Pages → dataos-api → Settings → Triggers → Custom Domains
# Add: api.yourdomain.com
```

---

## 7. Monitoring

### Cloudflare Analytics (Free)

- **Workers Analytics**: Request count, CPU time, errors — built-in.
- **D1 Analytics**: Read/write counts, storage — built-in.

### Application-Level

- `GET /api/admin/usage` — Returns daily D1/KV usage vs. limits
- `GET /api/admin/stats` — System statistics (users, records, workspaces)
- Sentry integration available via Sentry Copilot extension (see README)

---

## 8. Rollback

### Vercel

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

### Cloudflare Workers

```bash
# Rollback to previous version
npx wrangler rollback

# Or deploy a specific commit
git checkout <commit-sha>
cd worker && pnpm deploy
```

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| App loads but shows PIN login | `VITE_API_URL` not set | Set env var and redeploy |
| `503 Service Limit Reached` | D1/KV daily limit hit | Wait for reset (midnight UTC) or upgrade |
| CORS errors | Worker URL mismatch | Check `VITE_API_URL` matches actual Worker URL |
| Build fails on Vercel | Node version | Ensure `engines.node` is `>=18` in package.json |
| Worker deploy fails | Auth | Run `npx wrangler login` and verify API token scopes |

---

*See also: [COST_SAFETY.md](COST_SAFETY.md) for free-tier guardrails, [ARCHITECTURE.md](../ARCHITECTURE.md) for system design.*
