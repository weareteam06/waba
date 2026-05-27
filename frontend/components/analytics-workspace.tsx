"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";

export function AnalyticsWorkspace() {
  const [templates, setTemplates] = useState<api.Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [snapshots, setSnapshots] = useState<api.TemplateAnalytics[]>([]);
  const [busy, setBusy] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [notice, setNotice] = useState("");
  const refreshingRef = useRef(false);

  useEffect(() => { void api.templates().then((items) => { setTemplates(items); setTemplateId(String(items[0]?.id ?? "")); }).catch((cause) => setNotice(message(cause))).finally(() => setBusy(false)); }, []);
  useEffect(() => { if (templateId) void api.templateAnalytics(Number(templateId)).then(setSnapshots).catch((cause) => setNotice(message(cause))); }, [templateId]);
  useEffect(() => {
    function updateVisibility() {
      setPageVisible(document.visibilityState === "visible");
    }
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);
  useEffect(() => {
    if (!templateId) return;
    const interval = window.setInterval(() => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      void api.templateAnalytics(Number(templateId))
        .then(setSnapshots)
        .catch(() => undefined)
        .finally(() => {
          refreshingRef.current = false;
        });
    }, pageVisible ? 30000 : 120000);
    return () => window.clearInterval(interval);
  }, [pageVisible, templateId]);
  const totals = useMemo(() => snapshots.reduce((sum, item) => ({ accepted: sum.accepted + item.accepted, failed: sum.failed + item.failed, delivered: sum.delivered + item.delivered, read: sum.read + item.read }), { accepted: 0, failed: 0, delivered: 0, read: 0 }), [snapshots]);

  async function sync() {
    if (!templateId) return;
    setSyncing(true);
    try { setSnapshots(await api.syncTemplateAnalytics(Number(templateId))); setNotice("Analytics synced from Meta."); } catch (cause) { setNotice(message(cause)); }
    finally { setSyncing(false); }
  }

  return <main><PageHeader title="Analytics" description="Load stored template analytics snapshots and refresh a selected template from Meta."
    action={<Button onClick={() => void sync()} disabled={!templateId || syncing}><RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Sync selected</Button>} />
    <section className="grid gap-4 px-4 py-5 sm:px-6">
      <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><label className="grid gap-1 text-sm font-medium">Template<select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="h-11 min-w-72 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3"><option value="">Select template</option>{templates.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.language}</option>)}</select></label>{notice && <p role="status" className="text-sm text-[var(--muted)]">{notice}</p>}</Surface>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(totals).map(([key, value]) => <Surface key={key} className="p-4"><p className="text-sm capitalize text-[var(--muted)]">{key}</p><b className="mt-2 block text-2xl">{value.toLocaleString()}</b></Surface>)}</div>
      <Surface className="overflow-hidden"><div className="border-b border-[var(--line)] p-4 text-sm font-semibold">Snapshot history</div>{busy ? <div className="p-4"><Skeleton className="h-14" /></div> : snapshots.length === 0 ? <p className="p-6 text-sm text-[var(--muted)]">No analytics snapshots exist for this template. Sync from Meta after provider credentials are configured.</p> : snapshots.map((item) => <div key={item.snapshotDate} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_repeat(4,110px)]"><b>{item.snapshotDate}</b><Badge>Accepted {item.accepted}</Badge><Badge>Delivered {item.delivered}</Badge><Badge>Read {item.read}</Badge><Badge>Failed {item.failed}</Badge></div>)}</Surface>
    </section></main>;
}
function message(value: unknown) { return value instanceof Error ? value.message : "Analytics request failed."; }
