# Deep Scan Report — DataOS Platform

**Date**: 17 February 2026  
**Scope**: Full repository audit — architecture, UI/UX, accessibility, performance, security, testing, deployment  

---

## Architecture Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | React 18.3 (SPA, client-side routing) | |
| Build | Vite 6.3 | |
| Routing | react-router v7.13 | |
| State | Zustand 5 (8 stores, localStorage persist) | |
| Styling | Tailwind CSS v4.1 + shadcn/ui + **584 inline style objects** | |
| Backend | Cloudflare Workers (Hono v4), D1 (SQLite), KV | |
| Testing | Vitest 4, Testing Library — 103 tests, 11 files | |
| CI/CD | GitHub Actions → Cloudflare Pages + Workers | |
| PWA | Service worker (cache-first assets, network-first nav) | |

**Key structural observation**: The codebase has **two parallel styling systems**. Shell/layout components and all 49 shadcn/ui primitives use Tailwind with theme tokens (dark/light via CSS class toggle). But all feature components (FleetTool, WasherApp, ChatPage, GamePage, WashPortal, chat sub-components, ErrorBoundary, ConnectivityMonitor) use massive inline `React.CSSProperties` objects with hardcoded hex colors — bypassing the theme system entirely. This is the dominant technical debt item.

---

## Findings by Category

### UI/UX — Styling Inconsistency (HIGH)

| ID | Severity | File | Issue |
|---|---|---|---|
| U-1 | **High** | `FleetTool.tsx` | 694 lines, 45+ inline style defs in `s: Record<string, CSSProperties>`. Hardcoded `#0f172a`, `#e2e8f0`, `#94a3b8`. No light mode, no responsive breakpoints. |
| U-2 | **High** | `WasherApp.tsx` | 738 lines, 73+ inline styles in `st` object. Same pattern. |
| U-3 | **High** | `WashPortal.tsx` | 135+ inline styles. Customer-facing page with no theme support. |
| U-4 | **High** | `ChatPage.tsx` | `100vw`/`100vh` with `#0f0d2e` background, `onMouseEnter`/`onMouseLeave` hover handlers instead of CSS. |
| U-5 | **High** | `GamePage.tsx` | 64+ inline styles. `StationWars.tsx` adds 87 more. |
| U-6 | **Medium** | `ErrorBoundary.tsx` | Inline `eb` styles object, hardcoded dark colors. |
| U-7 | **Medium** | `ConnectivityMonitor.tsx` | Inline `cm` styles, no theme tokens. |
| U-8 | **Medium** | `PinLogin.tsx`, `AuthGate.tsx` | Inline styles for auth screens. |
| U-9 | **Low** | `ChatLogin.tsx`, `ChatApp.tsx`, sub-components | All chat UI hardcoded in dark purple palette. |

**Total**: ~584 inline `style={{}}` occurrences across non-ui components.

### UI/UX — Positive Patterns

- Empty states: well-implemented across FleetTool, WasherApp, CommandPalette, SettingsPanel
- Loading states: lazy route `PageLoading`, `SkeletonTable`, button spinners
- Error pages: premium 404/500 with Tailwind theming
- ErrorBoundary wraps entire app with recovery UI
- ConnectivityMonitor shows offline/reconnected banners
- SettingsPanel (recently refactored) uses Tailwind + shadcn/ui `Switch`/`Input`

### Accessibility (HIGH)

| ID | Severity | Component | Issue |
|---|---|---|---|
| AC-1 | **High** | `FleetTool` | Zero `aria-*` attributes, no `role` on interactive elements, no keyboard navigation, no focus rings on inline-styled buttons |
| AC-2 | **High** | `WasherApp` | Same — kanban columns lack `role="list"`, cards lack `role="listitem"` |
| AC-3 | **High** | `ChatPage` | Back button has no `aria-label`, hover via JS not CSS |
| AC-4 | **Medium** | `GridView` | Missing `role="grid"`/`role="row"`/`role="gridcell"` semantics |
| AC-5 | **Medium** | `LoginPage` | `<label>` not linked to `<input>` via `htmlFor`/`id` |
| AC-6 | **Medium** | `SettingsPanel` | Emoji icons not wrapped in `aria-hidden="true"` |
| AC-7 | **Medium** | All inline-styled components | Zero `focus-visible` styling (shadcn/ui components have it) |
| AC-8 | **Low** | Global | No global focus-ring fallback styles |
| AC-9 | **Low** | Inline animations | Don't respect `prefers-reduced-motion` (token resets only affect CSS custom properties) |

### Performance

