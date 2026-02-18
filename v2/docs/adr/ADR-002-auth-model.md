# ADR-002: Auth Model — Cookie-First with CSRF Protection

**Status:** Accepted  
**Date:** 2026-02-18  
**Deciders:** Security Engineer

## Context

V1 stores auth tokens in `localStorage` (XSS-extractable) and also sets `HttpOnly` session cookies. In production, both mechanisms coexist, creating confusion about which is canonical.

## Decision

### Cookie-first auth (production)

- On login/register, the API sets an `HttpOnly; Secure; SameSite=Lax; Path=/` cookie containing the session token.
- The frontend sends `credentials: 'include'` on every fetch; no JavaScript ever reads the token.
- `localStorage` is **never** used for session tokens in production.
- In development (HTTP on localhost), the cookie omits `Secure` to work without TLS.

### Bearer token (API-only / dev)

- The API also accepts `Authorization: Bearer <token>` for programmatic access (scripts, Postman).
- Tokens are returned in the JSON response body on login, but the web app ignores them in production.

### CSRF strategy

- `SameSite=Lax` prevents cross-origin cookie attachment on `POST`/`PATCH`/`DELETE` from foreign sites.
- All mutating API endpoints require `Content-Type: application/json`, which cannot be sent by plain HTML forms (no CORS preflight bypass).
- Origin validation: the Worker checks `Origin` header against the `CORS_ORIGIN` env var.
- This **double-submit-cookie** pattern is unnecessary given `SameSite=Lax` + `Content-Type` enforcement.

### Session lifecycle

| Event | Action |
|-------|--------|
| Login | Create session row in D1, set cookie (TTL from `SESSION_TTL_SECONDS`). |
| Request | Hash token → lookup session → attach user to Hono context. |
| Logout | Delete session row, expire cookie (`Max-Age=0`). |
| Expiry | D1 query filters `expires_at > datetime('now')`. |

## Consequences

- XSS cannot steal auth tokens (they're never in JS-accessible storage).
- CSRF is mitigated by `SameSite=Lax` + `Content-Type` header requirement.
- Dev mode still works on `http://localhost` without `Secure` flag.
- Third-party API consumers use Bearer tokens (not cookies).
