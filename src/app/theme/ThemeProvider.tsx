import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

// ─── Theme System ────────────────────────────────────────────
// Uses CSS-class-based approach: `.dark` on <html> toggles all
// CSS variables defined in theme.css.  No inline JS vars needed.

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'dark' | 'light') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', resolved);
  // Set meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0d1117' : '#f8fafc');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettingsStore();
  const mode: ThemeMode = settings.themeMode || 'dark';

  const resolved: 'dark' | 'light' = useMemo(() => {
    if (mode === 'system') return getSystemPreference();
    return mode;
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    updateSettings({ themeMode: m });
  }, [updateSettings]);

  // Apply theme class on mount and when resolved changes
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemPreference());
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
