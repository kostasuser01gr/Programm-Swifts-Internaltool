# DataOS - Enterprise Data Platform

> **An internal operating system for modern companies** - Combining spreadsheet flexibility with database power, automation workflows, real-time collaboration, and AI assistance.

![DataOS Platform](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop)

---

## 🚀 Overview

**DataOS** is a next-generation enterprise data platform that replaces fragmented tools (Excel, Airtable, Notion, custom apps) with a unified, intelligent system. Built for teams that need more than a spreadsheet but want less complexity than traditional databases.

### Key Capabilities

- **📊 Multi-View System**: Grid, Kanban, Calendar, Gallery, Timeline
- **🔗 Relational Database**: Link tables, lookup fields, rollup formulas
- **⚡ Automation Engine**: Visual workflow builder with triggers and actions
- **🤖 AI Assistant**: Natural language queries, auto-formulas, insights
- **👥 Real-time Collaboration**: Live cursors, presence, comments
- **🔒 Enterprise Security**: Row-level permissions, audit logs, SSO
- **📈 Advanced Analytics**: Charts, dashboards, pivot tables
- **🔌 Developer-Friendly**: GraphQL API, webhooks, SDKs

---

## ✨ Features Implemented

### ✅ Core Platform

- [x] **Workspace & Base Management**
  - Multi-tenant architecture
  - Hierarchical organization (Workspace → Base → Table)
  - Sidebar navigation with search

- [x] **Rich Field Types**
  - Text, Number, Date, Checkbox
  - Single Select, Multi-Select
  - User assignments
  - Formula fields (extensible)

- [x] **Multiple View Types**
  - **Grid View**: Excel-like spreadsheet with inline editing
  - **Kanban Board**: Drag-and-drop workflow management
  - **Calendar View**: Date-based visualization
  - Gallery, Timeline (planned)

- [x] **Advanced Features**
  - Filter, sort, group controls
  - Field configuration
  - Record detail panel
  - Activity tracking
  - Version history

### ✅ AI Integration

- [x] **Intelligent Assistant**
  - Natural language queries ("Show high priority tasks due this week")
  - Auto-formula generation
  - Data insights and anomaly detection
  - Contextual suggestions
  - Quick actions

### ✅ Collaboration

- [x] **Multi-user Support**
  - User avatars and presence indicators
  - Activity feed
  - Created/modified tracking
  - Comment system (ready for implementation)

### ✅ Enterprise Ready

- [x] **Type-safe Architecture**
  - Full TypeScript implementation
  - Comprehensive type definitions
  - Extensible data model

- [x] **Performance Optimized**
  - Efficient state management
  - Optimistic updates
  - React best practices

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────┐
│           CLIENT (React + TypeScript)            │
├─────────────────────────────────────────────────┤
│  Sidebar │ ViewToolbar │ GridView │ KanbanView  │
│  CalendarView │ RecordDetail │ AIAssistant      │
└─────────────────────────────────────────────────┘
                       ↕  REST / fetch
┌─────────────────────────────────────────────────┐
│       BACKEND (Cloudflare Workers + Hono)        │
├─────────────────────────────────────────────────┤
│  Auth │ Rate Limit │ Fail-Closed │ RBAC         │
│  D1 (SQLite) │ KV (Cache) │ Audit Log           │
└─────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────┐
│            DATA LAYER (Future)                   │
├─────────────────────────────────────────────────┤
│  GraphQL API │ WebSocket │ PostgreSQL │ Redis   │
└─────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**

- React 18.3+ with Hooks
- TypeScript 5.0+ (Strict Mode)
- Vite 6 (build tooling, dev server)
- Tailwind CSS v4 (oklch design tokens, glassmorphism)
- TanStack Query (server state, caching, pagination)
- Zustand (UI state, persistence)
- React Hook Form + Zod (forms + validation)
- Radix UI + shadcn/ui (accessible primitives)
- Framer Motion / motion (micro-interactions)
- Lucide Icons + Sonner (toasts)

**Backend (Cloudflare Workers):**

