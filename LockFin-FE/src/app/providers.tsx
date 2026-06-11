'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { OneSignalInit } from '@/components/OneSignalInit';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        mutations: { retry: 0 },
      },
    }),
  );
  return (
    <QueryClientProvider client={client}>
      <OneSignalInit />
      {children}
    </QueryClientProvider>
  );
}
