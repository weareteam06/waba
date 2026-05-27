import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)]",
  secondary: "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--panel-strong)]",
  ghost: "border-transparent bg-transparent text-[var(--ink)] hover:bg-[var(--panel-strong)]",
  danger: "border-transparent bg-[var(--danger)] text-white",
};

export function Button({
  className,
  variant = "secondary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:opacity-55",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
