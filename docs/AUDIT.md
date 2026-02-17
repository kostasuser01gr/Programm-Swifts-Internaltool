# Audit Report — DataOS Platform

> Generated: 2026-02-17 | Baseline: typecheck ✅ · 103 tests ✅ · build ✅

## Architecture Snapshot

| Layer | Stack | Status |
|---|---|---|
| Frontend | React 18.3, Vite 6.3, TypeScript, Tailwind CSS 4, Zustand 5, react-router 7 | Running (mock data only) |
| Backend | Cloudflare Workers (Hono 4.7), D1 (SQLite), KV | Deployed, verified, **unused by UI** |
| Design | 49 shadcn/ui components (Radix), MUI installed but never imported | Inconsistent |
| CI | GitHub Actions (7 jobs: lint, test, audit, worker typecheck, build, deploy pages, deploy worker) | Green |

### Routes

| Route | Component | Data Source |
|---|---|---|
| `/` | `App` (enterprise grid) | Mock (mockData.ts) |
| `/chat` | `ChatPage` | Mock (chatData.ts) |
| `/fleet` | `FleetTool` | Mock (fleetStore hardcoded) |
| `/washer` | `WasherApp` | Mock (washerStore) |
| `/wash` | `WashPortal` (public) | Mock (washerStore) |
| `/settings` | `SettingsPanel` | Mock (settingsStore) |
| `/game` | `GamePage` | Mock (gameData.ts, strategyEvents.ts) |

### Stores (Zustand, all localStorage-persisted)

7 stores, 2,284 total lines. Zero API calls. A separate `useAuthStore` in `src/app/api/useAuth.ts` wraps the real Worker API but nothing uses it.

---

## Key Issues

### 1. API Layer Disconnected
Full backend (15+ files, 13 DB tables, 17 endpoints) + typed React hooks (`src/app/api/`) built but **zero components import from them**. Two competing auth systems (PIN mock vs email/password API).

### 2. Dead Dependencies & Bundle Bloat
- **MUI + Emotion**: installed, never imported → dead 104-byte chunk
- **recharts**: 557 KB chunk, used by only 2 files
- **react-slick** + **embla-carousel**: two carousel libraries
- **@popperjs/core + react-popper**: redundant with Radix
- **next-themes**: redundant with custom ThemeProvider
- **1,741 lines of mock data** compiled into production

### 3. Monolithic Components
5 components over 690 lines each (App.tsx: 688, FleetTool: 693, SettingsPanel: 691, WasherApp: 737, WashPortal: 1,138). Mix of inline styles + Tailwind + shadcn creates inconsistency.

### 4. Performance
- `App.tsx` eagerly imports 22 enterprise components (GridView, KanbanView, CalendarView, etc.) → 375 KB main chunk. Only 1 view visible at a time.
- `getFilteredRecords()` runs on every render without memoization.
- `useVirtualList` hook exists but is unused.
- Photos stored as base64 data URLs in localStorage (unbounded growth).

### 5. No Real Linter
`lint` script runs `tsc --noEmit` (type-check only). No ESLint, no pre-commit hooks.

### 6. Styling Split
Enterprise components use inline `style={{}}` objects. shadcn/ui components use Tailwind utility classes. No consistent approach.

### 7. Accessibility Gaps
Good: NavBar, ErrorBoundary, ConnectivityMonitor with proper ARIA. Bad: Enterprise views use `<div>` click handlers instead of semantic elements, no skip-to-content, no focus trapping in overlays.

---

## Task Checklist

### Phase 1 — Cleanup & Foundation
- [x] ~~Baseline passing (typecheck, tests, build)~~
- [ ] Remove dead deps (MUI, emotion, react-slick, react-popper, next-themes)
- [ ] Add ESLint (flat config) + fix critical issues
- [ ] Lazy-load enterprise views in App.tsx

### Phase 2 — Design System Polish
- [ ] Consolidate design tokens (tokens.css + ThemeProvider)
- [ ] Replace inline styles with Tailwind/shadcn in enterprise components
- [ ] Add skeleton loading states for async data
- [ ] Add empty states for all views
- [ ] Ensure consistent dark/light theming

### Phase 3 — API Integration
- [ ] Wire auth: replace PIN mock with Worker `/api/auth/*`
- [ ] Wire fleet: replace hardcoded vehicles with `/api/fleet` (via records API)
- [ ] Wire washer: replace local state with `/api/wash` (via records API)
- [ ] Wire chat: replace mock messages with `/api/chat/messages`
- [ ] Keep graceful offline fallback

### Phase 4 — Engineering Hardening
- [ ] Add COST_SAFETY.md documentation
- [ ] Add npm scripts for Worker dev/deploy/migrate
- [ ] Add deployment guide updates
- [ ] Final verification: all checks green, zero errors

---

## Bundle Breakdown (pre-optimization)

| Chunk | Size (raw) | Size (gzip) | Notes |
|---|---|---|---|
| vendor-charts | 557 KB | 157 KB | **recharts** — used by 2 files |
| index (main) | 375 KB | 98 KB | App.tsx + 22 eager imports + mock data |
| StationWars | 54 KB | 16 KB | Strategy game |
| GamePage | 43 KB | 14 KB | Quiz game |
| vendor-react | 43 KB | 15 KB | React + router |
| ChatPage | 32 KB | 8 KB | Chat |
| WashPortal | 28 KB | 7 KB | Public wash page |
| FleetTool | 26 KB | 7 KB | Fleet management |
| SettingsPanel | 24 KB | 6 KB | Settings |
| WasherApp | 20 KB | 6 KB | Washer bay |
| CSS | 123 KB | 19 KB | All styles |
| **Total** | **~1.2 MB** | **~353 KB** | |