- Hono v4 (web framework)
- Cloudflare D1 (SQLite database)
- Cloudflare KV (cache & rate limits)
- PBKDF2-SHA256 (auth, sessions)
- ProblemDetails (RFC 9457 error responses)
- Fail-closed guards (free-tier billing protection)

---

## 📁 Project Structure

```text
/
├── src/                    # Main Vite/React SPA
│   ├── app/
│   │   ├── api/            # API client + TanStack Query hooks
│   │   ├── components/
│   │   │   ├── shell/      # AppShell, Sidebar, Topbar, Dashboard, Admin, Help
│   │   │   ├── shared/     # ErrorBoundary, ToastProvider, NavBar, SplitView
│   │   │   ├── ui/         # shadcn/ui primitives (Button, Dialog, Card, etc.)
│   │   │   ├── auth/       # Login, PinLogin, AuthGate
│   │   │   ├── chat/       # Team chat (channels, threads, reactions)
│   │   │   ├── enterprise/ # Grid, Kanban, Calendar, Gallery, Timeline, Form views
│   │   │   ├── fleet/      # Vehicle fleet management
│   │   │   ├── game/       # Training games (trivia + strategy)
│   │   │   ├── settings/   # Settings panel
│   │   │   └── washer/     # Wash operations
│   │   ├── design-system/  # Tokens, skeleton, status badge components
│   │   ├── hooks/          # useEnterpriseData, useSearch, useVirtualList, etc.
│   │   ├── store/          # Zustand stores (auth, chat, fleet, washer, game)
│   │   ├── theme/          # ThemeProvider (dark/light/system)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Feature flags, schemas, helpers
│   │   └── i18n/           # Internationalization (en/el)
│   ├── styles/             # CSS: theme.css, tokens.css, tailwind.css
│   └── test/               # Vitest unit tests (103 tests)
├── worker/                 # Cloudflare Worker API (Hono + D1 + KV)
│   └── src/
│       ├── routes/         # auth, workspaces, tables, admin
│       ├── middleware/     # auth, rateLimit, failClosed
│       ├── utils/          # crypto, validate, problems, logger
│       └── db/             # migrations, seed.sql
├── e2e/                    # Playwright E2E smoke tests
├── .github/workflows/      # CI, CodeQL, Deploy (Vercel + Worker)
├── org/                    # Org-wide templates (reusable workflows, checklist)
└── public/                 # Static assets, manifest.json, service worker
```

---

## 🎯 Use Cases

### Project Management

- Track tasks with status, priority, assignees
- Kanban boards for sprint planning
- Calendar view for deadlines
- Automated notifications for overdue items

### CRM & Sales

- Manage leads, contacts, deals
- Link companies to contacts
- Rollup revenue by sales rep
- Automation for follow-up emails

### Product Development

- Feature roadmap planning
- Bug tracking with priority
- User feedback collection
- Release planning calendar

### Operations

- Inventory management
- Asset tracking
- Process documentation
- Team directories

---

## 🚦 Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)

### Installation

```bash
# Clone the repository
git clone https://github.com/kostasuser01gr/Programm-Swifts-Internaltool.git
cd Programm-Swifts-Internaltool

# Install all workspace dependencies (monorepo)
pnpm install

# Copy env example
cp .env.example .env
# Edit .env if you want to connect to the Worker API (optional)
```

### Development (Frontend only — mock mode)

```bash
# Start the Vite dev server (http://localhost:5173)
pnpm dev
```

The app runs fully in mock mode out of the box — no backend needed.

### Development (Frontend + Backend)

```bash
# Terminal 1: Start the Worker API (http://localhost:8787)
cd worker && pnpm dev

# Terminal 2: Start the frontend with API URL set
VITE_API_URL=http://localhost:8787 pnpm dev
```

