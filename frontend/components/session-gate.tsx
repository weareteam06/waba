"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { readSession } from "@/lib/api-client";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!readSession() && !process.env.NEXT_PUBLIC_ACCESS_TOKEN) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  return children;
}
