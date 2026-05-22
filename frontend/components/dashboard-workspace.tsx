"use client";

import { ArrowRight, MessageSquareMore } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";

export function DashboardWorkspace() {
  const [templates, setTemplates] = useState<api.Template[]>([]);
  const [campaigns, setCampaigns] = useState<api.Campaign[]>([]);
  const [messages, setMessages] = useState<api.Message[]>([]);
  const [tenant, setTenant] = useState<api.Tenant | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    void Promise.allSettled([api.templates(), api.campaigns(), api.messages(), api.tenantMe()]).then(([templateResult, campaignResult, messageResult, tenantResult]) => {
      if (templateResult.status === "fulfilled") setTemplates(templateResult.value); else setNotice(message(templateResult.reason));
      if (campaignResult.status === "fulfilled") setCampaigns(campaignResult.value);
      if (messageResult.status === "fulfilled") setMessages(messageResult.value);
      if (tenantResult.status === "fulfilled") setTenant(tenantResult.value);
      setBusy(false);
    });
  }, []);
  const queued = useMemo(() => campaigns.reduce((total, item) => total + item.queued, 0), [campaigns]);
  const failed = useMemo(() => messages.filter((item) => item.status === "FAILED").length, [messages]);

  return <main><PageHeader title={tenant ? `${tenant.name} dashboard` : "Dashboard"} description="Live operational summary from the current tenant APIs."
    action={<Link href="/inbox"><Button variant="primary">Open inbox <ArrowRight className="h-4 w-4" /></Button></Link>} />
    <section className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-4"><Metric busy={busy} label="Templates" value={templates.length} /><Metric busy={busy} label="Approved templates" value={templates.filter((item) => item.approvalStatus === "APPROVED").length} /><Metric busy={busy} label="Campaign queued" value={queued} /><Metric busy={busy} label="Failed latest messages" value={failed} /></section>
    <section className="grid gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Surface className="overflow-hidden"><div className="border-b border-[var(--line)] p-4 text-sm font-semibold">Latest messages</div>{messages.length === 0 ? <p className="p-6 text-sm text-[var(--muted)]">No message records loaded yet.</p> : messages.slice(0, 10).map((item) => <div key={item.id} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_120px_120px]"><span className="min-w-0"><b className="block truncate">{item.recipient}</b><span className="block truncate text-sm text-[var(--muted)]">{item.body || item.type}</span></span><Badge>{item.direction}</Badge><Badge>{item.status}</Badge></div>)}</Surface>
      <Surface className="p-5"><div className="flex items-center gap-2"><MessageSquareMore className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-lg font-semibold">Recent campaigns</h2></div>{campaigns.length === 0 ? <p className="mt-4 text-sm text-[var(--muted)]">Schedule an approved template from Campaigns.</p> : campaigns.slice(0, 5).map((item) => <div key={item.id} className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3"><b className="block truncate">{item.name}</b><span className="mt-1 block text-sm text-[var(--muted)]">{item.status} · {item.sent}/{item.totalRecipients} sent</span></div>)}{notice && <p className="mt-4 text-sm text-[var(--muted)]">{notice}</p>}</Surface>
    </section></main>;
}
function Metric({ label, value, busy }: { label: string; value: number; busy: boolean }) { return <Surface className="p-4"><p className="text-sm text-[var(--muted)]">{label}</p>{busy ? <Skeleton className="mt-3 h-8 w-24" /> : <b className="mt-2 block text-3xl">{value.toLocaleString()}</b>}</Surface>; }
function message(value: unknown) { return value instanceof Error ? value.message : "Dashboard data request failed."; }
