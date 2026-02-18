# Deployment Guide

> **Zero-cost production stack**: Vercel Hobby (free) + Cloudflare Workers Free.
> No credit-card-required services. No surprise billing.

---

## Architecture

```
Browser  ──HTTPS──►  Vercel (Frontend)
  │                  Vite SPA + CDN (dist/)
  │
  │  API calls
  ▼
Cloudflare Workers (Hono REST API)
  ├── D1 (SQLite database)
  └── KV (rate limiting & cache)
```

| Layer | Technology | Free-tier limit |
|-------|-----------|-----------------|
| Frontend | Vercel Hobby | 100 GB bandwidth/mo, unlimited deploys |
| Backend | Cloudflare Workers | 100K req/day, 10 ms CPU |
| Database | Cloudflare D1 | 5M reads + 100K writes/day |
| Cache | Cloudflare KV | 100K reads + 1K writes/day |
| CI | GitHub Actions | 2,000 min/month |

---

## 1. Frontend — Vercel (Recommended: Git Integration)

This is the simplest approach — Vercel handles everything automatically.

### Setup (one-time)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import Git Repository** and select `kostasuser01gr/Programm-Swifts-Internaltool`.
3. Vercel auto-detects:
   - **Framework**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install --frozen-lockfile`
4. Add environment variables:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `VITE_API_URL` | `https://internaltoolkit-api.<account>.workers.dev` | Yes |

5. Set **Production Branch** = `main`.
6. Click **Deploy**.

### What happens automatically

| Event | Vercel behavior |
|-------|----------------|
| Push to `main` | **Production deploy** at `https://<project>.vercel.app` |
| Push to any other branch | **Preview deploy** with unique URL |
| Open/update a PR | **Preview deploy** + status check on the PR |

No GitHub Actions workflow needed — Vercel Git integration handles it all.

### SPA Deep-link Routing

The `vercel.json` at the repo root includes rewrites so React Router paths do not 404:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets|icons|manifest.json|sw.js|_headers|_redirects).*)",
      "destination": "/index.html"
    }
  ]
}
```

Already committed. No action required.

---

## 2. Frontend — Vercel (Optional: GitHub Actions + Vercel CLI)

Use this **only if** you cannot or do not want the Vercel Git Integration.

### Required GitHub Secrets

| Secret | How to get it |
|--------|--------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Run `vercel link` locally, then check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same file as above |

Add in **GitHub repo Settings > Secrets and variables > Actions**.

### Workflow

The file `.github/workflows/deploy-vercel.yml` runs on push to `main`:

1. Installs deps with pnpm.
2. Pulls Vercel env (`vercel pull`).
3. Builds with Vercel CLI (`vercel build --prod`).
4. Deploys prebuilt output (`vercel deploy --prebuilt --prod`).

The workflow only runs when all three secrets are set. Otherwise it is a no-op.

---

## 3. Backend — Cloudflare Workers (Free)

### Initial setup

```bash
cd worker

# Authenticate
npx wrangler login

# Create D1 database (if not already created)
npx wrangler d1 create dataos-db
# Copy database_id into worker/wrangler.toml

# Create KV namespace
npx wrangler kv namespace create KV
# Copy namespace id into worker/wrangler.toml

# Run database migrations
pnpm db:migrate:prod

# Deploy
pnpm deploy
```

The API is live at `https://internaltoolkit-api.<account>.workers.dev`.

### Automatic deploys via CI