### Build & Verify

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript strict
pnpm test          # Vitest (103 tests)
pnpm build         # Production build → dist/
pnpm preview       # Preview at http://localhost:4173
```

### Quick Tour

1. **Explore the Sample Data**
   - Open the "Product Development" table
   - Switch between Grid, Kanban, and Calendar views
   - Click on records to see details

2. **Try the AI Assistant**
   - Click "AI Assistant" in the sidebar
   - Ask: "Show high priority tasks due this week"
   - Try: "Calculate total effort for In Progress tasks"

3. **Edit Records**
   - Double-click cells in Grid view
   - Drag cards in Kanban view
   - Open record detail panel for full editing

4. **Apply Filters**
   - Use the Filter button in the toolbar
   - Create complex conditions
   - Save views for later

---

## 🎨 Key Components

### Sidebar

- Workspace switcher
- Base/table navigation
- Quick actions (AI, Automations, Analytics)
- Member management

### ViewToolbar

- View type switcher (Grid, Kanban, Calendar)
- Filter, sort, group controls
- Share & export options
- Collaboration indicators

### GridView

- High-performance spreadsheet
- Inline cell editing
- Rich field type rendering
- Row selection & bulk actions

### KanbanView

- Drag-and-drop cards
- Group by any select field
- Quick add cards
- Column management

### AIAssistant

- Natural language interface
- Contextual suggestions
- Formula generation
- Data analysis

### RecordDetail

- Full record editing
- All field types supported
- Activity timeline
- Metadata display

---

## 🔮 Roadmap

### MVP (Current Phase)

- [x] Core data model
- [x] Multi-view system
- [x] AI assistant foundation
- [x] Basic collaboration
- [ ] Filter/sort/group UI
- [ ] Real-time sync (mock)

### Phase 2: Intelligence

- [ ] Advanced automation builder
- [ ] Formula engine v2
- [ ] AI-powered insights
- [ ] Anomaly detection
- [ ] Predictive analytics

### Phase 3: Enterprise

- [ ] Row-level permissions
- [ ] Audit log viewer
- [ ] Version history UI
- [ ] SSO integration
- [ ] Compliance tools

### Phase 4: Scale

- [ ] Backend implementation
- [ ] Real-time collaboration
- [ ] Offline support
- [ ] Mobile apps
- [ ] Marketplace/extensions

---

## 🆚 Comparison

| Feature | DataOS | Airtable | Notion | Google Sheets |
| --------- | -------- | ---------- | -------- | --------------- |
| **Data Model** | Relational | Relational | Hierarchical | Flat |
| **Views** | 6+ types | 5 types | 3 types | Sheets |
| **Automation** | Visual builder + AI | Basic | None | Apps Script |
| **AI Integration** | Native | Add-on | Limited | None |
| **Self-hosting** | ✅ Planned | ❌ | ❌ | ❌ |
| **API** | GraphQL + REST | REST | REST | REST |
| **Real-time** | ✅ CRDT | ✅ | ✅ | ✅ |
| **Permissions** | Row/field-level | View-level | Page-level | Sheet-level |

---

## 💡 Design Decisions

### Why Multi-View?

Different people consume data differently. Engineers prefer grids, PMs love Kanban, executives need dashboards. One dataset, infinite perspectives.

### Why AI-Native?

Every interaction should be intelligent. AI isn't a feature—it's the fabric that makes complex operations simple through natural language.

### Why Relational?

Real business data has relationships. Orders have customers, tasks have assignees, products have categories. Flat spreadsheets break down at scale.

### Why TypeScript?

Type safety prevents bugs, improves DX, and makes refactoring fearless. The small upfront cost pays massive dividends.

---

## 🛡️ Quality Gates & Autofix

### TL;DR

Every PR goes through automated security and quality checks before merge:

| Check | What it does | Trigger |
| ------- | ------------- | --------- |
| **CodeQL** | Static analysis for vulnerabilities (XSS, injection, etc.) | PR + weekly |
| **Copilot Autofix** | AI-suggested patches for code scanning alerts | On alert |
| **CI Tests** | Unit & integration tests via Vitest | PR + push |
| **Flutter Analyze** | Dart static analysis for ShiftForge | PR + push |

### Code Scanning (CodeQL)

CodeQL runs on every PR and weekly against `main`. Results appear as:

- **PR annotations**: Inline comments on vulnerable lines.
- **Security tab**: Full list of alerts with severity, CWE references, and fix guidance.
- **Copilot Autofix**: Automated patch suggestions on alerts — always review before accepting.

> **Enable Default Setup (UI)**: Settings → Code security → Code scanning → CodeQL analysis → Default setup → Enable.

### Sentry Copilot Extension

Use **Sentry for GitHub Copilot** to get production error insights directly in your editor:

1. **Install**: VS Code Extensions → Search "Sentry for GitHub Copilot" → Install.
2. **Connect**: Link to your Sentry project (DSN + auth token) via the extension settings.
3. **Usage in PRs**:
   - Ask Copilot Chat: `@sentry What errors affected this file in the last 7 days?`
   - Get **fix proposals** with context from stack traces.
   - **Generate unit tests** for error-prone code paths.
   - Open a fix branch/PR directly from Sentry suggestions.

**Prompt examples:**

```text
@sentry Suggest a minimal fix for the top error in login_screen.dart
@sentry Generate unit tests covering the exception in schedule_service.dart
@sentry Show unresolved issues linked to this PR's changed files
```

### Docker Copilot

Use **Docker for GitHub Copilot** to optimize container configurations:

1. **Install**: VS Code Extensions → Search "Docker for GitHub Copilot" → Install.
2. **Usage**:
   - Ask: `@docker How can I optimize this Dockerfile for smaller image size?`
   - Ask: `@docker Add a healthcheck to my nginx container`
   - Ask: `@docker Scan this image for vulnerabilities`

**This repo includes:**

- Multi-stage `Dockerfile` (Node build → Nginx serve, ~25 MB final image).
- `docker/nginx.conf` with gzip, SPA routing, security headers.
- `.dockerignore` for minimal build context.
- `shiftforge/docker-compose.yml` for PocketBase + Ollama backend.

**Build & run locally:**

```bash
docker build -t dataos .
docker run -p 8080:80 dataos
# Open http://localhost:8080
```

### Branch Protection (Required Checks)

Set up required status checks so that broken code cannot reach `main`:

1. Go to **Settings → Branches → Branch protection rules → Add rule** for `main`.
2. Enable:
   - ✅ Require a pull request before merging (1+ approvals).
   - ✅ Require status checks to pass: `code-scanning`, `build-and-test`.
   - ✅ Require branches to be up to date before merging.
   - ✅ Do not allow bypassing the above settings.

**Quick CLI setup:**

```bash
gh api \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/kostasuser01gr/Programm-Swifts-Internaltool/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[contexts][]=code-scanning' \
  -f 'required_status_checks[contexts][]=build-and-test' \
  -f enforce_admins=true \
  -f restrictions=
