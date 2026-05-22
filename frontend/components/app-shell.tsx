"use client";

import {
  BarChart3,
  Bell,
  CalendarClock,
  FileStack,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  Settings2,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api-client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: MessageSquareText },
  { href: "/templates", label: "Templates", icon: FileStack },
  { href: "/campaigns", label: "Campaigns", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const element = event.target as HTMLElement | null;
      const editing = element?.matches("input, textarea, [contenteditable=true]");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("workspace-search")?.focus();
      }
      if (!editing && event.key === "?") setShortcutsOpen((value) => !value);
      if (!editing && event.key.toLowerCase() === "g") {
        const navigate = (next: KeyboardEvent) => {
          const route = next.key.toLowerCase() === "i" ? "/inbox" : next.key.toLowerCase() === "d" ? "/dashboard" : null;
          if (route) router.push(route);
          window.removeEventListener("keydown", navigate);
        };
        window.addEventListener("keydown", navigate, { once: true });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="grid min-h-dvh bg-[var(--canvas)] text-[var(--ink)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-ink)] transition lg:static lg:translate-x-0", menuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#23b08d] text-[#04120f]"><Sparkles className="h-5 w-5" /></span>
            <span className="min-w-0">
              <b className="block truncate text-base">WA Command</b>
              <span className="block truncate text-xs text-emerald-100/65">Operations</span>
            </span>
          </Link>
          <Button aria-label="Close menu" variant="ghost" className="h-9 w-9 border-white/10 px-0 text-white hover:bg-white/10 lg:hidden" onClick={() => setMenuOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav aria-label="Workspace" className="grid gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm transition", pathname === href ? "bg-white text-[#07100f]" : "text-emerald-50/82 hover:bg-white/10 hover:text-white")}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4 text-sm">
          <p className="font-medium">Northstar Support</p>
          <p className="mt-1 text-xs text-emerald-100/65">4 agents online</p>
          <button className="mt-4 flex h-9 w-full items-center gap-2 rounded-md px-2 text-emerald-50/82 hover:bg-white/10 hover:text-white"
            onClick={() => void logout().then(() => router.push("/login"))}>
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </aside>
      {menuOpen && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/35 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] px-4 backdrop-blur sm:px-6">
          <Button aria-label="Open navigation" variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 sm:max-w-xl">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <input id="workspace-search" aria-label="Search workspace" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search inbox, templates, contacts" />
            <kbd className="hidden rounded border border-[var(--line)] px-1.5 py-0.5 text-xs text-[var(--muted)] sm:block">Ctrl K</kbd>
          </label>
          <Badge className="hidden sm:inline-flex">Meta healthy</Badge>
          <Button aria-label="Notifications" title="Notifications" variant="ghost" className="h-10 w-10 px-0">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </header>
        <div className="min-w-0">{children}</div>
      </div>
      {shortcutsOpen && (
        <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="fixed inset-0 z-50 grid place-items-center bg-black/42 p-4" onClick={() => setShortcutsOpen(false)}>
          <div className="enter w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shortcuts</h2>
              <Button aria-label="Close shortcuts" variant="ghost" className="h-9 w-9 px-0" onClick={() => setShortcutsOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Shortcut label="Workspace search" value="Ctrl K" />
              <Shortcut label="Inbox" value="G I" />
              <Shortcut label="Dashboard" value="G D" />
              <Shortcut label="Send message" value="Enter" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Shortcut({ label, value }: { label: string; value: string }) {
  return <p className="flex items-center justify-between gap-3 text-[var(--muted)]"><span>{label}</span><kbd className="rounded border border-[var(--line)] bg-[var(--panel-strong)] px-2 py-1 text-[var(--ink)]">{value}</kbd></p>;
}
