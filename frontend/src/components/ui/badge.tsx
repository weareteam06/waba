import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-2.5 text-xs font-medium text-[var(--ink)]",
        className,
      )}
      {...props}
    />
  );
}
