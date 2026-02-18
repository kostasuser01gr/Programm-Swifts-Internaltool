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
                       ↕
┌─────────────────────────────────────────────────┐
│              STATE MANAGEMENT                    │
├─────────────────────────────────────────────────┤
│  React State │ Context │ Local Storage          │
└─────────────────────────────────────────────────┘
                       ↕
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
- Tailwind CSS v4
- Radix UI Components
- Lucide Icons
- Sonner (Toast Notifications)

**Planned Backend:**

- Node.js + Express/Fastify
- GraphQL (Apollo Server)
- PostgreSQL 15+ (Primary Data)
- Redis (Caching, Real-time)
- Socket.io (WebSocket)
- OpenAI API (AI Features)

---

## 📁 Project Structure

```text
/src
  /app
    /components
      /enterprise/         # Core platform components
        - Sidebar.tsx      # Workspace/base navigation
        - ViewToolbar.tsx  # View controls & filters
        - GridView.tsx     # Spreadsheet grid
        - KanbanView.tsx   # Kanban board
        - CalendarView.tsx # Calendar display
        - RecordDetail.tsx # Record editor panel
        - AIAssistant.tsx  # AI chat interface
      /ui/                 # Design system components
    /types/
      - index.ts           # TypeScript definitions
    /data/
      - mockData.ts        # Sample data
    App.tsx                # Main application
  /styles/                 # Global styles
ARCHITECTURE.md            # Detailed technical docs
README.md                  # This file
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

- Node.js 18+ or compatible runtime
- npm/pnpm/yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/kostasuser01gr/Programm-Swifts-Internaltool.git
cd Programm-Swifts-Internaltool

# Install all workspace dependencies (monorepo)
pnpm install

# Start the web app (Next.js)
cd apps/web && pnpm dev

# In another terminal — start the API (Cloudflare Worker)
cd apps/api && pnpm dev
```

The web app will be available at `http://localhost:3000` and the API at `http://localhost:8787`.

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

1. **Backend Implementation**: Cloudflare Workers + D1 (SQLite) backend in `apps/api/`
2. **Authentication**: PBKDF2-SHA256 session-based auth with role management
3. **Real-time**: Implement WebSocket with Y.js CRDT
4. **Testing**: Add unit, integration, and E2E tests
5. **Deployment**: Frontend on Vercel Hobby + Backend on Cloudflare Workers Free (zero cost)

---

## ☁️ Backend (Cloudflare Workers)

The `apps/api/` directory contains a full REST API backend powered by **Hono** (web framework), **Cloudflare D1** (SQLite), and **KV** (rate limiting & cache). All services run on the Cloudflare Workers Free plan — **€0 always**.

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
cd apps/api

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

# Dev server
pnpm dev

# Deploy
pnpm deploy
```

---

## 🚀 Deployment (Zero Cost)

### Frontend → Vercel Hobby (Free)

1. Push to GitHub
2. Import in [vercel.com/new](https://vercel.com/new) → Select this repo
3. Set **Root Directory** to `apps/web`
4. Framework: **Next.js** (auto-detected)
5. Environment variable: `NEXT_PUBLIC_API_URL` = your Worker URL (e.g., `https://internaltoolkit-api.<account>.workers.dev`)
6. Deploy — live at your Vercel domain

Or via CLI:

```bash
cd apps/web
npx vercel --prod
```

### Backend → Cloudflare Workers (Free)

```bash
cd apps/api
npx wrangler d1 create dataos-db
# Update wrangler.toml with database_id
npx wrangler kv namespace create KV
# Update wrangler.toml with kv namespace id

pnpm db:migrate:prod
pnpm db:seed:prod
pnpm deploy
```

The API will be live at `https://internaltoolkit-api.<account>.workers.dev`.

### CI/CD (GitHub Actions)

The CI pipeline (`.github/workflows/ci.yml`) automatically:
- **Lint** + **TypeScript check**
- **Security audit** dependencies
- **Run tests** (Vitest)
- **Build** frontend
- **Deploy frontend** to Cloudflare Pages (main branch)
- **Deploy Worker** API to Cloudflare Workers (main branch)

Required GitHub Secrets:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers + Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID
- `VERCEL_TOKEN` — (optional) For Vercel CLI deploys

---

## 📚 Documentation

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
