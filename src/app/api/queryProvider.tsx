// ── TanStack Query Provider ───────────────────────────────
// Wraps the app with QueryClientProvider for server-state management.
// Configured with sensible defaults: stale time, retry, refetch on focus.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — data is fresh for 30s
      gcTime: 5 * 60_000,       // 5min — garbage collect after 5min
      retry: 2,                 // retry failed queries twice
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
