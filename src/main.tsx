import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { PlatformShell, AppShell } from "./app/components/shell/AppShell.tsx";
import { ErrorBoundary } from "./app/components/shared/ErrorBoundary.tsx";
import { ConnectivityMonitor } from "./app/components/shared/ConnectivityMonitor.tsx";
import { ToastProvider } from "./app/components/shared/ToastProvider.tsx";
import { I18nProvider } from "./app/i18n/I18nProvider.tsx";
import { ThemeProvider } from "./app/theme/ThemeProvider.tsx";
import { Toaster } from "./app/components/ui/sonner.tsx";
import { CommandPalette } from "./app/components/shell/CommandPalette.tsx";
import "./styles/index.css";

// ── Lazy-loaded pages ─────────────────────────────────────
const DashboardPage = lazy(() => import("./app/components/shell/DashboardPage.tsx"));
const DataApp = lazy(() => import("./app/App.tsx"));
const ChatPage = lazy(() => import("./app/components/chat/ChatPage.tsx"));
const FleetTool = lazy(() => import("./app/components/fleet/FleetTool.tsx"));
const WasherApp = lazy(() => import("./app/components/washer/WasherApp.tsx"));
const WashPortal = lazy(() => import("./app/components/washer/WashPortal.tsx"));
const SettingsPanel = lazy(() => import("./app/components/settings/SettingsPanel.tsx"));
const GamePage = lazy(() => import("./app/components/game/GamePage.tsx"));
const AdminPage = lazy(() => import("./app/components/shell/AdminPage.tsx"));

// ── Error pages ───────────────────────────────────────────
import { NotFoundPage } from "./app/components/shell/ErrorPages.tsx";

// ── Premium loading spinner (uses theme tokens) ──────────
const PageLoading = () => (
  <div className="flex flex-1 items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

// ── Public routes bypass auth ─────────────────────────────
const PUBLIC_ROUTES = ['/wash'];

function AppRoutes() {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const handleCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/wash" element={<Suspense fallback={<PageLoading />}><WashPortal /></Suspense>} />
      </Routes>
    );
  }

  return (
    <PlatformShell>
      <AppShell
        onCommandPalette={handleCommandPalette}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/fleet" element={<FleetTool />} />
            <Route path="/washer" element={<WasherApp />} />
            <Route path="/settings" element={<SettingsPanel />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/data" element={<DataApp />} />
            <Route path="/base/:baseId" element={<DataApp />} />
            <Route path="/base/:baseId/table/:tableId" element={<DataApp />} />
            <Route path="/base/:baseId/table/:tableId/view/:viewId" element={<DataApp />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>

      {/* Global command palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      <Toaster />
    </PlatformShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <ConnectivityMonitor>
              <AppRoutes />
            </ConnectivityMonitor>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
