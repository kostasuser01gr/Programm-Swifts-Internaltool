# Cost Safety Guide

> **Zero-cost commitment**: Every service used by DataOS is within its provider's free tier. There are no paid plans, no trials that auto-convert, and no credit-card-required services.

## Services & Free Tier Limits

| Service | Usage | Free Tier Limit | Safety Mechanism |
|---|---|---|---|
| **Cloudflare Workers** | Backend API | 100K requests/day | Fail-closed guard blocks at 80K |
| **Cloudflare D1** | Database (SQLite) | 5M reads + 100K writes/day | Usage counter in `fail-closed` middleware |
| **Cloudflare KV** | Rate limiting & cache | 100K reads + 1K writes/day | Short TTL, bounded entries |
| **Vercel Hobby** | Frontend SPA hosting | 100GB bandwidth/month | Static build (~1MB), well under limit |
| **GitHub Actions** | CI/CD | 2,000 min/month | ~3 min per run, ~600 runs/month possible |

## Safety Mechanisms

### 1. Fail-Closed Guard (`worker/src/middleware/failClosed.ts`)

Every request passes through the fail-closed middleware which:
- Tracks daily request count, D1 reads, and D1 writes in a KV counter
- Blocks requests with `429 Too Many Requests` when usage reaches **80%** of the free-tier limit
- Resets counters daily (UTC midnight)
- Returns a clear error message explaining why the request was blocked

```
80% thresholds:
- Workers requests: 80,000 / day
- D1 reads: 4,000,000 / day
- D1 writes: 80,000 / day
```

### 2. Rate Limiting (`worker/src/middleware/rateLimit.ts`)

Per-IP rate limiting using KV with sliding windows:
- General endpoints: 60 requests/minute
- Auth endpoints: 10 requests/minute (prevents brute force)
- Exceeding the limit returns `429` with `Retry-After` header

### 3. Input Validation (`worker/src/utils/validate.ts`)

All request bodies are validated before processing:
- Maximum payload size: 100KB (enforced by Workers runtime)
- String length limits on all fields (email: 255, display_name: 100, etc.)
- Type checking on all inputs
- SQL injection prevention via D1 parameterized queries

### 4. Pagination

All list endpoints use pagination:
- Default: 50 records per page
- Maximum: 100 records per page
- Prevents accidental full-table scans

### 5. Session Management

- Sessions expire after 24 hours
- Maximum 5 active sessions per user
- Session cleanup happens on login (old sessions purged)

## What Happens When Limits Are Hit

| Scenario | Behavior | User Impact |
|---|---|---|
| Workers requests at 80% | API returns `429` | UI shows "Service busy, try later" toast |
| D1 reads at 80% | API returns `429` | Same as above |
| KV writes at limit | Rate limiter degrades gracefully | Some requests may bypass rate limit (still safe) |
| Vercel bandwidth high | Unlikely (~1MB bundle) | Would need 100K+ daily visitors |
| **Never**: auto-upgrade | N/A | No paid plan exists in config |

## Intentionally Disabled / Gated Features

These features are **not enabled** to stay within free limits:

| Feature | Reason | Status |
|---|---|---|
| File/image upload | Would need R2 (has free tier but adds complexity) | `TODO: Add with R2 free tier` |
| Real-time WebSocket | Durable Objects required (paid) | Polling-based instead |
| Email notifications | Requires email service | Not implemented |
| Analytics/telemetry | Would need external service | Client-side only |
| AI features | Would need API keys ($) | Mock/disabled, `TODO` flagged |
| Full-text search | Would need search index | Client-side filtering only |

## Monitoring Usage

Check current usage via the admin dashboard:
```
GET /api/admin/usage
```

Returns:
```json
{
  "ok": true,
  "data": {
    "requests": { "current": 12500, "limit": 100000, "percent": 12.5 },
    "d1_reads": { "current": 45000, "limit": 5000000, "percent": 0.9 },
    "d1_writes": { "current": 1200, "limit": 100000, "percent": 1.2 }
  }
}
```

## Adding New Features Safely

Before adding any new feature, check:

1. **Does it require a new service?** → Must be free tier only
2. **Does it increase D1 writes significantly?** → Add to usage tracking
3. **Does it add a new external API call?** → Must be free or have generous free tier
4. **Could it be exploited for abuse?** → Add rate limiting
5. **Does it store user-generated content?** → Size limits, validation, no files

When in doubt, implement behind a feature flag that defaults to `OFF`:
```typescript
// worker/src/config.ts
export const FEATURES = {
  FILE_UPLOADS: false,     // Requires R2
  REALTIME_SYNC: false,    // Requires Durable Objects
  EMAIL_ALERTS: false,     // Requires email service
  AI_SUGGESTIONS: false,   // Requires API keys
} as const;
```