| ID | Severity | Issue |
|---|---|---|
| P-1 | **Low** | `recharts` (~420KB chunk) loaded for DashboardPage. Consider if sparkline SVGs suffice. |
| P-2 | **Medium** | FleetTool (694 lines) and WasherApp (738 lines) are monolithic — should be split for tree-shaking and re-render optimization. |
| P-3 | **Low** | `useVirtualList` hook exists but unused in GridView — renders all records without virtualization. |
| P-4 | **Low** | Google Fonts loaded via render-blocking CSS `@import url(...)`. Should preconnect + preload in `index.html`. |
| P-5 | **Good** | Code splitting well-implemented: all pages lazy-loaded, vendor chunks separated (react, ui, charts). Build produces 228KB main + appropriate chunks. |

### Security

| ID | Severity | Issue |
|---|---|---|
| SEC-1 | **Medium** | `authStore.ts` L31: `DEFAULT_PIN = '1234'` hardcoded for mock profiles. PIN reset shows in `alert()`. |
| SEC-2 | **Medium** | No `Content-Security-Policy` header in vercel.json or nginx.conf. |
| SEC-3 | **Low** | `X-Frame-Options` inconsistency: `DENY` (Vercel) vs `SAMEORIGIN` (Docker). |
| SEC-4 | **Low** | Login min password length (6) differs from registration (8). |
| SEC-5 | **Good** | Worker security is strong: PBKDF2-SHA256 (100K iterations), timing-safe comparison, 256-bit session tokens, rate limiting, fail-closed at 80% limits, HttpOnly+Secure+SameSite cookies, audit logging. |

### Testing (HIGH)

| ID | Severity | Issue |
|---|---|---|
| T-1 | **High** | Zero Worker backend tests. Auth, rate limiting, CRUD, validation untested. |
| T-2 | **High** | Only 3 basic component render tests. No interaction tests for GridView, AppShell, LoginPage, SettingsPanel. |
| T-3 | **High** | No E2E tests. No Playwright/Cypress setup. |
| T-4 | **Medium** | Auth store (449 lines of complex logic) untested. |
| T-5 | **Medium** | API client and data hooks untested. |

### Deployment

| ID | Severity | Issue |
|---|---|---|
| D-1 | **Medium** | ESLint CI step uses `continue-on-error: true` — lint failures don't block deploys. |
| D-2 | **Low** | SW cache name `station-v1` is static — no auto-invalidation on deploy. |
| D-3 | **Good** | Vercel SPA rewrites correctly configured. Security headers present. |
| D-4 | **Good** | Docker multi-stage build with Nginx + healthcheck. |

### Dead Code

| ID | File | Issue |
|---|---|---|
| S-1 | `enterprise/SearchCommand.tsx` | Orphaned — replaced by `CommandPalette`, still in filesystem |
| S-2 | `enterprise/NotificationCenter.tsx` | Duplicate — superseded by `shell/NotificationCenter.tsx` |
| S-3 | `enterprise/ErrorBoundary.tsx` | Duplicate — superseded by `shared/ErrorBoundary.tsx` |
| S-4 | `react-hook-form` dep | Zero `useForm` imports in `src/` — potentially unused |
| S-5 | Package name `@figma/my-make-file` | Scaffold leftover — misleading |

---

## Prioritized Upgrade Plan

### Quick Wins (this session)
1. **Delete orphaned files** (SearchCommand, duplicate NotificationCenter, duplicate ErrorBoundary)
2. **Fix package.json** (name, react from peerDeps → deps)
3. **Font loading optimization** (preconnect in index.html)
4. **Add global focus-ring styles** (CSS fallback for inline-styled components)
5. **Add CSP header** to vercel.json
6. **Fix ESLint CI** to not use continue-on-error
7. **Add aria-labels** to critical interactive elements

### Medium Effort (this session)
8. **Rewrite ErrorBoundary** from inline styles → Tailwind
9. **Rewrite ConnectivityMonitor** from inline styles → Tailwind
10. **Rewrite ChatPage wrapper** from inline styles → Tailwind
11. **Add LoginPage form accessibility** (htmlFor/id linkage)
12. **Add responsive meta + PWA improvements**
13. **Add component interaction tests** for critical flows
14. **Fix CI linting as quality gate**

### Big Upgrades (this session + follow-up)
15. **Rewrite FleetTool** (694 lines) → Tailwind + split to sub-components
16. **Rewrite WasherApp** (738 lines) → Tailwind + sub-components
17. **Rewrite WashPortal** → Tailwind + sub-components
18. **Rewrite GamePage + StationWars** → Tailwind
19. **Rewrite all chat sub-components** → Tailwind
20. **Add E2E test setup** (Playwright smoke suite)
21. **Create responsive QA checklist** + **accessibility checklist** docs