```

### Org-Wide Reusable Workflow

A reusable CodeQL workflow is provided in `org/reusable-codeql.yml`. To use it org-wide:

1. Place it in your org's `.github` repo at `.github/workflows/reusable-codeql.yml`.
2. Call it from any repo:

```yaml
jobs:
  security:
    uses: kostasuser01gr/.github/.github/workflows/reusable-codeql.yml@main
    secrets: inherit
```

See `org/_org_checklist.md` for the full org-level onboarding checklist.

---

## ♿ Accessibility

All interactive components follow WAI-ARIA best practices:

| Pattern | Where used |
|---------|-----------|
| `role="tablist"` / `role="tab"` / `aria-selected` | GamePage tabs, PinLogin mode selector, WasherApp view toggle |
| `role="listbox"` / `role="option"` | Quiz answers, practice categories, station selector |
| `role="checkbox"` / `aria-checked` | Damage toggles, inspection checklists |
| `role="progressbar"` / `aria-valuenow` | XP bars, game timers, station wars progress |
| `role="status"` / `role="alert"` | Toast notifications, login feedback |
| `aria-expanded` | Expandable wash cards, inspector panels |
| `aria-hidden="true"` | Decorative emoji / icons |
| Semantic HTML | `<header>`, `<nav>`, `<section>`, `<article>`, `<form>`, `<label>`, `<fieldset>`, `<legend>` |
| Focus management | Global `:focus-visible` ring (oklch), `focus-visible:ring-2` on all interactive elements |
| Keyboard navigation | All clickable elements are `<button>` or `<a>`, never bare `<div onClick>` |

### Testing Accessibility

```bash
# Run axe-core via browser devtools (free)
# 1. Install "axe DevTools" browser extension
# 2. Open DevTools → axe → Scan page
# 3. Fix any remaining issues reported
```

---

## 🤝 Contributing

This is an enterprise demonstration project showcasing modern architecture patterns. For production use, consider:

1. **Backend Implementation**: Cloudflare Workers + D1 (SQLite) backend in `worker/`
2. **Authentication**: PBKDF2-SHA256 session-based auth with role management
3. **Real-time**: Implement WebSocket with Y.js CRDT
4. **Testing**: Add unit, integration, and E2E tests
5. **Deployment**: Frontend on Vercel Hobby + Backend on Cloudflare Workers Free (zero cost)

---

## ☁️ Backend (Cloudflare Workers)

The `worker/` directory contains a full REST API backend powered by **Hono** (web framework), **Cloudflare D1** (SQLite), and **KV** (rate limiting & cache). All services run on the Cloudflare Workers Free plan — **€0 always**.

### Architecture

| Layer           | Technology          | Free Tier Limit              |
|-----------------|---------------------|------------------------------|
| Web framework   | Hono v4             | —                            |
| Database        | Cloudflare D1       | 5M reads / 100K writes / day |
| Cache & limits  | Cloudflare KV       | 100K reads / 1K writes / day |
| Auth            | PBKDF2 + sessions   | —                            |
| Rate limiting   | KV-backed per-IP    | 60 req/min                   |

### Fail-Closed Guards

The backend enforces **fail-closed** limits at **80%** of free-tier capacity. When daily usage approaches the cap, the API returns `503 Service Limit Reached` instead of risking billing overages. Usage is tracked via KV counters and exposed in the admin dashboard.

### API Endpoints

```
POST   /api/auth/register      — Create account (first user = admin)
POST   /api/auth/login          — Login (session cookie + Bearer token)
POST   /api/auth/logout         — End session
GET    /api/auth/me             — Current user

