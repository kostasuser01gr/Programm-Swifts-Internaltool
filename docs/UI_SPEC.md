# DataOS — UI Specification

> Living design document. Updated alongside component changes.

---

## 1. Design Philosophy

**Premium SaaS dashboard** inspired by high-end dark analytics dashboards (Linear, Vercel, Raycast) with subtle **aurora glass accents**. Dark-first, light mode via `.dark` class toggle on `<html>`.

### Principles

| Principle | Implementation |
|-----------|---------------|
| **Dark-first** | oklch colors, deep navy backgrounds, luminous text |
| **Glass morphism** | `--glass-bg`, `backdrop-filter: blur(20px)`, aurora gradient borders |
| **Perceptual uniformity** | oklch color space across all semantic tokens |
| **Accessibility** | `prefers-reduced-motion` disables all transitions; WCAG AA contrast ratios |
| **Token-driven** | Zero hardcoded colors; all values flow from `tokens.css` → `theme.css` → Tailwind v4 |

---

## 2. Design Tokens

### Source Files

| File | Purpose |
|------|---------|
| `src/styles/tokens.css` | Layout, z-index, spacing, typography, radius, shadows |
| `src/styles/theme.css` | Color palette (light + dark), Tailwind v4 `@theme inline` mapping |
| `src/styles/fonts.css` | Inter + JetBrains Mono via Google Fonts CDN |
| `src/styles/index.css` | Keyframe animations, scrollbar, selection, base layer |

### Z-Index Scale

```
--z-base       :    1   — Normal flow
--z-dropdown   :  100   — Dropdowns, popovers
--z-sticky     :  200   — Sticky headers
--z-sidebar    :  400   — Sidebar overlay
--z-overlay    :  500   — Backdrop overlays
--z-modal      :  600   — Modal dialogs
--z-inspector  :  700   — Inspector panel
--z-fab        :  800   — Floating action buttons
--z-nav        :  900   — Top navigation
--z-toast      : 1000   — Toast notifications
--z-tooltip    : 1100   — Tooltips
--z-cmd        : 1200   — Command palette
--z-max        : 9999   — Emergency override
```

### Spacing (4px base grid)

`--space-{0|px|0.5|1|1.5|2|2.5|3|4|5|6|8|10|12|16|20}` maps to `0px` → `80px`.

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system fallback | All UI text |
| `--font-mono` | JetBrains Mono, Cascadia Code | Code, IDs, monospace data |
| `--text-2xs` – `--text-4xl` | 0.625rem – 3rem | 10px – 48px |
| `--weight-light` – `--weight-bold` | 300 – 700 | |
| `--leading-tight` – `--leading-relaxed` | 1.2 – 1.625 | Line height |

### Border Radius

```
--radius-sm   :  6px   — Small chips, tags
--radius-md   : 10px   — Inputs, cards
--radius-lg   : 14px   — Panels, modals
--radius-xl   : 20px   — Hero cards
--radius-full : 9999px — Avatars, pills
```

### Transitions

```
--duration-instant  :  50ms   — Hover states
--duration-fast     : 100ms   — Hover color changes
--duration-normal   : 200ms   — Default transition
--duration-moderate : 300ms   — Panel slides
--duration-slow     : 400ms   — Page transitions
--duration-slower   : 600ms   — Complex animations

Easing: --ease-in-out, --ease-spring, --ease-out, --ease-in
```

### Color Palette

#### Light Mode (`:root`)

| Token | Role |
|-------|------|
| `--background` | Page bg `#f8fafc` |
| `--foreground` | Body text, oklch deep |
| `--primary` | Brand indigo (oklch 0.48 0.22 264) |
| `--muted` / `--muted-foreground` | Subdued surfaces / text |
| `--destructive` | Error red |
| `--success` | Green indicators |
| `--warning` | Amber alerts |
| `--info` | Blue informational |
| `--glass-bg` | `rgba(255,255,255,0.72)` + blur |
| `--aurora-gradient` | Subtle pastel gradient |

#### Dark Mode (`.dark`)

