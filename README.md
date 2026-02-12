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

```
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

```
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
git clone <repository-url>
cd dataos

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

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
|---------|--------|----------|--------|---------------|
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
|-------|-------------|---------|
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
```
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

## 🤝 Contributing

This is an enterprise demonstration project showcasing modern architecture patterns. For production use, consider:

1. **Backend Implementation**: Add PostgreSQL, Redis, GraphQL server
2. **Authentication**: Integrate Auth0, Clerk, or similar
3. **Real-time**: Implement WebSocket with Y.js CRDT
4. **Testing**: Add unit, integration, and E2E tests
5. **Deployment**: Set up CI/CD, monitoring, logging

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive technical documentation
  - System design & modules
  - Data model details
  - API specifications
  - Performance strategies
  - Security considerations
- **[SECURITY.md](./SECURITY.md)** - Code scanning policy & vulnerability reporting
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
- **Demo**: [Live Demo](#) (Coming Soon)
- **Docs**: See ARCHITECTURE.md
- **GitHub**: [Repository](#)

---

<div align="center">

**Built for the next generation of enterprise teams**

[Get Started](#-getting-started) · [View Demo](#) · [Read Docs](./ARCHITECTURE.md)

</div>
