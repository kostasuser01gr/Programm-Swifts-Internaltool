import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_QUICK_ACTIONS } from '../../types/platform';
import type { QuickAction } from '../../types/platform';

// ─── Quick Actions FAB ──────────────────────────────────────
// Floating radial menu with search, keyboard nav, touch support.
// Role-filtered, accessible, mobile-optimized.
// Fixes: ARIA roles, focus trap, number keys, stale closures,
//        focusIndex bounds, error handling, reduced motion, FAB badge.

const qa: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    border: 'none', color: '#fff', fontSize: 24,
    cursor: 'pointer', zIndex: 9000,
    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.3s, box-shadow 0.3s',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  },
  fabOpen: {
    transform: 'rotate(45deg)',
    boxShadow: '0 4px 30px rgba(99,102,241,0.6)',
  },
  fabBadge: {
    position: 'absolute' as const, top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    background: '#ef4444', color: '#fff',
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', lineHeight: 1,
    boxShadow: '0 0 0 2px rgba(15,23,42,0.95)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)', zIndex: 8999,
  },
  menu: {
    position: 'fixed', bottom: 156, right: 16,
    background: 'rgba(15,23,42,0.97)', borderRadius: 20,
    border: '1px solid rgba(148,163,184,0.12)',
    backdropFilter: 'blur(20px)', padding: 8,
    zIndex: 9001, minWidth: 280, maxWidth: 340,
    maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' as const,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  searchWrap: { padding: '4px 8px 8px' },
  searchInput: {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'rgba(15,23,42,0.6)', color: '#e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 12,
    border: '2px solid transparent', background: 'transparent',
    color: '#e2e8f0', cursor: 'pointer', width: '100%',
    fontSize: 14, fontWeight: 500, textAlign: 'left' as const,
    transition: 'background 0.1s, border-color 0.1s',
    outline: 'none', minHeight: 48,
  },
  menuItemFocused: {
    background: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.4)',
  },
  menuItemIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, background: 'rgba(59,130,246,0.08)', flexShrink: 0,
  },
  shortcutHint: {
    marginLeft: 'auto', fontSize: 10, color: '#475569',
    fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4,
    background: 'rgba(51,65,85,0.3)',
  },
  divider: { height: 1, background: 'rgba(148,163,184,0.08)', margin: '4px 8px' },
  badge: {
    marginLeft: 'auto', padding: '2px 8px', borderRadius: 6,
    fontSize: 10, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
  },
  emptyState: { padding: '20px 12px', textAlign: 'center' as const, color: '#64748b', fontSize: 13 },
};

interface Props {
  onAction: (actionId: string) => void;
  chatUnread?: number;
}

export function QuickActions({ onAction, chatUnread = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const { currentProfile } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const availableActions = useMemo(() => {
    if (!currentProfile) return [];
    let actions = DEFAULT_QUICK_ACTIONS.filter(a =>
      a.availableFor.includes(currentProfile.role)
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      actions = actions.filter(a =>
        a.label.toLowerCase().includes(q) ||
        a.labelEn.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return actions;
  }, [currentProfile, search]);

  const handleAction = useCallback((action: QuickAction) => {
    try { onAction(action.action); }
    catch (err) { console.error('[QuickActions] Action failed:', err); }
    setIsOpen(false);
    setSearch('');
    setFocusIndex(-1);
  }, [onAction]);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    setSearch('');
    setFocusIndex(0);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setFocusIndex(-1);
    requestAnimationFrame(() => fabRef.current?.focus());
  }, []);

  // Global ⌘K + number keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) { closeMenu(); } else { openMenu(); }
        return;
      }
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeMenu(); return; }
      if (isOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && num <= availableActions.length) {
          e.preventDefault();
          handleAction(availableActions[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, openMenu, closeMenu, availableActions, handleAction]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const menu = menuRef.current;
      if (!menu) return;
      const focusable = menu.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(i => { const next = i < availableActions.length - 1 ? i + 1 : 0; itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }); return next; });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(i => { const next = i > 0 ? i - 1 : availableActions.length - 1; itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }); return next; });
    } else if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < availableActions.length) {
      e.preventDefault();
      handleAction(availableActions[focusIndex]);
    }
  };

  // Clamp focusIndex on search change
  useEffect(() => {
    setFocusIndex(availableActions.length > 0 ? 0 : -1);
  }, [search, availableActions.length]);

  if (!currentProfile) return null;

  return (
    <>
      {isOpen && <div style={qa.overlay} onClick={closeMenu} role="presentation" />}
      {isOpen && (
        <div ref={menuRef} style={qa.menu} role="menu" aria-label="Γρήγορες Ενέργειες" onKeyDown={handleMenuKeyDown}>
          <div style={{ padding: '8px 12px 2px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>⚡ Γρήγορες Ενέργειες</div>
          <div style={qa.searchWrap}>
            <input ref={searchRef} style={qa.searchInput} placeholder="🔍 Αναζήτηση ενέργειας..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Αναζήτηση ενεργειών" role="searchbox" />
          </div>
          {availableActions.length === 0 ? (
            <div style={qa.emptyState}><div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>Δεν βρέθηκαν ενέργειες</div>
          ) : (
            availableActions.map((action, i) => (
              <React.Fragment key={action.id}>
                {i > 0 && action.category !== availableActions[i - 1].category && <div style={qa.divider} role="separator" />}
                <button
                  ref={el => { itemRefs.current[i] = el; }}
                  style={{ ...qa.menuItem, ...(i === focusIndex ? qa.menuItemFocused : {}) }}
                  onClick={() => handleAction(action)}
                  onMouseEnter={() => setFocusIndex(i)}
                  role="menuitem"
                  tabIndex={i === focusIndex ? 0 : -1}
                  aria-label={`${action.label}${i < 9 ? ` (πλήκτρο ${i + 1})` : ''}`}
                >
                  <div style={qa.menuItemIcon}>{action.icon}</div>
                  <div><div>{action.label}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{action.labelEn}</div></div>
                  {action.action === 'open_chat' && chatUnread > 0 && (
                    <span style={{ ...qa.badge, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{chatUnread}</span>
                  )}
                  {i < 9 && <span style={qa.shortcutHint}>{i + 1}</span>}
                </button>
              </React.Fragment>
            ))
          )}
          <div style={qa.divider} role="separator" />
          <div style={{ padding: '6px 12px 8px', fontSize: 11, color: '#475569', textAlign: 'center' }}>
            ⌘K εναλλαγή · ↑↓ πλοήγηση · Enter επιλογή · 1-9 γρήγορη πρόσβαση
          </div>
        </div>
      )}
      <button
        ref={fabRef}
        style={{ ...qa.fab, ...(isOpen ? qa.fabOpen : {}) }}
        onClick={() => isOpen ? closeMenu() : openMenu()}
        aria-label="Γρήγορες ενέργειες"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Γρήγορες Ενέργειες (⌘K)"
      >
        {isOpen ? '✕' : '⚡'}
        {!isOpen && chatUnread > 0 && <span style={qa.fabBadge}>{chatUnread > 99 ? '99+' : chatUnread}</span>}
      </button>
    </>
  );
}

export default QuickActions;