GET    /api/workspaces          — List workspaces
POST   /api/workspaces          — Create workspace
GET    /api/workspaces/:id      — Get workspace + bases
DELETE /api/workspaces/:id      — Delete (owner only)

GET    /api/tables/:id          — Table + fields + views
GET    /api/tables/:id/records  — Paginated records (?page=&limit=)
POST   /api/tables/:id/records  — Create record
PATCH  /api/tables/:id/records/:rid  — Update record
DELETE /api/tables/:id/records/:rid  — Delete record
POST   /api/tables/:id/records/bulk-delete  — Bulk delete

GET    /api/admin/users         — All users (admin)
PATCH  /api/admin/users/:id     — Update role/status (admin)
GET    /api/admin/audit-log     — Audit trail (admin)
GET    /api/admin/usage         — Free-tier usage dashboard (admin)
GET    /api/admin/stats         — System statistics (admin)
```

### Worker Setup

```bash
cd worker

# Install dependencies
pnpm install

# Create D1 database
npx wrangler d1 create dataos-db
# Copy the database_id into wrangler.toml

# Create KV namespace
npx wrangler kv namespace create KV
# Copy the namespace id into wrangler.toml

# Run migrations
pnpm db:migrate        # local
pnpm db:migrate:prod   # production

# Seed sample data
pnpm db:seed           # local
pnpm db:seed:prod      # production

# Dev server (http://localhost:8787)
pnpm dev

