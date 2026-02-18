import type { Context, Next } from 'hono';
import type { Env } from '../types';

// ─── Rate Limiting Middleware ────────────────────────────────
// KV-backed per-IP limiter. Fails open on KV errors.

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

export function rateLimiter(config?: Partial<RateLimitConfig>) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const env = c.env;
    const max = config?.maxRequests ?? (parseInt(env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10) || 60);
    const window = config?.windowSeconds ?? 60;
    const prefix = config?.keyPrefix ?? 'rl';

    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
    const key = `${prefix}:${ip}`;

    try {
      const cached = await env.KV.get(key);
      if (cached) {
        const count = parseInt(cached, 10);
        if (count >= max) {
          c.header('Retry-After', String(window));
          return c.json({ ok: false, error: 'Rate limit exceeded' }, 429);
        }
        await env.KV.put(key, String(count + 1), { expirationTtl: window });
      } else {
        await env.KV.put(key, '1', { expirationTtl: window });
      }
    } catch {
      // Fail open — don't block requests on KV errors
    }

    await next();
  };
}

export function authRateLimiter() {
  return rateLimiter({ maxRequests: 10, windowSeconds: 60, keyPrefix: 'auth_rl' });
}
