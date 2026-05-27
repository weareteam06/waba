"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  CircleDot,
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
import { inboxBadgeCount, unreadDomainNotificationCount, unreadNotificationCount, useRealtimeStore } from "@/src/store/realtime-store";
import { logout } from "@/lib/api-client";
import { SessionGate } from "@/components/session-gate";
import { currentPushPermission, disablePushNotifications, enablePushNotifications } from "@/src/lib/push-notifications";

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
  const { sidebarCollapsed, setSidebarCollapsed, commandOpen, setCommandOpen, notificationsOpen, setNotificationsOpen, contextOpen, setContextOpen, routeLoading, setRouteLoading } = useUiStore();
  const notificationCount = useRealtimeStore(unreadNotificationCount);
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const current = useMemo(() => workspaceNav.find((item) => pathname.startsWith(item.href)) ?? workspaceNav[0], [pathname]);
  const loadingActive = routeLoading || fetching > 0 || mutating > 0;

  useEffect(() => {
    setRouteLoading(false);
  }, [pathname, setRouteLoading]);

  useEffect(() => {
    if (!loadingActive) return;
    setLoadProgress((value) => value > 0 ? value : 10);
    const interval = window.setInterval(() => {
      setLoadProgress((value) => Math.min(94, value + Math.max(2, Math.round((100 - value) * 0.1))));
    }, 220);
    return () => window.clearInterval(interval);
  }, [loadingActive]);

  useEffect(() => {
    if (loadingActive || loadProgress === 0) return;
    setLoadProgress(100);
    const timeout = window.setTimeout(() => setLoadProgress(0), 280);
    return () => window.clearTimeout(timeout);
  }, [loadProgress, loadingActive]);

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
      <div className={cn("relative grid min-h-dvh transition-[grid-template-columns] duration-300 lg:grid-cols-[280px_minmax(0,1fr)]", sidebarCollapsed && "lg:grid-cols-[88px_minmax(0,1fr)]")}>
        <Sidebar collapsed={sidebarCollapsed} currentPath={pathname} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onNavigate={() => setRouteLoading(true)} />
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)]/95 px-4 backdrop-blur-xl">
            {loadProgress > 0 && <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-[var(--primary-soft)]"><span className="block h-full bg-[var(--primary)] transition-all duration-200" style={{ width: `${loadProgress}%` }} /></span>}
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
            <Button size="icon" variant="ghost" className="hidden lg:inline-flex" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><Menu className="h-5 w-5" /></Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>Workspace</span><span>/</span><span className="text-[var(--ink)]">{current.label}</span>
              </div>
              <h1 className="truncate text-sm font-semibold sm:text-base">{current.label}</h1>
            </div>
            <button onClick={() => setCommandOpen(true)} className="hidden h-10 min-w-72 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--primary)] md:flex">
              <Search className="h-4 w-4" /><span className="flex-1">Search contacts, campaigns, templates</span><kbd className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
            <Button size="icon" variant="ghost" className="relative" onClick={() => setNotificationsOpen(true)}>
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold text-white">{notificationCount > 9 ? "9+" : notificationCount}</span>}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setContextOpen(!contextOpen)}><PanelRightClose className="h-4 w-4" /></Button>
            <UserMenu />
          </header>
          <div className={cn("grid min-h-[calc(100dvh-4rem)] min-w-0 transition-[grid-template-columns] duration-300", contextOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1")}>
            <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="relative min-w-0">
              {routeLoading && <RouteLoadingVeil progress={loadProgress} />}
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

function Sidebar({ collapsed, currentPath, mobileOpen, onClose, onNavigate }: { collapsed: boolean; currentPath: string; mobileOpen: boolean; onClose: () => void; onNavigate: () => void }) {
  const inboxUnread = useRealtimeStore(inboxBadgeCount);
  const campaignUnread = useRealtimeStore(unreadDomainNotificationCount("campaigns"));
  const templateUnread = useRealtimeStore(unreadDomainNotificationCount("templates"));
  const analyticsUnread = useRealtimeStore(unreadDomainNotificationCount("analytics"));
  const content = (
    <aside className="flex h-full flex-col border-r border-[var(--line)] bg-[var(--sidebar)] p-3 text-[var(--sidebar-ink)]">
      <div className="flex h-14 items-center gap-3 px-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-white shadow-sm"><Sparkles className="h-5 w-5" /></span>
        {!collapsed && <div className="min-w-0"><b className="block truncate">WA Command</b><span className="block truncate text-xs text-[var(--muted)]">Enterprise engagement</span></div>}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={cn("mt-3 flex h-11 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm transition hover:border-[var(--primary)]", collapsed && "justify-center px-0")}>
            <Avatar name="NS" className="h-7 w-7 rounded-lg" />{!collapsed && <><span className="min-w-0 flex-1 truncate text-left">Northstar</span><ChevronDown className="h-4 w-4 text-[var(--muted)]" /></>}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="z-50 min-w-56 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 text-sm text-[var(--ink)] shadow-xl">
          <DropdownMenu.Item className="rounded-md px-3 py-2 outline-none hover:bg-[var(--panel-strong)]">Switch workspace</DropdownMenu.Item>
          <DropdownMenu.Item className="rounded-md px-3 py-2 outline-none hover:bg-[var(--panel-strong)]">Invite team</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <nav className="mt-4 grid gap-1">
        {workspaceNav.map(({ href, label, icon: Icon, shortcut }) => {
          const badge = href === "/inbox" ? inboxUnread : href === "/campaigns" ? campaignUnread : href === "/templates" ? templateUnread : href === "/analytics" ? analyticsUnread : 0;
          return (
          <Link key={href} href={href} onClick={() => { if (!currentPath.startsWith(href)) onNavigate(); onClose(); }}
            className={cn("group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--ink)]", currentPath.startsWith(href) && "bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:text-white", collapsed && "justify-center px-0")}
            title={collapsed ? label : undefined}>
            <Icon className="h-4 w-4 shrink-0" />
            {collapsed && badge > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />}
            {!collapsed && <><span className="min-w-0 flex-1 truncate">{label}</span>{badge > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-semibold text-white">{badge > 99 ? "99+" : badge}</span> : <kbd className={cn("hidden text-[10px] text-[var(--muted)] group-hover:text-[var(--ink)] 2xl:block", currentPath.startsWith(href) && "text-white/80")}>{shortcut}</kbd>}</>}
          </Link>
          );
        })}
      </nav>
      {!collapsed && <div className="mt-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-xs text-[var(--muted)]"><b className="mb-2 block text-sm text-[var(--ink)]">Governance</b>{governanceItems.map(({ label, icon: Icon }) => <p key={label} className="mt-2 flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[var(--success)]" />{label}</p>)}</div>}
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
      <DropdownMenu.Content align="end" className="z-50 min-w-56 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 text-sm text-[var(--ink)] shadow-xl">
        <DropdownMenu.Label className="px-3 py-2 text-xs text-[var(--muted)]">Signed in</DropdownMenu.Label>
        <DropdownMenu.Item className="rounded-md px-3 py-2 outline-none hover:bg-[var(--panel-strong)]">Profile</DropdownMenu.Item>
        <DropdownMenu.Item className="rounded-md px-3 py-2 outline-none hover:bg-[var(--panel-strong)]" onClick={() => void logout().then(() => router.push("/login"))}>Sign out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function ContextPanel() {
  const status = useRealtimeStore((state) => state.status);
  const notifications = useRealtimeStore((state) => state.notifications);
  return (
    <aside className="hidden border-l border-[var(--line)] bg-[var(--panel-strong)] p-4 xl:block">
      <Card className="p-4">
        <div className="flex items-center justify-between"><b>Realtime health</b><Badge className={cn(status === "live" ? "border-[var(--success)]/30 bg-[var(--accent-soft)] text-[var(--success)]" : status === "connecting" ? "border-[var(--warning)]/30 bg-amber-50 text-[var(--warning)]" : "border-[var(--danger)]/30 bg-red-50 text-[var(--danger)]")}>{status}</Badge></div>
        <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
          <p className="flex justify-between"><span>Inbox socket</span><span className={cn(status === "live" ? "text-[var(--success)]" : "text-[var(--warning)]")}>{status === "live" ? "Connected" : "Waiting"}</span></p>
          <p className="flex justify-between"><span>Notification buffer</span><span>{notifications.length}</span></p>
          <p className="flex justify-between"><span>Tenant isolation</span><span>JWT scoped</span></p>
        </div>
      </Card>
      <Card className="mt-4 p-4">
        <b>Recent activity</b>
        <div className="mt-3 grid gap-3">{(notifications.length ? notifications.slice(0, 4).map((item) => [item.title, item.detail, relativeTime(item.createdAt)] as const) : activityFeed).map(([title, detail, time]) => <div key={`${title}-${time}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm"><p className="font-medium">{title}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p><p className="mt-2 text-[10px] text-[var(--muted)]">{time}</p></div>)}</div>
      </Card>
    </aside>
  );
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const router = useRouter();
  const setRouteLoading = useUiStore((state) => state.setRouteLoading);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-2xl">
          <div className="flex h-14 items-center gap-3 border-b border-[var(--line)] px-4"><Command className="h-4 w-4 text-[var(--primary)]" /><input autoFocus placeholder="Jump to page or search workspace" className="flex-1 bg-transparent text-sm outline-none" /><Dialog.Close><X className="h-4 w-4" /></Dialog.Close></div>
          <div className="max-h-96 overflow-y-auto p-2">{workspaceNav.map(({ href, label, icon: Icon, shortcut }) => <button key={href} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-[var(--panel-strong)]" onClick={() => { setRouteLoading(true); router.push(href); onOpenChange(false); }}><Icon className="h-4 w-4 text-[var(--primary)]" /><span className="flex-1">{label}</span><kbd className="text-xs text-[var(--muted)]">{shortcut}</kbd></button>)}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RouteLoadingVeil({ progress }: { progress: number }) {
  const status = progress < 35 ? "Resolving route" : progress < 70 ? "Loading page modules" : "Rendering page";
  return (
    <div className="absolute inset-0 z-20 grid min-h-[calc(100dvh-4rem)] place-items-center bg-[var(--canvas)]/70 backdrop-blur-sm">
      <div className="w-[min(420px,calc(100vw-2rem))] rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--accent)]" />
          <span className="flex-1 text-sm font-medium">{status}</span>
          <span className="text-sm font-semibold text-[var(--primary)]">{Math.max(1, Math.min(99, progress))}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-strong)]">
          <span className="block h-full rounded-full bg-[var(--primary)] transition-all duration-200" style={{ width: `${Math.max(8, progress)}%` }} />
        </div>
      </div>
    </div>
  );
}

function NotificationDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const router = useRouter();
  const notifications = useRealtimeStore((state) => state.notifications);
  const unread = useRealtimeStore(unreadNotificationCount);
  const markNotificationsRead = useRealtimeStore((state) => state.markNotificationsRead);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNotice, setPushNotice] = useState("");

  useEffect(() => {
    if (open) void currentPushPermission().then(setPushPermission);
  }, [open]);

  async function togglePush() {
    setPushBusy(true);
    setPushNotice("");
    try {
      if (pushPermission === "granted") {
        await disablePushNotifications();
        setPushNotice("Browser push disabled for this device.");
      } else {
        await enablePushNotifications();
        setPushNotice("Browser push enabled for this device.");
      }
      setPushPermission(await currentPushPermission());
    } catch (cause) {
      setPushNotice(cause instanceof Error ? cause.message : "Push notification setup failed.");
    } finally {
      setPushBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-dvh w-[min(420px,100vw)] border-l border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold">Notifications</Dialog.Title>
            <div className="flex items-center gap-2">
              {unread > 0 && <Button size="sm" variant="ghost" onClick={markNotificationsRead}>Mark read</Button>}
              <Dialog.Close><X className="h-4 w-4" /></Dialog.Close>
            </div>
          </div>
          <Card className="mt-5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Browser push</p>
                <p className="mt-1 truncate text-xs text-[var(--muted)]">{pushPermission === "granted" ? "Enabled on this browser" : pushPermission === "denied" ? "Blocked by browser permission" : "Notify when the portal is in background"}</p>
              </div>
              <Button size="sm" disabled={pushBusy || pushPermission === "unsupported" || pushPermission === "denied"} onClick={() => void togglePush()}>
                {pushBusy ? "Working" : pushPermission === "granted" ? "Disable" : "Enable"}
              </Button>
            </div>
            {pushNotice && <p className="mt-2 text-xs text-[var(--muted)]">{pushNotice}</p>}
          </Card>
          <div className="mt-5 grid gap-3">
            {notifications.length === 0 ? (
              <Card className="p-4 text-sm text-[var(--muted)]">Realtime notifications will appear here when inbox, campaign, template, and analytics activity is available.</Card>
            ) : notifications.map((item) => (
              <button
                key={item.id}
                className="text-left"
                onClick={() => {
                  router.push(item.href);
                  onOpenChange(false);
                }}
              >
                <Card className={cn("p-4 transition hover:bg-[var(--panel-strong)]", !item.read && "border-[var(--primary)]/35 bg-[var(--primary-soft)]")}>
                  <div className="flex items-start gap-2">
                    {!item.read && <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />}
                    <span className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.detail}</p>
                      <p className="mt-3 text-xs text-[var(--muted)]">{relativeTime(item.createdAt)}</p>
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
