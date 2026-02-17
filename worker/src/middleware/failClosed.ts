import type { Env } from '../types';

// ─── Fail-Closed Guard ──────────────────────────────────────
// Tracks daily usage counters and blocks requests when approaching
// free-tier limits. This ensures ZERO billing risk.

const METRICS = ['d1_reads', 'd1_writes', 'kv_reads', 'requests'] as const;
type Metric = (typeof METRICS)[number];

interface UsageLimits {
  d1_reads: number;
  d1_writes: number;
  kv_reads: number;
  requests: number;
}

function getLimits(env: Env): UsageLimits {
  return {
    d1_reads: parseInt(env.FAIL_CLOSED_D1_DAILY_READS, 10) || 4_000_000,
    d1_writes: parseInt(env.FAIL_CLOSED_D1_DAILY_WRITES, 10) || 80_000,
    kv_reads: parseInt(env.FAIL_CLOSED_KV_DAILY_READS, 10) || 80_000,
    requests: 90_000, // Workers free: 100K/day
  };
}

/** Increment a usage counter. Returns true if within limits. */
export async function trackUsage(env: Env, metric: Metric, increment = 1): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const limits = getLimits(env);
  const limit = limits[metric];

  try {
    // Upsert counter
    await env.DB.prepare(
      `INSERT INTO usage_counters (date, metric, count)
       VALUES (?, ?, ?)
       ON CONFLICT (date, metric) DO UPDATE SET count = count + ?`
    )
      .bind(today, metric, increment, increment)
      .run();

    // Check current count
    const row = await env.DB.prepare(
      `SELECT count FROM usage_counters WHERE date = ? AND metric = ?`
    )
      .bind(today, metric)
      .first<{ count: number }>();

    const current = row?.count ?? 0;
    return current < limit;
  } catch {
    // If we can't track, fail closed
    console.error(`[FailClosed] Cannot track ${metric}, blocking request`);
    return false;
  }
}

/** Check if any metric is over limit WITHOUT incrementing */
export async function checkLimits(env: Env): Promise<{ ok: boolean; violations: string[] }> {
  const today = new Date().toISOString().split('T')[0];
  const limits = getLimits(env);
  const violations: string[] = [];

  try {
    const { results } = await env.DB.prepare(
      `SELECT metric, count FROM usage_counters WHERE date = ?`
    )
      .bind(today)
      .all<{ metric: string; count: number }>();

    for (const row of results || []) {
      const metric = row.metric as Metric;
      if (metric in limits && row.count >= limits[metric]) {
        violations.push(`${metric}: ${row.count}/${limits[metric]}`);
      }
    }
  } catch {
    violations.push('Unable to check usage counters');
  }

  return { ok: violations.length === 0, violations };
}

/** Get current usage for dashboard display */
export async function getUsageSummary(env: Env): Promise<Record<string, { current: number; limit: number; percent: number }>> {
  const today = new Date().toISOString().split('T')[0];
  const limits = getLimits(env);
  const summary: Record<string, { current: number; limit: number; percent: number }> = {};

  try {
    const { results } = await env.DB.prepare(
      `SELECT metric, count FROM usage_counters WHERE date = ?`
    )
      .bind(today)
      .all<{ metric: string; count: number }>();

    for (const metric of METRICS) {
      const row = results?.find((r) => r.metric === metric);
      const current = row?.count ?? 0;
      const limit = limits[metric];
      summary[metric] = {
        current,
        limit,
        percent: Math.round((current / limit) * 100),
      };
    }
  } catch {
    for (const metric of METRICS) {
      summary[metric] = { current: -1, limit: limits[metric], percent: -1 };
    }
  }

  return summary;
}

// ─── Fail-Closed Middleware ─────────────────────────────────

export function failClosedGuard() {
  return async (
    c: { env: Env; json: (body: unknown, status?: number) => Response },
    next: () => Promise<void>
  ) => {
    const withinLimits = await trackUsage(c.env, 'requests');
    if (!withinLimits) {
      return c.json(
        {
          ok: false,
          error: 'Service temporarily unavailable: daily free-tier limit approaching. Resets at midnight UTC.',
        },
        503
      );
    }
    await next();
  };
}
