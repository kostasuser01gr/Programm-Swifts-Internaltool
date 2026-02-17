// ─── Premium Command Palette (⌘K) ──────────────────────────
// Global overlay with fuzzy search, navigation, actions, recents.
// Uses theme tokens — no hardcoded gray-* classes.

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Search, ArrowRight, LayoutDashboard, MessageSquare, Car,
  Droplets, Gamepad2, Settings, Database, Moon, Sun, Monitor,
  Plus, FileDown, FileUp, Users, ShieldCheck, Clock,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useTheme } from '../../theme/ThemeProvider';

// ── Types ─────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** Extra context-specific actions injected by the current page */
  extraActions?: CommandItem[];
}

// ── Built-in Actions ──────────────────────────────────────

function useBuiltInActions(onClose: () => void): CommandItem[] {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  return useMemo(() => [
    // Navigation
    { id: 'nav-dash', label: 'Go to Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Navigation', action: () => go('/'), keywords: ['home', 'overview'] },
    { id: 'nav-data', label: 'Go to Data Workspace', icon: <Database className="w-4 h-4" />, category: 'Navigation', action: () => go('/data'), keywords: ['table', 'grid'] },
    { id: 'nav-chat', label: 'Go to Chat', icon: <MessageSquare className="w-4 h-4" />, category: 'Navigation', action: () => go('/chat'), keywords: ['message', 'conversation'] },
    { id: 'nav-fleet', label: 'Go to Fleet', icon: <Car className="w-4 h-4" />, category: 'Navigation', action: () => go('/fleet'), keywords: ['vehicle', 'car'] },
    { id: 'nav-wash', label: 'Go to Wash Operations', icon: <Droplets className="w-4 h-4" />, category: 'Navigation', action: () => go('/washer'), keywords: ['clean', 'wash'] },
    { id: 'nav-game', label: 'Go to Training', icon: <Gamepad2 className="w-4 h-4" />, category: 'Navigation', action: () => go('/game'), keywords: ['play', 'learn'] },
    { id: 'nav-settings', label: 'Go to Settings', icon: <Settings className="w-4 h-4" />, category: 'Navigation', action: () => go('/settings'), keywords: ['preferences', 'profile'] },
    { id: 'nav-admin', label: 'Go to Admin', icon: <ShieldCheck className="w-4 h-4" />, category: 'Navigation', action: () => go('/admin'), keywords: ['users', 'audit'] },
    // Actions
    { id: 'act-new', label: 'Create New Record', icon: <Plus className="w-4 h-4" />, category: 'Actions', action: () => go('/data'), keywords: ['add', 'create'] },
    { id: 'act-import', label: 'Import Data', icon: <FileDown className="w-4 h-4" />, category: 'Actions', action: () => go('/data'), keywords: ['csv', 'upload'] },
    { id: 'act-export', label: 'Export Data', icon: <FileUp className="w-4 h-4" />, category: 'Actions', action: () => go('/data'), keywords: ['download', 'csv'] },
    // Theme
    {
      id: 'theme-toggle',
      label: `Theme: ${mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System'}`,
      description: 'Cycle dark → light → system',
      icon: mode === 'dark' ? <Moon className="w-4 h-4" /> : mode === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />,
      category: 'Preferences',
      action: () => {
        const cycle: Record<string, 'light' | 'dark' | 'system'> = { dark: 'light', light: 'system', system: 'dark' };
        setMode(cycle[mode]);
      },
      keywords: ['dark', 'light', 'theme', 'appearance'],
    },
  ], [go, mode, setMode]);
}

// ── Fuzzy Match ───────────────────────────────────────────

function fuzzyMatch(query: string, item: CommandItem): boolean {
  const q = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(q) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    item.category.toLowerCase().includes(q) ||
    (item.keywords?.some(k => k.includes(q)) ?? false)
  );
}

// ── Component ─────────────────────────────────────────────

export function CommandPalette({ isOpen, onClose, extraActions = [] }: CommandPaletteProps) {
  const builtIn = useBuiltInActions(onClose);
  const allActions = useMemo(() => [...builtIn, ...extraActions], [builtIn, extraActions]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Cmd+K listener (backup — main listener is in AppShell)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Filter
  const filtered = query.trim()
    ? allActions.filter(item => fuzzyMatch(query, item))
    : allActions;

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      (map[item.category] ??= []).push(item);
    });
    return map;
  }, [filtered]);

  // Flatten for keyboard nav
  const flat = filtered;

  // scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flat.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flat[selectedIndex]) {
          flat[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-[scaleIn_0.15s_ease-out]">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </div>
              {items.map(item => {
                const idx = flat.indexOf(item);
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 text-foreground',
                    )}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isActive && <ArrowRight className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