| Token | Role |
|-------|------|
| `--background` | Deep navy oklch(0.13 0.015 265) |
| `--primary` | Brighter indigo oklch(0.65 0.24 264) |
| `--glass-bg` | oklch(0.15 0.02 265 / 0.72) |
| `--aurora-gradient` | Luminous indigo→teal→magenta |

### Shadows

```
--shadow-xs    — Subtle lift (1px)
--shadow-sm    — Light card elevation
--shadow-md    — Dropdowns (4px blur)
--shadow-lg    — Modals (8px)
--shadow-xl    — Hero cards (20px)
--shadow-glow  — Indigo glow (accent highlight)
--shadow-glow-lg — Large ambient glow
```

### Shell Layout

```
--sidebar-width     : 260px   — Expanded sidebar
--sidebar-collapsed :  64px   — Icon-only sidebar
--topbar-height     :  52px   — Top bar
--inspector-width   : 420px   — Right-side inspector panel
--nav-height        :  56px   — Bottom nav (mobile)
```

---

## 3. Shell Architecture

### Layout Regions

```
┌──────────────────────────────────────────────────────────┐
│ TopBar (--topbar-height: 52px)                           │
│ ┌──────┐ breadcrumb / page title    ┌────────┐ ┌──────┐ │
│ │ logo │                            │ search │ │avatar│ │
│ └──────┘                            └────────┘ └──────┘ │
├────────┬─────────────────────────────────┬───────────────┤
│Sidebar │        Main Content Area        │  Inspector    │
│ 260px  │                                 │   420px       │
│ (coll. │        <Outlet />               │  (optional)   │
│  64px) │                                 │               │
│        │                                 │               │
│ nav    │                                 │ tabbed detail │
│ items  │                                 │   panel       │
│        │                                 │               │
└────────┴─────────────────────────────────┴───────────────┘
```

### Components

| Component | File | Role |
|-----------|------|------|
| **AppShell** | `components/shell/AppShell.tsx` | Sidebar + topbar + inspector + outlet |
| **DashboardPage** | `components/shell/DashboardPage.tsx` | KPI cards, sparklines, heatmap, activity |
| **InspectorPanel** | `components/shell/InspectorPanel.tsx` | Tabbed record details (overview / activity) |
| **NotificationCenter** | `components/shell/NotificationCenter.tsx` | Sheet-based inbox with filters |
| **CommandPalette** | `components/shell/CommandPalette.tsx` | Global ⌘K search + actions |
| **LoginPage** | `components/shell/LoginPage.tsx` | Premium auth (sign in / sign up) |
| **AdminPage** | `components/shell/AdminPage.tsx` | Users table + audit log tabs |
| **ErrorPages** | `components/shell/ErrorPages.tsx` | Branded 404 + 500 |
| **ThemeProvider** | `theme/ThemeProvider.tsx` | CSS class toggle, persists to localStorage |

---

## 4. Navigation Map

### Routes (react-router v7)

| Path | Component | Lazy | Description |
|------|-----------|------|-------------|
| `/` | `DashboardPage` | ✗ | Home dashboard |
| `/data` | `App` (DataWorkspace) | ✓ | Grid/Kanban/Calendar workspace |
| `/fleet` | `FleetTool` | ✓ | Fleet management |
| `/games` | `GamePage` | ✓ | Gamification hub |
| `/chat` | `ChatPage` | ✓ | AI chat assistant |
| `/wash` | `WashPortal` | ✓ | Wash portal |
| `/washer` | `WasherApp` | ✓ | Washer operations |
| `/settings` | `SettingsPanel` | ✓ | User & system settings |
| `/admin` | `AdminPage` | ✓ | Admin users + audit log |
| `*` | `NotFoundPage` | ✗ | 404 error page |

### Sidebar Nav Items

9 items: Dashboard, Data, Fleet, Games, Chat, Wash, Washer, Settings, Admin.

---

## 5. Interactive Panels

### Command Palette (`⌘K` / `Ctrl+K`)

