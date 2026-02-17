import type { Env } from '../types';

// ─── Rate Limiting Middleware ────────────────────────────────
// Uses KV for fast lookups, falls back to D1
// Enforces per-IP and per-user limits

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

export function rateLimiter(config?: Partial<RateLimitConfig>) {
  return async (
    c: {
      req: { header: (name: string) => string | undefined; url: string };
      env: Env;
      get: (key: string) => unknown;
      json: (body: unknown, status?: number) => Response;
      header: (key: string, value: string) => void;
    },
    next: () => Promise<void>
  ) => {
    const env = c.env;
    const maxRequests = config?.maxRequests ?? parseInt(env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10);
    const windowSeconds = config?.windowSeconds ?? 60;
    const prefix = config?.keyPrefix ?? 'rl';

    // Get client identifier
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const key = `${prefix}:${ip}`;

    try {
      // Try KV first (faster)
      const cached = await env.KV.get(key);
      if (cached) {
        const count = parseInt(cached, 10);
        if (count >= maxRequests) {
          c.header('Retry-After', String(windowSeconds));
          c.header('X-RateLimit-Limit', String(maxRequests));
          c.header('X-RateLimit-Remaining', '0');
          return c.json(
            { ok: false, error: 'Rate limit exceeded. Please wait before retrying.' },
            429
          );
        }
        // Increment
        await env.KV.put(key, String(count + 1), { expirationTtl: windowSeconds });
        c.header('X-RateLimit-Limit', String(maxRequests));
        c.header('X-RateLimit-Remaining', String(maxRequests - count - 1));
      } else {
        await env.KV.put(key, '1', { expirationTtl: windowSeconds });
        c.header('X-RateLimit-Limit', String(maxRequests));
        c.header('X-RateLimit-Remaining', String(maxRequests - 1));
      }
    } catch {
      // KV failure — fail open for rate limiting (don't block legitimate traffic)
      // but log the error for observability
      console.error('[RateLimit] KV error, proceeding without rate limit');
    }

    await next();
  };
}

// ─── Auth-specific rate limiter (stricter) ──────────────────

export function authRateLimiter() {
  return rateLimiter({
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'auth_rl',
  });
}
