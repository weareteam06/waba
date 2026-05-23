import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export function Field({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[var(--ink)]">
      {label}
      <input
        className={cn("h-11 rounded-xl border border-white/10 bg-white/8 px-3 text-sm outline-none transition focus:border-[var(--accent)]", className)}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[var(--ink)]">
      {label}
      <textarea
        className={cn("min-h-28 rounded-xl border border-white/10 bg-white/8 p-3 text-sm outline-none transition focus:border-[var(--accent)]", className)}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}
