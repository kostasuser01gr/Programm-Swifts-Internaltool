import type { KeyboardEvent } from 'react';
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

// Tailwind classes used directly in JSX

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
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, idx: number) => {
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
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-slate-900/95 backdrop-blur-[10px] border-t border-slate-400/[0.08] pt-2 px-0 z-[8000]"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      role="navigation"
      aria-label="Κύρια πλοήγηση"
    >
      {NAV_ITEMS.map((item, idx) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <button
            key={item.id}
            data-nav-idx={idx}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl border-none bg-transparent cursor-pointer text-[10px] font-medium transition-all duration-200 min-w-14 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isActive ? 'text-blue-400 bg-blue-500/[0.08]' : 'text-slate-500'
            }`}
            onClick={() => navigate(item.path)}
            onKeyDown={e => handleKeyDown(e, idx)}
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            tabIndex={isActive ? 0 : -1}
          >
            <span className="text-[22px] relative" aria-hidden="true">
              {item.icon}
              {item.id === 'chat' && unreadTotal > 0 && !location.pathname.startsWith('/chat') && (
                <span
                  className="absolute -top-1 -right-2 min-w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none shadow-[0_0_0_2px_rgba(15,23,42,0.95)]"
                  aria-label={`${unreadTotal} μη αναγνωσμένα`}
                >
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-red-500/[0.15] bg-red-500/[0.05] text-red-500 cursor-pointer text-[11px] outline-none"
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
