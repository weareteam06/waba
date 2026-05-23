"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Command,
  Menu,
  PanelRightClose,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Avatar } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { workspaceNav, governanceItems } from "@/src/config/navigation";
import { activityFeed } from "@/src/constants/demo-data";
import { cn } from "@/src/lib/cn";
import { useUiStore } from "@/src/store/ui-store";
import { logout } from "@/lib/api-client";
import { SessionGate } from "@/components/session-gate";

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionGate>
      <ShellFrame>{children}</ShellFrame>
    </SessionGate>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed, commandOpen, setCommandOpen, notificationsOpen, setNotificationsOpen, contextOpen, setContextOpen } = useUiStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = useMemo(() => workspaceNav.find((item) => pathname.startsWith(item.href)) ?? workspaceNav[0], [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, [contenteditable=true]");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (!editing && event.key.toLowerCase() === "g") {
        const handler = (next: KeyboardEvent) => {
          const route = workspaceNav.find((item) => item.shortcut.endsWith(next.key.toUpperCase()))?.href;
          if (route) router.push(route);
          window.removeEventListener("keydown", handler);
        };
        window.addEventListener("keydown", handler, { once: true });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, setCommandOpen]);

  return (
    <div className="min-h-dvh overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.18),transparent_32rem),radial-gradient(circle_at_95%_10%,rgba(167,139,250,.16),transparent_28rem)]" />
      <div className={cn("relative grid min-h-dvh transition-[grid-template-columns] duration-300 lg:grid-cols-[280px_minmax(0,1fr)]", sidebarCollapsed && "lg:grid-cols-[88px_minmax(0,1fr)]")}>
        <Sidebar collapsed={sidebarCollapsed} currentPath={pathname} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-slate-950/58 px-4 backdrop-blur-xl">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
            <Button size="icon" variant="ghost" className="hidden lg:inline-flex" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><Menu className="h-5 w-5" /></Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>Workspace</span><span>/</span><span className="text-[var(--ink)]">{current.label}</span>
              </div>
              <h1 className="truncate text-sm font-semibold sm:text-base">{current.label}</h1>
            </div>
            <button onClick={() => setCommandOpen(true)} className="hidden h-10 min-w-72 items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 text-left text-sm text-[var(--muted)] transition hover:bg-white/12 md:flex">
              <Search className="h-4 w-4" /><span className="flex-1">Search contacts, campaigns, templates</span><kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
            <Button size="icon" variant="ghost" onClick={() => setNotificationsOpen(true)}><Bell className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setContextOpen(!contextOpen)}><PanelRightClose className="h-4 w-4" /></Button>
            <UserMenu />
          </header>
          <div className={cn("grid min-h-[calc(100dvh-4rem)] min-w-0 transition-[grid-template-columns] duration-300", contextOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1")}>
            <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="min-w-0">
              {children}
            </motion.main>
            {contextOpen && <ContextPanel />}
          </div>
        </div>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}

function Sidebar({ collapsed, currentPath, mobileOpen, onClose }: { collapsed: boolean; currentPath: string; mobileOpen: boolean; onClose: () => void }) {
  const content = (
    <aside className="flex h-full flex-col border-r border-white/10 bg-slate-950/78 p-3 text-white backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 via-cyan-300 to-violet-300 text-slate-950 shadow-lg shadow-sky-500/20"><Sparkles className="h-5 w-5" /></span>
        {!collapsed && <div className="min-w-0"><b className="block truncate">WA Command</b><span className="block truncate text-xs text-slate-400">Enterprise engagement</span></div>}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={cn("mt-3 flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-3 text-sm transition hover:bg-white/12", collapsed && "justify-center px-0")}>
            <Avatar name="NS" className="h-7 w-7 rounded-lg" />{!collapsed && <><span className="min-w-0 flex-1 truncate text-left">Northstar</span><ChevronDown className="h-4 w-4 text-slate-400" /></>}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="z-50 min-w-56 rounded-xl border border-white/10 bg-slate-950 p-2 text-sm text-white shadow-xl">
          <DropdownMenu.Item className="rounded-lg px-3 py-2 outline-none hover:bg-white/10">Switch workspace</DropdownMenu.Item>
          <DropdownMenu.Item className="rounded-lg px-3 py-2 outline-none hover:bg-white/10">Invite team</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <nav className="mt-4 grid gap-1">
        {workspaceNav.map(({ href, label, icon: Icon, shortcut }) => (
          <Link key={href} href={href} onClick={onClose}
            className={cn("group flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white", currentPath.startsWith(href) && "bg-white text-slate-950 hover:bg-white hover:text-slate-950", collapsed && "justify-center px-0")}
            title={collapsed ? label : undefined}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <><span className="min-w-0 flex-1 truncate">{label}</span><kbd className={cn("hidden text-[10px] text-slate-500 group-hover:text-slate-300 2xl:block", currentPath.startsWith(href) && "text-slate-500")}>{shortcut}</kbd></>}
          </Link>
        ))}
      </nav>
      {!collapsed && <div className="mt-auto rounded-2xl border border-white/10 bg-white/8 p-3 text-xs text-slate-300"><b className="mb-2 block text-sm text-white">Governance</b>{governanceItems.map(({ label, icon: Icon }) => <p key={label} className="mt-2 flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-emerald-300" />{label}</p>)}</div>}
    </aside>
  );
  return (
    <>
      <div className="hidden lg:block">{content}</div>
      <AnimatePresence>
        {mobileOpen && <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div className="relative h-full w-[300px]" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}>{content}</motion.div>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}

function UserMenu() {
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild><button aria-label="User menu"><Avatar name="TU" /></button></DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="z-50 min-w-56 rounded-xl border border-white/10 bg-slate-950 p-2 text-sm text-white shadow-xl">
        <DropdownMenu.Label className="px-3 py-2 text-xs text-slate-400">Signed in</DropdownMenu.Label>
        <DropdownMenu.Item className="rounded-lg px-3 py-2 outline-none hover:bg-white/10">Profile</DropdownMenu.Item>
        <DropdownMenu.Item className="rounded-lg px-3 py-2 outline-none hover:bg-white/10" onClick={() => void logout().then(() => router.push("/login"))}>Sign out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function ContextPanel() {
  return (
    <aside className="hidden border-l border-white/10 bg-slate-950/35 p-4 backdrop-blur-xl xl:block">
      <Card className="p-4">
        <div className="flex items-center justify-between"><b>Realtime health</b><Badge className="border-emerald-400/30 text-emerald-200">Live</Badge></div>
        <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
          <p className="flex justify-between"><span>Inbox socket</span><span className="text-[var(--success)]">Connected</span></p>
          <p className="flex justify-between"><span>Queue latency</span><span>184 ms</span></p>
          <p className="flex justify-between"><span>Tenant isolation</span><span>JWT scoped</span></p>
        </div>
      </Card>
      <Card className="mt-4 p-4">
        <b>Recent activity</b>
        <div className="mt-3 grid gap-3">{activityFeed.map(([title, detail, time]) => <div key={title} className="rounded-xl bg-white/6 p-3 text-sm"><p className="font-medium">{title}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p><p className="mt-2 text-[10px] text-slate-500">{time}</p></div>)}</div>
      </Card>
    </aside>
  );
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const router = useRouter();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
          <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4"><Command className="h-4 w-4 text-[var(--accent)]" /><input autoFocus placeholder="Jump to page or search workspace" className="flex-1 bg-transparent text-sm outline-none" /><Dialog.Close><X className="h-4 w-4" /></Dialog.Close></div>
          <div className="max-h-96 overflow-y-auto p-2">{workspaceNav.map(({ href, label, icon: Icon, shortcut }) => <button key={href} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10" onClick={() => { router.push(href); onOpenChange(false); }}><Icon className="h-4 w-4 text-[var(--accent)]" /><span className="flex-1">{label}</span><kbd className="text-xs text-[var(--muted)]">{shortcut}</kbd></button>)}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NotificationDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-dvh w-[min(420px,100vw)] border-l border-white/10 bg-slate-950 p-5 shadow-2xl">
          <div className="flex items-center justify-between"><Dialog.Title className="text-lg font-semibold">Notifications</Dialog.Title><Dialog.Close><X className="h-4 w-4" /></Dialog.Close></div>
          <div className="mt-5 grid gap-3">{activityFeed.map(([title, detail, time]) => <Card key={title} className="p-4"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{detail}</p><p className="mt-3 text-xs text-slate-500">{time}</p></Card>)}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
