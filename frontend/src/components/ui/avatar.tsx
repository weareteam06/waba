import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/src/lib/cn";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <AvatarPrimitive.Root className={cn("grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-[var(--primary)] text-xs font-bold text-white", className)}>
      <AvatarPrimitive.Fallback>{name.slice(0, 2).toUpperCase()}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
