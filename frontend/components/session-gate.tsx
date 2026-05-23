"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readSession } from "@/lib/api-client";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!readSession() && !process.env.NEXT_PUBLIC_ACCESS_TOKEN) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) return null;

  return children;
}
