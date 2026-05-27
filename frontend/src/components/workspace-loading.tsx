"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function WorkspaceLoading({ label = "Loading workspace" }: { label?: string }) {
  const [progress, setProgress] = useState(12);
  const status = useMemo(() => {
    if (progress < 35) return "Preparing workspace";
    if (progress < 68) return "Loading page data";
    if (progress < 90) return "Rendering interface";
    return "Almost ready";
  }, [progress]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(96, value + Math.max(2, Math.round((100 - value) * 0.12))));
    }, 260);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[var(--canvas)] p-4 sm:p-6">
      <div className="mb-5 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink)]">{status}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
          </div>
          <span className="text-sm font-semibold text-[var(--primary)]">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-strong)]">
          <span className="block h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="h-7 w-52 rounded-md bg-[var(--panel-strong)] skeleton" />
        </div>
        <div className="h-10 w-32 rounded-md bg-[var(--panel-strong)] skeleton" />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-lg" />)}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[420px] rounded-lg" />
        <div className="grid gap-4">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      </section>
    </main>
  );
}
