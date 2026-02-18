// ── Help / Docs Page ──────────────────────────────────────
// In-app documentation and help center.

import { useState } from 'react';
import {
  BookOpen, Search, ChevronRight, ExternalLink,
  LayoutDashboard, Database, MessageSquare, Car, Droplets,
  Gamepad2, ShieldCheck, Settings, Keyboard, HelpCircle,
} from 'lucide-react';
import { cn } from '../ui/utils';

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: DocItem[];
}

interface DocItem {
  title: string;
  content: string;
}

const DOCS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      {
        title: 'Overview',
        content: 'DataOS is an enterprise data platform combining spreadsheet flexibility with database power. Navigate using the sidebar (desktop) or bottom bar (mobile).',
      },
      {
        title: 'Workspaces & Bases',
        content: 'Organize your data into Workspaces (teams) and Bases (projects). Each Base contains Tables with customizable fields and views.',
      },
      {
        title: 'Keyboard Shortcuts',
        content: 'Press ⌘K (Mac) or Ctrl+K (Windows/Linux) to open the Command Palette. Use arrow keys to navigate, Enter to select.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      {
        title: 'KPI Cards',
        content: 'View key metrics at a glance — active projects, tasks completed, team activity, and more. Cards include sparklines for trend visualization.',
      },
      {
        title: 'Activity Feed',
        content: 'Track recent actions across all modules. Filter by type (records, users, system) and timeframe.',
      },
    ],
  },
  {
    id: 'data',
    title: 'Data Workspace',
    icon: Database,
    items: [
      {
        title: 'Grid View',
        content: 'Excel-like spreadsheet with inline editing, column resizing, sorting, and filtering. Supports 26+ field types.',
      },
      {
        title: 'Kanban View',
        content: 'Drag-and-drop workflow management. Group records by any single-select field.',
      },
      {
        title: 'Calendar View',
        content: 'Visualize date-based records on a monthly/weekly calendar. Click dates to create new records.',
      },
      {
        title: 'Filters & Sorts',
        content: 'Use the toolbar to add filters (contains, equals, greater than, etc.) and multi-level sorts. Filters apply in AND mode by default.',
      },
    ],
  },
  {
    id: 'chat',
    title: 'Team Chat',
    icon: MessageSquare,
    items: [
      {
        title: 'Channels',
        content: 'Organize conversations by topic. Create public or private channels. Mention team members with @.',
      },
      {
        title: 'Threads & Reactions',
        content: 'Reply in threads to keep conversations focused. React with emoji to acknowledge messages.',
      },
    ],
  },
  {
    id: 'fleet',
    title: 'Fleet Management',
    icon: Car,
    items: [
      {
        title: 'Vehicle Tracking',
        content: 'Monitor vehicle status (Available → Rented → Maintenance → Returned). Track mileage, fuel, and damage reports.',
      },
    ],
  },
  {
    id: 'wash-ops',
    title: 'Wash Operations',
    icon: Droplets,
    items: [
      {
        title: 'Wash Queue',
        content: 'Kanban-style workflow: Waiting → In Progress → Done → Inspected. Each wash has a checklist and photo capture.',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training (Games)',
    icon: Gamepad2,
    items: [
      {
        title: 'Trivia Quiz',
        content: 'Test knowledge with timed quizzes. Earn XP, unlock badges, and compete on the leaderboard.',
      },
      {
        title: 'Strategy Game',
        content: 'Turn-based resource management simulation. Make decisions that affect fleet, staff, budget, and rating.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    icon: ShieldCheck,
    items: [
      {
        title: 'User Management',
        content: 'Manage user roles (Admin, Manager, Supervisor, Staff, etc.). Invite new users, deactivate accounts.',
      },
      {
        title: 'Audit Logs',
        content: 'Full audit trail of all actions with actor, entity, timestamp, and IP address.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    items: [
      {
        title: 'Theme',
        content: 'Choose between Light, Dark, or System theme. The dark theme uses a premium glassmorphism design with neon accents.',
      },
      {
        title: 'Feature Flags',
        content: 'Enable/disable optional features (AI, Realtime, File Uploads). Disabled features have zero cost impact.',
      },
    ],
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    items: [
      {
        title: 'Global',
        content: '⌘K / Ctrl+K: Command Palette\n⌘Z / Ctrl+Z: Undo\n⌘⇧Z / Ctrl+Y: Redo\nEsc: Close panel/dialog',
      },
      {
        title: 'Data View',
        content: '↑↓←→: Navigate cells\nEnter: Edit cell\nTab: Next cell\nDelete: Clear cell\n⌘A: Select all',
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<DocItem | null>(null);

  const filtered = search.trim()
    ? DOCS.map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.content.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter(s => s.items.length > 0)
    : DOCS;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Sidebar / TOC */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border bg-muted/30 p-4 lg:p-6 overflow-y-auto shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Help & Docs</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search docs..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <nav className="space-y-1" aria-label="Documentation sections">
          {filtered.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(isActive ? null : section.id);
                  setActiveItem(null);
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{section.title}</span>
                <ChevronRight className={cn(
                  'w-4 h-4 ml-auto transition-transform shrink-0',
                  isActive && 'rotate-90',
                )} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {activeItem ? (
          <div className="max-w-2xl">
            <button
              onClick={() => setActiveItem(null)}
              className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold mb-4">{activeItem.title}</h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {activeItem.content}
            </p>
          </div>
        ) : activeSection ? (
          <div className="max-w-2xl">
            {filtered
              .filter(s => s.id === activeSection)
              .map(section => (
                <div key={section.id}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-primary" />
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.items.map(item => (
                      <button
                        key={item.title}
                        onClick={() => setActiveItem(item)}
                        className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{item.title}</h3>
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-2">Welcome to DataOS Help</h2>
            <p className="text-muted-foreground mb-6">
              Select a topic from the sidebar to browse documentation, or use the search bar to find specific answers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOCS.slice(0, 6).map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{section.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {section.items.length} article{section.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
