import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../types';
import authRoutes from '../routes/auth';

// ─── Mock D1 helpers ────────────────────────────────────────

function mockD1() {
  const firstFn = vi.fn().mockResolvedValue(null);
  const allFn = vi.fn().mockResolvedValue({ results: [] });
  const runFn = vi.fn().mockResolvedValue({ success: true });
  const bindFn = vi.fn().mockReturnValue({ first: firstFn, all: allFn, run: runFn });
  const prepareFn = vi.fn().mockReturnValue({ bind: bindFn, first: firstFn, all: allFn, run: runFn });
  return { prepare: prepareFn, batch: vi.fn().mockResolvedValue([]), _bind: bindFn, _first: firstFn, _run: runFn };
}

function mockKV() {
  return { get: vi.fn().mockResolvedValue(null), put: vi.fn().mockResolvedValue(undefined) };
}

function createEnv(dbOverrides?: Partial<ReturnType<typeof mockD1>>) {
  return {
    DB: { ...mockD1(), ...dbOverrides } as unknown as D1Database,
    KV: mockKV() as unknown as KVNamespace,
    ENVIRONMENT: 'development',
    CORS_ORIGIN: 'http://localhost:3000',
    MAX_UPLOAD_SIZE_BYTES: '5242880',
    RATE_LIMIT_REQUESTS_PER_MINUTE: '60',
    RATE_LIMIT_AUTH_PER_MINUTE: '10',
    SESSION_TTL_SECONDS: '86400',
    MAX_USERS: '50',
    MAX_RECORDS_PER_TABLE: '10000',
    MAX_TABLES_PER_BASE: '20',
  };
}

// ─── Tests ──────────────────────────────────────────────────

describe('Auth Routes', () => {
  let app: Hono<AppEnv>;
  let env: ReturnType<typeof createEnv>;

  beforeEach(() => {
    env = createEnv();
    app = new Hono<AppEnv>();
    // Bypass rate limiter for tests
    app.route('/auth', authRoutes);
  });

  describe('POST /auth/login', () => {
    it('returns 400 for missing body', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);
      expect(res.status).toBe(400);
      const data: any = await res.json();
      expect(data.ok).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'short' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 401 for non-existent user', async () => {
      const db = mockD1();
      db._first.mockResolvedValue(null);
      env.DB = db as unknown as D1Database;

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com', password: 'password123' }),
      }, env);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/register', () => {
    it('returns 400 for missing display_name', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 403 when user limit is reached', async () => {
      const db = mockD1();
      db._first.mockResolvedValue({ cnt: 50 });
      env.DB = db as unknown as D1Database;

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'password123', display_name: 'New User' }),
      }, env);
      expect(res.status).toBe(403);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  describe('GET /auth/me', () => {
    it('returns 401 without auth context', async () => {
      const res = await app.request('/auth/me', {}, env);
      expect(res.status).toBe(401);
    });
  });
});