- **Trigger**: Global keyboard shortcut or search icon in topbar.
- **Z-index**: `--z-cmd` (1200) — above everything.
- **Behavior**: Opens as modal overlay with backdrop; fuzzy search across label + description + keywords; grouped by category (Navigation, Actions); keyboard nav (↑↓ Enter Esc).
- **Built-in actions**: Navigate to all routes, toggle theme, create/import/export workspace.

### Inspector Panel

- **Position**: Right side, 420px width.
- **Toggle**: Click on a record or inspection target.
- **Tabs**: Overview (field display grid), Activity (timeline with icons).
- **Animation**: Slide in from right, `var(--duration-moderate)`.

### Notification Center

- **Trigger**: Bell icon in topbar.
- **Type**: Sheet (slides in from right via shadcn Sheet).
- **Filters**: All / Unread toggle.
- **Actions**: Mark individual read, mark all read, dismiss.

---

## 6. Component Library (shadcn/ui)

49 shadcn/ui components installed (Radix UI primitives + Tailwind styling):

**Layout**: Card, Separator, Sheet, ScrollArea, Collapsible, ResizablePanel, AspectRatio
**Navigation**: Tabs, NavigationMenu, Menubar, Breadcrumb, Pagination, Sidebar
**Forms**: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup, Label, Form, InputOTP, DatePicker, Calendar
**Feedback**: Dialog, AlertDialog, Drawer, Popover, Tooltip, HoverCard, Toast/Sonner, Progress, Skeleton, Badge, Alert, Avatar
**Data**: Table, Command, DataTable, Carousel, Accordion
**Overlay**: DropdownMenu, ContextMenu, CommandDialog

All components use semantic color tokens (`bg-primary`, `text-muted-foreground`, etc.) — no hardcoded colors.

---

## 7. Animation Keyframes

Defined in `src/styles/index.css`:

| Keyframe | Usage |
|----------|-------|
| `fadeIn` | Toast, notification entries |
| `slideDown` | Inspector panel, dropdown content |
| `slideUp` | Sheet close animation |
| `scaleIn` | Command palette, modal entrance |
| `spin` | Loading spinners |
| `pulseGlow` | Live indicator dots |

All animations respect `prefers-reduced-motion: reduce` via `--duration-*` tokens set to 0.

---

## 8. Responsive Behavior

| Breakpoint | Sidebar | Inspector | Layout |
|------------|---------|-----------|--------|
| `≥ 1280px` | Full (260px) | Full (420px) | Side-by-side |
| `768–1279px` | Collapsed (64px) | Overlay | Content fills width |
| `< 768px` | Hidden (hamburger) | Full-screen modal | Stacked |

---

## 9. Accessibility

- **Focus management**: Visible focus rings (`--ring` token), tab order follows visual order.
- **Keyboard navigation**: All interactive elements reachable via Tab; modal trap focus.
- **Reduced motion**: All transition durations reset to 0ms via `@media (prefers-reduced-motion: reduce)`.
- **Color contrast**: oklch palette tuned for WCAG AA minimum (4.5:1 normal text, 3:1 large text).
- **Screen readers**: Semantic HTML (`nav`, `main`, `aside`), aria-labels on icon-only buttons, `role="dialog"` on modals.
- **High contrast**: Falls back to system colors via `forced-colors: active`.

---

## 10. Icon System

All icons from **lucide-react** (tree-shakeable, consistent 24×24 grid, 2px stroke).

Common icons used across the shell:

| Icon | Usage |
|------|-------|
| `LayoutDashboard` | Dashboard nav |
| `Database` | Data workspace |
| `Truck` | Fleet tool |
| `Gamepad2` | Games |
| `MessageSquare` | Chat |
| `Droplets` | Wash portal |
| `SprayCan` | Washer app |
| `Settings` | Settings |
| `ShieldCheck` | Admin panel |
| `Bell` | Notification center |
| `Search` | Command palette trigger |
| `Sun` / `Moon` | Theme toggle |
| `ChevronLeft` / `ChevronRight` | Sidebar collapse |

---

*Last updated: 2025*
