"use client";

import { Activity, Bot, CalendarClock, MessageSquareMore, Send, UsersRound } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { KpiCard } from "@/src/components/kpi-card";
import { PageShell } from "@/src/components/page-shell";
import { MetricChart } from "@/src/components/charts/metric-chart";
import { activityFeed } from "@/src/constants/demo-data";
import { useWorkspaceSummary } from "@/src/services/workspace-queries";

const chart = [
  { name: "Mon", value: 420 },
  { name: "Tue", value: 680 },
  { name: "Wed", value: 590 },
  { name: "Thu", value: 920 },
  { name: "Fri", value: 1180 },
  { name: "Sat", value: 760 },
  { name: "Sun", value: 940 },
];

export function DashboardPage() {
  const { tenant, templates, campaigns, messages, accounts } = useWorkspaceSummary();
  const loading = tenant.isLoading || templates.isLoading || campaigns.isLoading || messages.isLoading;
  const failed = messages.data?.filter((item) => item.status === "FAILED").length ?? 0;
  const queued = campaigns.data?.reduce((total, item) => total + item.queued, 0) ?? 0;

  return (
    <PageShell
      title={tenant.data ? `${tenant.data.name} command center` : "Command center"}
      description="Realtime overview for WhatsApp engagement, inbox health, campaigns, automation, and tenant operations."
      action={<Button variant="primary"><Send className="h-4 w-4" />Launch broadcast</Button>}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} loading={loading} label="WhatsApp accounts" value={accounts.data?.length ?? 0} delta="Tenant scoped" icon={MessageSquareMore} />
        <KpiCard index={1} loading={loading} label="Templates" value={templates.data?.length ?? 0} delta="+ synced" icon={Activity} />
        <KpiCard index={2} loading={loading} label="Queued recipients" value={queued} delta="RabbitMQ" icon={CalendarClock} />
        <KpiCard index={3} loading={loading} label="Failed latest sends" value={failed} delta="Retry ready" icon={Bot} />
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Engagement velocity</CardTitle>
            <Badge>Live projection</Badge>
          </CardHeader>
          <CardContent><MetricChart data={chart} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {activityFeed.map(([title, detail, time]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <div className="flex items-center justify-between gap-3"><b className="text-sm">{title}</b><span className="text-xs text-[var(--muted)]">{time}</span></div>
                <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        {["Inbox SLA", "Campaign intelligence", "Agent capacity"].map((title, index) => (
          <Card key={title} className="p-5">
            <UsersRound className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{index === 0 ? "Prioritize unassigned conversations and unread spikes before the queue breaches response targets." : index === 1 ? "Campaign health combines approved templates, retry counts, provider failures, and delivery progression." : "Role-aware team views keep admin, agent, and auditor experiences focused."}</p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