# Deploy to Cloudflare
pnpm deploy
```

---

## 🚀 Deployment (Zero Cost)

### Environment Variables

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `VITE_API_URL` | Frontend (.env / Vercel) | No | Worker API URL (empty = mock mode) |
| `VITE_FEATURE_AI` | Frontend (.env / Vercel) | No | Enable AI features (default: false) |
| `CORS_ORIGIN` | Worker (wrangler.toml / CF dashboard) | Yes | Frontend URL for CORS |
| `CLOUDFLARE_WORKERS_TOKEN` | GitHub secret | Deploy | CF API token |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub secret | Deploy | CF account ID |
| `VERCEL_TOKEN` | GitHub secret | Optional | Vercel CLI deploy |

### Frontend → Vercel Hobby (Free)

**Option A: Vercel GitHub Integration (recommended)**

1. Go to [vercel.com/new](https://vercel.com/new) → Import this repo
2. Set **Framework Preset** to **Vite**
3. Set **Root Directory** to `/` (the repo root)
4. Set **Build Command** to `pnpm build`
5. Set **Output Directory** to `dist`
6. Add env var: `VITE_API_URL` = your Worker URL
7. Deploy — live at your Vercel domain

**Option B: Vercel CLI**

```bash
npx vercel --prod
```

**Option C: GitHub Actions**

See `.github/workflows/deploy-vercel.yml` — set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as GitHub secrets.

### Backend → Cloudflare Workers (Free)

```bash
cd worker

# One-time setup: create D1 database + KV namespace
npx wrangler d1 create dataos-db
# Copy database_id into wrangler.toml

npx wrangler kv namespace create KV
# Copy namespace id into wrangler.toml

# Run migrations + seed
pnpm db:migrate:prod
pnpm db:seed:prod

# Deploy
pnpm deploy
```

The API will be live at `https://dataos-api.<account>.workers.dev`.

### CI/CD (GitHub Actions)

The CI pipeline (`.github/workflows/ci.yml`) automatically:

1. **Lint** — ESLint
2. **TypeScript** — strict type checking
3. **Tests** — Vitest (103 unit tests)
4. **Build** — Vite production build
5. **E2E** — Playwright smoke tests (chromium)
6. **Deploy Worker** — Cloudflare Workers (main branch push only)

Required GitHub Secrets:
- `CLOUDFLARE_WORKERS_TOKEN` — API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID
- `VERCEL_TOKEN` — (optional) For Vercel CLI deploys

---

## � Troubleshooting

| Problem | Solution |
|---------|----------|
| `pnpm install` fails | Ensure pnpm 9+ and Node 22+: `corepack enable` |
| Build warnings about chunk size | Safe to ignore — large vendor chunks are code-split |
| Worker won't start locally | Run `cd worker && pnpm install` separately |
| Tests fail with crypto errors | Ensure Node 22+ (Web Crypto is built-in) |
| Vercel deploy uses wrong framework | Set Framework Preset = Vite, Output Directory = dist |
| Can't connect frontend to Worker | Set `VITE_API_URL=http://localhost:8787` in `.env` |
| Feature X is disabled | Check feature flags in `.env` (all OFF by default for zero cost) |

---

## �📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive technical documentation
  - System design & modules
  - Data model details
  - API specifications
  - Performance strategies
  - Security considerations
- **[SECURITY.md](./SECURITY.md)** - Code scanning policy & vulnerability reporting
- **[CHANGELOG.md](./CHANGELOG.md)** - Release history & migration notes
- **[org/](./org/)** - Org-wide templates (reusable workflows, checklists)

---

## 📄 License

This is a demonstration project. For production use, implement proper licensing.

---

## 🙏 Acknowledgments

Built with modern tools and inspired by the best:

- **Airtable** - Pioneering the database-as-spreadsheet model
- **Notion** - Showing the power of flexible workspaces
- **Linear** - Setting the bar for product design
- **Superhuman** - Proving AI can be delightful

---

## 📧 Contact

For enterprise inquiries, architecture questions, or collaboration:

- **Demo**: Coming Soon
- **Docs**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **GitHub**: See repository root

---

### Built for the next generation of enterprise teams

[Get Started](#-getting-started) · [Read Docs](./ARCHITECTURE.md)
