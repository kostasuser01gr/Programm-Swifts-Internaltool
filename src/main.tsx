import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import App from "./app/App.tsx";
import { PlatformShell } from "./app/components/shared/PlatformShell.tsx";
import { ErrorBoundary } from "./app/components/shared/ErrorBoundary.tsx";
import { ConnectivityMonitor } from "./app/components/shared/ConnectivityMonitor.tsx";
import { ToastProvider } from "./app/components/shared/ToastProvider.tsx";
import { I18nProvider } from "./app/i18n/I18nProvider.tsx";
import { ThemeProvider } from "./app/theme/ThemeProvider.tsx";
import { registerSW } from "./pwa/registerSW.ts";
import "./styles/index.css";

// Register service worker (moved from inline <script> to satisfy CSP)
registerSW();

const ChatPage = lazy(() => import("./app/components/chat/ChatPage.tsx"));
const FleetTool = lazy(() => import("./app/components/fleet/FleetTool.tsx"));
const WasherApp = lazy(() => import("./app/components/washer/WasherApp.tsx"));
const WashPortal = lazy(() => import("./app/components/washer/WashPortal.tsx"));
const SettingsPanel = lazy(() => import("./app/components/settings/SettingsPanel.tsx"));
const GamePage = lazy(() => import("./app/components/game/GamePage.tsx"));

const Loading = ({ label = "Φόρτωση..." }: { label?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#fff', fontSize: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span>{label}</span>
    </div>
  </div>
);

// ── Public routes bypass auth (external wash crew) ──
const PUBLIC_ROUTES = ['/wash'];

function AppRoutes() {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/wash" element={<Suspense fallback={<Loading label="Φόρτωση Πλυντηρίων..." />}><WashPortal /></Suspense>} />
      </Routes>
    );
  }

  return (
    <PlatformShell>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chat" element={<Suspense fallback={<Loading label="Φόρτωση Chat..." />}><ChatPage /></Suspense>} />
        <Route path="/fleet" element={<Suspense fallback={<Loading label="Φόρτωση Στόλου..." />}><FleetTool /></Suspense>} />
        <Route path="/washer" element={<Suspense fallback={<Loading label="Φόρτωση Πλυντηρίων..." />}><WasherApp /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<Loading label="Φόρτωση Ρυθμίσεων..." />}><SettingsPanel /></Suspense>} />
        <Route path="/game" element={<Suspense fallback={<Loading label="Φόρτωση Παιχνιδιού..." />}><GamePage /></Suspense>} />
        <Route path="/base/:baseId" element={<App />} />
        <Route path="/base/:baseId/table/:tableId" element={<App />} />
        <Route path="/base/:baseId/table/:tableId/view/:viewId" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