The CI workflow (`.github/workflows/ci.yml`) deploys the worker on every push to `main`, but **only if** these secrets exist:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_WORKERS_TOKEN` | Cloudflare API token (Workers scope) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

If missing, the deploy step is skipped silently.

### Fail-closed safety

The API enforces limits at **80%** of free-tier capacity and returns `503 Service Limit Reached` — never overruns the free tier.

---

## 4. Cloudflare Pages (Alternative Frontend)

If you prefer Cloudflare Pages over Vercel:

### Option A: Git Integration

1. Cloudflare Dashboard > Workers and Pages > Create > Pages > Connect to Git.
2. Select the GitHub repo.
3. Settings: Build command `pnpm build`, output `dist`, root `/`.
4. Add env variable: `VITE_API_URL` = your worker URL.

### Option B: GitHub Actions

```yaml
# .github/workflows/deploy-cloudflare-pages.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ${{ secrets.CLOUDFLARE_PAGES_PROJECT_NAME }}
          directory: dist
```

Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_NAME`.

---

## 5. CI Pipeline

The GitHub Actions CI (`.github/workflows/ci.yml`) runs on every PR and push to `main`:

| Job | What | Blocks merge? |
|-----|------|:---:|
| **Lint** | ESLint on root SPA | Yes |
| **Type Check** | tsc on root + worker + apps/web | Yes |
| **Tests** | Vitest (103 tests) | Yes |
| **Build** | `vite build` producing `dist/` + artifact upload | Yes |
| **Deploy Worker** | Wrangler deploy (main only, if secrets set) | No |

### Making CI a required check

1. **GitHub repo Settings > Branches > Branch protection rules** > Add rule for `main`.
2. Enable **Require status checks to pass before merging**.
3. Select: `Lint`, `Type Check`, `Tests`, `Build`.
4. Enable **Require branches to be up to date before merging**.

Quick CLI:

```bash
gh api -X PUT -H "Accept: application/vnd.github+json" \
  /repos/kostasuser01gr/Programm-Swifts-Internaltool/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[contexts][]=Lint' \
  -f 'required_status_checks[contexts][]=Type Check' \
  -f 'required_status_checks[contexts][]=Tests' \
  -f 'required_status_checks[contexts][]=Build' \
  -f enforce_admins=true \
  -f restrictions=
```

---

## 6. Environment Variables

### Frontend (Vite)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `""` | Worker API base URL. Unset = demo/mock mode. |

### Backend (wrangler.toml vars)

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `production` | Runtime environment |
| `ALLOWED_ORIGINS` | `https://dataos.vercel.app` | CORS allowed origins |
| `MAX_USERS` | `50` | Max registered users |
| `MAX_RECORDS_PER_TABLE` | `10000` | Record cap per table |

---

## 7. Secrets Summary

**Never commit these. Use provider dashboards or GitHub Secrets only.**

| Secret | Where | Used by |
|--------|-------|---------|
| `CLOUDFLARE_WORKERS_TOKEN` | GitHub Secrets | CI deploy worker |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | CI deploy worker |
| `VERCEL_TOKEN` | GitHub Secrets | Optional Vercel CLI deploy |
| `VERCEL_ORG_ID` | GitHub Secrets | Optional Vercel CLI deploy |
| `VERCEL_PROJECT_ID` | GitHub Secrets | Optional Vercel CLI deploy |
| `VITE_API_URL` | Vercel Project Settings | Build-time env var |

---

## 8. Docker (Local / Self-hosted)

```bash
docker build -t dataos .
docker run -p 8080:80 dataos
```

Multi-stage: Node 22 build then Nginx Alpine (~25 MB). Config: `docker/nginx.conf`.

---

## 9. Rollback

**Vercel**: Dashboard > Deployments > select previous > Promote to Production.
**Worker**: `cd worker && npx wrangler rollback`

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| SPA routes 404 | Rewrites missing | Already in `vercel.json` — redeploy |
| `503 Service Limit Reached` | Daily free-tier limit hit | Wait for UTC midnight |
| CORS errors | `ALLOWED_ORIGINS` mismatch | Update `worker/wrangler.toml` |
| Worker deploy skipped | Secrets not set | Add CF secrets to GitHub |

---

*See also: [COST_SAFETY.md](COST_SAFETY.md) and [SECURITY.md](../SECURITY.md)*
