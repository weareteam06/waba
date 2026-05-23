"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export function KpiCard({ label, value, delta, icon: Icon, loading, index = 0 }: { label: string; value: string | number; delta: string; icon: LucideIcon; loading?: boolean; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="p-4 transition hover:-translate-y-0.5 hover:border-sky-300/30">
        <div className="flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400/25 to-violet-400/25 text-[var(--accent)]"><Icon className="h-5 w-5" /></span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">{delta}</span>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">{label}</p>
        {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <b className="mt-1 block text-3xl">{typeof value === "number" ? value.toLocaleString() : value}</b>}
      </Card>
    </motion.div>
  );
}
