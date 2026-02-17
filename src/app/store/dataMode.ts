// ─── Data Mode Provider ──────────────────────────────────────
// Determines whether the app uses real API or mock data.
// When VITE_API_URL is set, use real Worker API.
// When not set or API unreachable, fall back to mock data gracefully.

import { create } from 'zustand';
import { healthApi } from '../api/client';

export type DataMode = 'api' | 'mock' | 'checking';

interface DataModeState {
  mode: DataMode;
  apiUrl: string;
  apiHealthy: boolean;
  lastCheck: number;
  setMode: (mode: DataMode) => void;
  checkApi: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const useDataMode = create<DataModeState>((set) => ({
  mode: API_URL ? 'checking' : 'mock',
  apiUrl: API_URL,
  apiHealthy: false,
  lastCheck: 0,

  setMode: (mode) => set({ mode }),

  checkApi: async () => {
    if (!API_URL) {
      set({ mode: 'mock', apiHealthy: false });
      return;
    }

    set({ mode: 'checking' });

    try {
      const res = await healthApi.check();
      if (res.ok) {
        set({ mode: 'api', apiHealthy: true, lastCheck: Date.now() });
      } else {
        set({ mode: 'mock', apiHealthy: false, lastCheck: Date.now() });
      }
    } catch {
      set({ mode: 'mock', apiHealthy: false, lastCheck: Date.now() });
    }
  },
}));

/** Whether we should attempt real API calls */
export function isApiMode(): boolean {
  return useDataMode.getState().mode === 'api';
}

/** Human-readable mode label */
export function getModeLabel(): string {
  const mode = useDataMode.getState().mode;
  switch (mode) {
    case 'api': return 'Connected';
    case 'mock': return 'Demo Mode';
    case 'checking': return 'Connecting...';
  }
}
