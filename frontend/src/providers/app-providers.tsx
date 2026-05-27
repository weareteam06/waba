"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { RealtimeProvider } from "@/src/providers/realtime-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="wa-command-theme">
      <QueryClientProvider client={client}>
        <RealtimeProvider>{children}</RealtimeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
