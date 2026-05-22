"use client";

import { CalendarPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";

export function CampaignsWorkspace() {
  const [items, setItems] = useState<api.Campaign[]>([]);
  const [templates, setTemplates] = useState<api.Template[]>([]);
  const [accounts, setAccounts] = useState<api.Account[]>([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", templateId: "", phoneNumberId: "", scheduledAt: dateTimeValue(), recipients: "+15551234567" });

  useEffect(() => { void load(); }, []);

  async function load() {
    setBusy(true);
    try {
      const [campaignItems, templateItems, accountItems] = await Promise.all([api.campaigns(), api.templates("", "APPROVED"), api.accounts()]);
      setItems(campaignItems);
      setTemplates(templateItems);
      setAccounts(accountItems);
      setForm((item) => ({ ...item, templateId: item.templateId || String(templateItems[0]?.id ?? ""), phoneNumberId: item.phoneNumberId || accountItems[0]?.phoneNumberId || "" }));
    } catch (cause) {
      setNotice(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const recipients = form.recipients.split(/\r?\n|,/).map((recipient) => recipient.trim()).filter(Boolean).map((recipient) => ({ recipient, parameters: [] }));
      await api.createCampaign({ name: form.name, templateId: Number(form.templateId), phoneNumberId: form.phoneNumberId, scheduledAt: new Date(form.scheduledAt).toISOString(), recipients });
      setNotice("Campaign scheduled.");
      setForm((item) => ({ ...item, name: "" }));
      await load();
    } catch (cause) {
      setNotice(message(cause));
    }
  }

  return <main><PageHeader title="Campaigns" description="Schedule approved templates for recipient batches; the backend queues due campaigns through RabbitMQ and rate limiting."
    action={<Button variant="primary" onClick={() => document.getElementById("campaign-name")?.focus()}><CalendarPlus className="h-4 w-4" />Schedule campaign</Button>} />
    <section className="grid gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Surface className="overflow-hidden"><div className="border-b border-[var(--line)] p-4 text-sm font-semibold">Recent campaigns</div>{busy ? <div className="grid gap-3 p-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : items.length === 0 ? <p className="p-6 text-sm text-[var(--muted)]">No campaigns have been scheduled.</p> :
        <div>{items.map((item) => <div key={item.id} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_120px_180px]"><span><b className="block truncate">{item.name}</b><span className="block text-sm text-[var(--muted)]">{item.totalRecipients} recipients · {new Date(item.scheduledAt).toLocaleString()}</span></span><Badge>{item.status}</Badge><span className="text-sm text-[var(--muted)]">{item.sent} sent · {item.failed} failed</span></div>)}</div>}</Surface>
      <Surface className="p-5"><h2 className="text-lg font-semibold">New campaign</h2><form className="mt-4 grid gap-3" onSubmit={create}><Input id="campaign-name" label="Name" value={form.name} onChange={(name) => setForm((item) => ({ ...item, name }))} /><Choice label="Approved template" value={form.templateId} onChange={(templateId) => setForm((item) => ({ ...item, templateId }))} options={templates.map((item) => [String(item.id), `${item.name} · ${item.language}`])} /><Choice label="Phone number" value={form.phoneNumberId} onChange={(phoneNumberId) => setForm((item) => ({ ...item, phoneNumberId }))} options={accounts.map((item) => [item.phoneNumberId, item.displayPhoneNumber || item.phoneNumberId])} /><label className="grid gap-1.5 text-sm font-medium">Schedule<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((item) => ({ ...item, scheduledAt: event.target.value }))} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3" /></label><label className="grid gap-1.5 text-sm font-medium">Recipients<textarea required rows={5} value={form.recipients} onChange={(event) => setForm((item) => ({ ...item, recipients: event.target.value }))} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm" /></label><Button variant="primary" type="submit" disabled={!templates.length || !accounts.length}>Create campaign</Button>{notice && <p role="status" className="text-sm text-[var(--muted)]">{notice}</p>}</form></Surface>
    </section></main>;
}

function Input({ label, value, onChange, id }: { label: string; value: string; onChange: (value: string) => void; id?: string }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<input id={id} required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3" /></label>; }
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<select required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3"><option value="">Select</option>{options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>; }
function dateTimeValue() { const date = new Date(Date.now() + 30 * 60 * 1000); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function message(value: unknown) { return value instanceof Error ? value.message : "Campaign request failed."; }
