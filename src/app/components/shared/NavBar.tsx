import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

// ─── Navigation Bar ──────────────────────────────────────────
// Bottom nav with role-based menu items. Mobile-first. Accessible.

const NAV_ITEMS = [
  { id: 'home',     path: '/',          label: 'Πίνακας',      icon: '📊', requiredPerm: null },
  { id: 'chat',     path: '/chat',      label: 'Chat',         icon: '💬', requiredPerm: null },
  { id: 'fleet',    path: '/fleet',     label: 'Στόλος',       icon: '🚗', requiredPerm: 'canManageFleet' as const },
  { id: 'washer',   path: '/washer',    label: 'Πλυντήρια',   icon: '🚿', requiredPerm: 'canAccessWasherApp' as const },
  { id: 'game',     path: '/game',      label: 'Παιχνίδι',    icon: '🎮', requiredPerm: null },
  { id: 'settings', path: '/settings',  label: 'Ρυθμίσεις',   icon: '⚙️', requiredPerm: null },
];

const nv: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(148,163,184,0.08)',
    padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
    zIndex: 8000,
  },
  item: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: 2, padding: '6px 16px', borderRadius: 12,
    border: 'none', background: 'none', cursor: 'pointer',
    color: '#64748b', fontSize: 10, fontWeight: 500,
    transition: 'all 0.2s', minWidth: 56,
    outline: 'none',
  },
  itemActive: {
    color: '#60a5fa', background: 'rgba(59,130,246,0.08)',
  },
  itemFocus: {
    boxShadow: '0 0 0 2px rgba(59,130,246,0.5)',
  },
  icon: {
    fontSize: 22,
  },
  logout: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid rgba(239,68,68,0.15)',
    background: 'rgba(239,68,68,0.05)', color: '#ef4444',
    cursor: 'pointer', fontSize: 11, outline: 'none',
  },
};

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProfile, logout } = useAuthStore();
  const unreadTotal = useChatStore(s => s.getUnreadTotal());

  if (!currentProfile) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Keyboard nav: arrow keys between tabs
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const items = NAV_ITEMS;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      const btn = document.querySelector(`[data-nav-idx="${next}"]`) as HTMLElement;
      btn?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      const btn = document.querySelector(`[data-nav-idx="${prev}"]`) as HTMLElement;
      btn?.focus();
    }
  };

  return (
    <nav style={nv.bar} role="navigation" aria-label="Κύρια πλοήγηση">
      {NAV_ITEMS.map((item, idx) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <button
            key={item.id}
            data-nav-idx={idx}
            style={{ ...nv.item, ...(isActive ? nv.itemActive : {}) }}
            onClick={() => navigate(item.path)}
            onKeyDown={e => handleKeyDown(e, idx)}
            onFocus={e => Object.assign(e.currentTarget.style, { boxShadow: '0 0 0 2px rgba(59,130,246,0.5)' })}
            onBlur={e => Object.assign(e.currentTarget.style, { boxShadow: 'none' })}
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            tabIndex={isActive ? 0 : -1}
          >
            <span style={{ ...nv.icon, position: 'relative' }} aria-hidden="true">
              {item.icon}
              {item.id === 'chat' && unreadTotal > 0 && !location.pathname.startsWith('/chat') && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#ef4444', color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', lineHeight: 1,
                  boxShadow: '0 0 0 2px rgba(15,23,42,0.95)',
                }} aria-label={`${unreadTotal} μη αναγνωσμένα`}>
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        style={nv.logout}
        onClick={handleLogout}
        aria-label="Αποσύνδεση"
        title="Αποσύνδεση"
      >
        🚪
      </button>
    </nav>
  );
}

export default NavBar;
