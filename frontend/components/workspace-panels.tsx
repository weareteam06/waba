import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileStack,
  MessageSquareMore,
  Send,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Surface } from "@/components/ui/surface";
import { compactNumber } from "@/lib/utils";

export const metrics = [
  { label: "Open conversations", value: 1284, delta: "+8.4%", icon: MessageSquareMore },
  { label: "First reply median", value: "38 sec", delta: "-12 sec", icon: Clock3 },
  { label: "Template approval", value: "96.2%", delta: "+1.1%", icon: FileStack },
  { label: "Active agents", value: 42, delta: "6 teams", icon: UsersRound },
];

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--line)] px-4 py-6 sm:px-6 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MetricStrip() {
  return (
    <section aria-label="Key metrics" className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
      {metrics.map(({ label, value, delta, icon: Icon }, index) => (
        <Surface key={label} className="float-in p-4" style={{ animationDelay: `${index * 45}ms` }}>
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--panel-strong)]"><Icon className="h-5 w-5 text-[var(--accent)]" /></span>
            <Badge>{delta}</Badge>
          </div>
          <p className="mt-5 text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{typeof value === "number" ? compactNumber(value) : value}</p>
        </Surface>
      ))}
    </section>
  );
}

export function StatusRows({ kind }: { kind: "templates" | "campaigns" | "analytics" | "settings" }) {
  const rows = {
    templates: [
      ["shipping_update", "Utility", "Approved", "28.4k"],
      ["cart_recovery", "Marketing", "Pending", "4 locales"],
      ["otp_login", "Authentication", "Approved", "99.8%"],
    ],
    campaigns: [
      ["Ramadan winback", "Scheduled", "12,480 recipients", "Today 18:30"],
      ["Order handoff", "Sending", "Throttle 240/min", "2 retries"],
      ["Onboarding nudge", "Draft", "Audience review", "Owner Priya"],
    ],
    analytics: [
      ["Delivery rate", "Healthy", "98.7%", "7 day"],
      ["Read rate", "Watching", "71.3%", "Template split"],
      ["Failed sends", "Investigate", "184", "Provider errors"],
    ],
    settings: [
      ["Webhook signatures", "Enabled", "Meta app secret", "Rotated 14 days ago"],
      ["Tenant isolation", "Active", "JWT tenant claim", "Row scoped"],
      ["Rate limits", "Configured", "Campaign senders", "240/min"],
    ],
  }[kind];
  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-[var(--line)] px-4 py-3 text-sm font-semibold">Operational status</div>
      <div role="table">
        {rows.map(([name, status, detail, note]) => (
          <div role="row" key={name} className="grid gap-2 border-b border-[var(--line)] px-4 py-4 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_140px_180px_180px]">
            <b role="cell" className="truncate font-medium">{name}</b>
            <span role="cell"><StatusBadge status={status} /></span>
            <span role="cell" className="text-[var(--muted)]">{detail}</span>
            <span role="cell" className="text-[var(--muted)]">{note}</span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <Surface className="grid min-h-56 place-items-center p-6 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-[var(--panel-strong)]"><Send className="h-5 w-5 text-[var(--accent)]" /></span>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">{detail}</p>
      </div>
    </Surface>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === "Approved" || status === "Enabled" || status === "Active" || status === "Healthy"
    ? CheckCircle2
    : status === "Investigate" ? CircleAlert : ArrowUpRight;
  return <Badge className="gap-1.5"><Icon className="h-3.5 w-3.5" />{status}</Badge>;
}
