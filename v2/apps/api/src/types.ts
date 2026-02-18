// ─── Cloudflare Worker Environment Bindings ─────────────────
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  MAX_UPLOAD_SIZE_BYTES: string;
  RATE_LIMIT_REQUESTS_PER_MINUTE: string;
  RATE_LIMIT_AUTH_PER_MINUTE: string;
  SESSION_TTL_SECONDS: string;
  MAX_USERS: string;
  MAX_RECORDS_PER_TABLE: string;
  MAX_TABLES_PER_BASE: string;
}

// ─── Auth Context (set by auth middleware) ──────────────────
export interface AuthContext {
  user: {
    id: string;
    email: string;
    display_name: string;
    role: 'admin' | 'user';
    avatar_url: string | null;
    is_active: boolean;
  };
  session: {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: string;
    created_at: string;
  };
}

// ─── Hono type bindings ─────────────────────────────────────
export type AppEnv = {
  Bindings: Env;
  Variables: {
    auth: AuthContext;
  };
};
