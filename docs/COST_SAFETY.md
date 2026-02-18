# Cost Safety Guide

> Every service in this stack runs on a **free tier**. This document lists what costs $0, what to avoid, and how to verify you are safe.

---

## Services Used (All Free)

| Service | Plan | Monthly cost | Key limits |
|---------|------|:---:|------------|
| **Vercel** | Hobby | $0 | 100 GB bandwidth, 100 deploys/day |
| **Cloudflare Workers** | Free | $0 | 100K req/day, 10 ms CPU |
| **Cloudflare D1** | Free | $0 | 5M reads + 100K writes/day |
| **Cloudflare KV** | Free | $0 | 100K reads + 1K writes/day |
| **GitHub Actions** | Free (public) | $0 | 2,000 min/month (private) |

---

## Do NOT Enable

These features incur charges. None are required for this project.

| Feature | Where | Why to avoid | Free alternative |
|---------|-------|-------------|-----------------|
| Vercel Pro / Team plan | Vercel billing | $20+/mo per member | Hobby plan is sufficient |
| Vercel Analytics | Vercel dashboard | $0 only for 2,500 events/mo then paid | None needed — use browser DevTools |
| Vercel Speed Insights | Vercel dashboard | Paid add-on | Lighthouse CLI (free) |
| Vercel Web Application Firewall | Vercel dashboard | Enterprise feature | Cloudflare free WAF |
| Vercel Cron Jobs | vercel.json `crons` | Paid on Hobby plan | GitHub Actions scheduled workflow |
| Vercel Edge Config | Vercel dashboard | Paid storage | Environment variables |
| Vercel Blob / KV / Postgres | Vercel dashboard | Paid storage services | Use Cloudflare D1 + KV (free) |
| Cloudflare Durable Objects | wrangler.toml | $0.15/M requests beyond free | Not needed — use D1 |
| Cloudflare R2 | CF dashboard | $0.015/GB/mo storage after 10 GB | Not needed |
| Cloudflare Queues | CF dashboard | $0.40/M messages after 1M | Not needed |
| Paid error tracking (Sentry Pro) | sentry.io | $26+/mo | Sentry free tier (5K events) |
| AI API keys (OpenAI, etc.) | Code / env vars | Pay-per-token | Ollama local (free) |

---

## How to Verify You Are Safe

### Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. Click your project > **Settings > General**.
3. Confirm plan shows **Hobby (Free)**.
4. Check **Settings > Analytics** — should be OFF.
5. Check **Settings > Speed Insights** — should be OFF.

### Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **Workers & Pages** > your worker.
3. Check **Usage** — confirm you are on the **Free** plan.
4. Go to **D1** > your database > **Metrics** — confirm reads/writes are within limits.
5. Go to **KV** > your namespace — confirm usage.

### GitHub Actions

1. Go to **GitHub repo > Settings > Billing** (org level) or **Profile > Settings > Billing**.
2. Confirm minutes usage is within the 2,000-minute free tier.

---

## Safety Mechanisms in the Codebase

1. **Fail-closed rate limiting**: API returns `503` at 80% of daily request limit. No overage possible.
2. **Request-level rate limiting**: Per-IP rate limits via KV prevent abuse.
3. **Input validation**: Zod schemas on every endpoint reject malformed data before processing.
4. **Pagination enforced**: Max 100 records per query. No unbounded scans.
5. **Static frontend**: The SPA is pre-built HTML/CSS/JS served from CDN — zero compute cost.
6. **CI efficiency**: GitHub Actions workflow uses `pnpm` cache and concurrency groups to minimize minutes.

---

## What Happens When Limits Are Hit

| Limit | Behavior | User experience |
|-------|----------|-----------------|
| Workers 100K req/day | API returns `503` | "Service temporarily unavailable" |
| D1 5M reads/day | Queries fail | Cached data still served |
| KV 100K reads/day | Rate-limit lookups fail-open | Slightly degraded rate limiting |
| Vercel 100 GB/mo | Site goes offline | Unlikely at <50 users |
| GH Actions 2,000 min/mo | CI stops running | Merge without CI (not recommended) |

---

## Monitoring Without Cost

### Cloudflare
- **Workers > Metrics**: Request count, error rate, CPU time — all free.
- **D1 > Metrics**: Reads/writes per day.

### Vercel
- **Project > Analytics tab** (basic, free): Deployment count, build times.
- **Function Logs** (Hobby): Basic invocation logs.

### GitHub
- **Actions > Usage**: Minutes consumed this billing cycle.

---

## Feature Flags for Cost Control

If you add optional paid features in the future, gate them behind environment variables:

```typescript
// Safe pattern: feature only active when explicitly enabled
const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

if (ENABLE_ANALYTICS) {
  // Only runs if explicitly opted in
  initAnalytics();
}
```

Default: OFF. Only enable when you have confirmed the cost impact.

---

## Cost Summary

| Component | Monthly cost | Annual cost |
|-----------|:---:|:---:|
| Vercel Hobby | $0 | $0 |
| Cloudflare Workers Free | $0 | $0 |
| Cloudflare D1 Free | $0 | $0 |
| Cloudflare KV Free | $0 | $0 |
| GitHub Actions (public repo) | $0 | $0 |
| Domain (optional) | ~$10 | ~$10 |
| **Total** | **$0** | **$0 – $10** |

---

*See also: [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.*
