// ─── Premium App Shell ──────────────────────────────────────
// Sidebar + Topbar + Content + optional Inspector panel layout.
// Responsive: sidebar collapses on mobile, topbar adapts.

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, MessageSquare, Car, Droplets, Gamepad2, Database, ShieldCheck,
  Settings, ChevronLeft, ChevronRight, Search, Bell, Command,
  LogOut, Moon, Sun, Monitor, User, PanelRightClose,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useDataMode } from '../../store/dataMode';
import { AuthGate } from '../auth/AuthGate';
import { PinLogin } from '../auth/PinLogin';
import { Button } from '../ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

// ── Navigation Items ──────────────────────────────────────

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

function useNavItems(): NavItem[] {
  const unread = useChatStore(s => s.getUnreadTotal());
  return [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data', path: '/data', label: 'Data', icon: Database },
    { id: 'chat', path: '/chat', label: 'Chat', icon: MessageSquare, badge: unread || undefined },
    { id: 'fleet', path: '/fleet', label: 'Fleet', icon: Car },
    { id: 'washer', path: '/washer', label: 'Wash Ops', icon: Droplets },
    { id: 'game', path: '/game', label: 'Training', icon: Gamepad2 },
    { id: 'admin', path: '/admin', label: 'Admin', icon: ShieldCheck },
    { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
  ];
}

// ── Sidebar ───────────────────────────────────────────────

function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = useNavItems();
  const { currentProfile, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[260px]',
      )}
      style={{ zIndex: 'var(--z-sidebar)' }}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border h-[52px] px-4 shrink-0',
        collapsed && 'justify-center px-2',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">D</span>
            </div>
            <span className="font-semibold text-sm text-sidebar-foreground truncate">DataOS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">D</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Main">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            const button = (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-colors duration-150',
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-5 justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">{button}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <React.Fragment key={item.id}>{button}</React.Fragment>;
          })}
        </TooltipProvider>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-lg p-2 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User */}
      {currentProfile && (
        <div className={cn(
          'border-t border-sidebar-border p-3 shrink-0',
          collapsed && 'flex justify-center p-2',
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50 w-full',
                collapsed ? 'justify-center p-2' : 'px-2 py-1.5',
              )}>
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                {!collapsed && (
                  <div className="text-left min-w-0">
                    <div className="text-xs font-medium text-sidebar-foreground truncate">
                      {currentProfile.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {currentProfile.role}
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────

function Topbar({
  sidebarCollapsed,
  onCommandPalette,
  onNotifications,
  notificationCount,
}: {
  sidebarCollapsed: boolean;
  onCommandPalette: () => void;
  onNotifications: () => void;
  notificationCount: number;
}) {
  const { mode, setMode, resolved } = useTheme();
  const location = useLocation();

  // Derive page title from route
  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/chat')) return 'Chat';
    if (path.startsWith('/fleet')) return 'Fleet';
    if (path.startsWith('/washer')) return 'Wash Operations';
    if (path.startsWith('/game')) return 'Training';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/base')) return 'Data';
    if (path.startsWith('/admin')) return 'Admin';
    return 'DataOS';
  })();

  const nextTheme = () => {
    const cycle: Record<string, 'light' | 'dark' | 'system'> = {
      dark: 'light', light: 'system', system: 'dark',
    };
    setMode(cycle[mode]);
  };

  const ThemeIcon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-[52px] border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 gap-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-[260px]',
      )}
      style={{ zIndex: 'var(--z-nav)' }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search / Cmd+K */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommandPalette}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg bg-muted/50"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 text-[10px] font-mono bg-background/80 border border-border rounded px-1 py-0.5">
            {navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" onClick={onCommandPalette} className="sm:hidden h-8 w-8">
          <Search className="w-4 h-4" />
        </Button>

        {/* Theme toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={nextTheme} className="h-8 w-8">
                <ThemeIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Theme: {mode}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <Button variant="ghost" size="icon" onClick={onNotifications} className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}

// ── Data Mode Badge ───────────────────────────────────────

function DataModeBadge({ mode }: { mode: 'api' | 'mock' | 'checking' }) {
  if (mode === 'api') return null; // Don't show when connected to real API
  return (
    <div className="fixed bottom-3 left-3 z-50">
      <Badge variant={mode === 'checking' ? 'secondary' : 'outline'} className="text-[10px] gap-1 opacity-60 hover:opacity-100 transition-opacity">
        {mode === 'checking' && (
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
        )}
        {mode === 'mock' && (
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        )}
        {mode === 'checking' ? 'Connecting...' : 'Demo Mode'}
      </Badge>
    </div>
  );
}

// ── Shell Layout ──────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
  /** External state for toggling inspector, notification, command palette panels */
  onCommandPalette?: () => void;
  onNotifications?: () => void;
  notificationCount?: number;
  /** Right-side panel content (Inspector, etc.) */
  inspector?: React.ReactNode;
  onCloseInspector?: () => void;
}

export function AppShell({
  children,
  onCommandPalette,
  onNotifications,
  notificationCount = 0,
  inspector,
  onCloseInspector,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Collapse sidebar on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main Area */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-[260px]',
        )}
      >
        {/* Topbar */}
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onCommandPalette={onCommandPalette ?? (() => {})}
          onNotifications={onNotifications ?? (() => {})}
          notificationCount={notificationCount}
        />

        {/* Content + Inspector */}
        <div className="flex flex-1 pt-[52px] overflow-hidden">
          {/* Main content */}
          <main
            className={cn(
              'flex-1 overflow-y-auto transition-all duration-300',
              inspector ? 'mr-0' : '',
            )}
          >
            {children}
          </main>

          {/* Inspector Panel (slide in from right) */}
          {inspector && (
            <aside
              className="w-[420px] max-w-[50vw] border-l border-border bg-card overflow-y-auto shrink-0 animate-[slideInRight_0.25s_ease-out]"
              style={{ zIndex: 'var(--z-inspector)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm">
                <h3 className="text-sm font-semibold">Inspector</h3>
                {onCloseInspector && (
                  <Button variant="ghost" size="icon" onClick={onCloseInspector} className="h-7 w-7">
                    <PanelRightClose className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {inspector}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Premium Platform Shell (wraps auth + shell) ───────────

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const { isAuthenticated, currentProfile, checkSessionExpiry, session } = useAuthStore();
  const dataMode = useDataMode();
  const navigate = useNavigate();
  const [sessionWarning, setSessionWarning] = useState(false);

  // Session expiry check (mock/PIN mode only)
  useEffect(() => {
    if (dataMode.mode === 'api') return;
    if (!isAuthenticated || !session) return;
    const interval = setInterval(() => {
      const expired = checkSessionExpiry();
      if (expired) { navigate('/'); return; }
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      setSessionWarning(remaining > 0 && remaining < 15 * 60 * 1000);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, session, checkSessionExpiry, navigate, dataMode.mode]);

  const handleLogin = useCallback(() => {
    const prefs = useAuthStore.getState().currentProfile?.preferences;
    if (prefs?.defaultView === 'chat') navigate('/chat');
    else if (prefs?.defaultView === 'fleet') navigate('/fleet');
    else if (prefs?.defaultView === 'washer') navigate('/washer');
  }, [navigate]);

  // Auth gates
  if (!isAuthenticated && dataMode.mode === 'mock') {
    return <PinLogin onLogin={handleLogin} />;
  }

  if (dataMode.mode === 'api' || dataMode.mode === 'checking') {
    return (
      <AuthGate
        fallbackLogin={<PinLogin onLogin={handleLogin} />}
        onLogin={handleLogin}
      >
        <ShellWithWarning sessionWarning={sessionWarning} dataMode={dataMode.mode}>
          {children}
        </ShellWithWarning>
      </AuthGate>
    );
  }

  return (
    <ShellWithWarning sessionWarning={sessionWarning} dataMode={dataMode.mode}>
      {children}
    </ShellWithWarning>
  );
}

function ShellWithWarning({
  children,
  sessionWarning,
  dataMode,
}: {
  children: React.ReactNode;
  sessionWarning: boolean;
  dataMode: 'api' | 'mock' | 'checking';
}) {
  return (
    <>
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-[9500] bg-warning text-warning-foreground text-center text-xs font-semibold py-2 px-4 backdrop-blur-sm">
          Session expiring soon — save your work
        </div>
      )}
      {children}
      <DataModeBadge mode={dataMode} />
    </>
  );
}

export default PlatformShell;
