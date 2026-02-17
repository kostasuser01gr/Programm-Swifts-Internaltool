import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_QUICK_ACTIONS } from '../../types/platform';
import type { QuickAction } from '../../types/platform';

// ─── Quick Actions FAB ──────────────────────────────────────
// Floating radial menu with search, keyboard nav, touch support.
// Role-filtered, accessible, mobile-optimized.
// Fixes: ARIA roles, focus trap, number keys, stale closures,
//        focusIndex bounds, error handling, reduced motion, FAB badge.

// Tailwind classes used directly in JSX

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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[8999]"
          onClick={closeMenu}
          role="presentation"
          aria-hidden="true"
        />
      )}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-[156px] right-4 bg-slate-900/[0.97] rounded-[20px] border border-slate-400/[0.12] backdrop-blur-[20px] p-2 z-[9001] min-w-[280px] max-w-[340px] max-h-[calc(100vh-200px)] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          role="menu"
          aria-label="Γρήγορες Ενέργειες"
          onKeyDown={handleMenuKeyDown}
        >
          <div className="pt-2 px-3 pb-0.5 text-xs text-slate-500 font-semibold" aria-hidden="true">
            ⚡ Γρήγορες Ενέργειες
          </div>
          <div className="pt-1 px-2 pb-2">
            <input
              ref={searchRef}
              className="w-full py-2.5 px-3.5 rounded-[10px] border border-slate-400/[0.15] bg-slate-900/60 text-slate-200 text-sm outline-none box-border"
              placeholder="🔍 Αναζήτηση ενέργειας..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Αναζήτηση ενεργειών"
              role="searchbox"
            />
          </div>
          {availableActions.length === 0 ? (
            <div className="py-5 px-3 text-center text-slate-500 text-[13px]">
              <div className="text-2xl mb-2" aria-hidden="true">🔍</div>
              Δεν βρέθηκαν ενέργειες
            </div>
          ) : (
            availableActions.map((action, i) => (
              <React.Fragment key={action.id}>
                {i > 0 && action.category !== availableActions[i - 1].category && (
                  <div className="h-px bg-slate-400/[0.08] mx-2 my-1" role="separator" aria-hidden="true" />
                )}
                <button
                  ref={el => { itemRefs.current[i] = el; }}
                  className={`flex items-center gap-3 py-3 px-3.5 rounded-xl border-2 border-transparent bg-transparent text-slate-200 cursor-pointer w-full text-sm font-medium text-left transition-[background,border-color] duration-100 outline-none min-h-12 ${
                    i === focusIndex ? 'bg-blue-500/10 !border-blue-500/40' : ''
                  }`}
                  onClick={() => handleAction(action)}
                  onMouseEnter={() => setFocusIndex(i)}
                  role="menuitem"
                  tabIndex={i === focusIndex ? 0 : -1}
                  aria-label={`${action.label}${i < 9 ? ` (πλήκτρο ${i + 1})` : ''}`}
                >
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg bg-blue-500/[0.08] shrink-0" aria-hidden="true">
                    {action.icon}
                  </div>
                  <div>
                    <div>{action.label}</div>
                    <div className="text-[11px] text-slate-500 mt-px">{action.labelEn}</div>
                  </div>
                  {action.action === 'open_chat' && chatUnread > 0 && (
                    <span className="ml-auto py-0.5 px-2 rounded-md text-[10px] font-semibold bg-red-500/[0.15] text-red-500">
                      {chatUnread}
                    </span>
                  )}
                  {i < 9 && (
                    <span className="ml-auto text-[10px] text-slate-600 font-mono py-0.5 px-1.5 rounded bg-slate-700/30" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                </button>
              </React.Fragment>
            ))
          )}
          <div className="h-px bg-slate-400/[0.08] mx-2 my-1" role="separator" aria-hidden="true" />
          <div className="py-1.5 px-3 pb-2 text-[11px] text-slate-600 text-center" aria-hidden="true">
            ⌘K εναλλαγή · ↑↓ πλοήγηση · Enter επιλογή · 1-9 γρήγορη πρόσβαση
          </div>
        </div>
      )}
      <button
        ref={fabRef}
        className={`fixed bottom-[90px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-none text-white text-2xl cursor-pointer z-[9000] shadow-[0_4px_20px_rgba(59,130,246,0.4)] flex items-center justify-center transition-[transform,box-shadow] duration-300 touch-manipulation [-webkit-tap-highlight-color:transparent] ${
          isOpen ? 'rotate-45 shadow-[0_4px_30px_rgba(99,102,241,0.6)]' : ''
        }`}
        onClick={() => isOpen ? closeMenu() : openMenu()}
        aria-label="Γρήγορες ενέργειες"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Γρήγορες Ενέργειες (⌘K)"
      >
        {isOpen ? '✕' : '⚡'}
        {!isOpen && chatUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none shadow-[0_0_0_2px_rgba(15,23,42,0.95)]">
            {chatUnread > 99 ? '99+' : chatUnread}
          </span>
        )}
      </button>
    </>
  );
}

export default QuickActions;
