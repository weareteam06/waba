"use client";

import { FilePlus2, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";

const defaultComponents = JSON.stringify([{ type: "BODY", text: "Hello {{1}}, your update is ready." }], null, 2);

export function TemplatesWorkspace() {
  const [items, setItems] = useState<api.Template[]>([]);
  const [accounts, setAccounts] = useState<api.Account[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<api.Template | null>(null);
  const [form, setForm] = useState({ phoneNumberId: "", name: "", language: "en_US", category: "UTILITY", components: defaultComponents });

  useEffect(() => {
    let active = true;
    void Promise.all([api.accounts(), api.templates(category, status)])
      .then(([loadedAccounts, loadedTemplates]) => {
        if (!active) return;
        setAccounts(loadedAccounts);
        setItems(loadedTemplates);
        setForm((item) => ({ ...item, phoneNumberId: item.phoneNumberId || loadedAccounts[0]?.phoneNumberId || "" }));
      })
      .catch((cause) => active && setNotice(message(cause)))
      .finally(() => active && setBusy(false));
    return () => { active = false; };
  }, [category, status]);

  async function loadTemplates() {
    try { setItems(await api.templates(category, status)); } catch (cause) { setNotice(message(cause)); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = { ...form, components: JSON.parse(form.components) as unknown };
      const saved = editing ? await api.updateTemplate(editing.id, input) : await api.createTemplate(input);
      setNotice(`${saved.name} saved.`);
      setEditing(null);
      setForm((item) => ({ ...item, name: "", components: defaultComponents }));
      await loadTemplates();
    } catch (cause) {
      setNotice(message(cause));
    }
  }

  async function sync() {
    if (!form.phoneNumberId) return setNotice("Register a WhatsApp account first.");
    try { setItems(await api.syncTemplates(form.phoneNumberId)); setNotice("Meta templates synced."); } catch (cause) { setNotice(message(cause)); }
  }

  function edit(item: api.Template) {
    setEditing(item);
    setForm({ phoneNumberId: form.phoneNumberId, name: item.name, language: item.language, category: item.category, components: pretty(item.componentsJson) });
  }

  async function remove(item: api.Template) {
    try { await api.deleteTemplate(item.id); setNotice(`${item.name} deleted.`); await loadTemplates(); } catch (cause) { setNotice(message(cause)); }
  }

  const approved = useMemo(() => items.filter((item) => item.approvalStatus === "APPROVED").length, [items]);

  return <main><PageHeader title="Templates" description="Create templates through Meta, sync approval status, filter the local catalog, and inspect revisions used by campaigns."
    action={<div className="flex gap-2"><Button onClick={() => void sync()}><RefreshCw className="h-4 w-4" />Sync Meta</Button><Button variant="primary" onClick={() => document.getElementById("template-name")?.focus()}><FilePlus2 className="h-4 w-4" />New template</Button></div>} />
    <section className="grid gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] p-4"><Badge>{items.length} templates</Badge><Badge>{approved} approved</Badge><Select value={category} onChange={setCategory} options={["", "MARKETING", "UTILITY", "AUTHENTICATION"]} label="Category" /><Select value={status} onChange={setStatus} options={["", "APPROVED", "PENDING", "REJECTED", "PAUSED"]} label="Status" /></div>
        {busy ? <div className="grid gap-3 p-4"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : items.length === 0 ? <p className="p-6 text-sm text-[var(--muted)]">No templates yet. Register a phone number in Settings, then create or sync a Meta template.</p> :
          <div>{items.map((item) => <div key={item.id} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_120px_130px_auto]"><span className="min-w-0"><b className="block truncate">{item.name}</b><span className="block truncate text-sm text-[var(--muted)]">{item.language} · {item.wabaId}</span></span><Badge>{item.category}</Badge><Badge>{item.approvalStatus}</Badge><span className="flex gap-1"><Button aria-label={`Edit ${item.name}`} onClick={() => edit(item)}>Edit</Button><Button aria-label={`Delete ${item.name}`} variant="ghost" className="w-10 px-0" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></Button></span></div>)}</div>}
      </Surface>
      <Surface className="p-5"><h2 className="text-lg font-semibold">{editing ? "Edit draft" : "Create template"}</h2><p className="mt-1 text-sm text-[var(--muted)]">Submitted Meta-managed templates are synced rather than edited in place.</p>
        <form className="mt-4 grid gap-3" onSubmit={save}><Field asSelect label="Phone number" value={form.phoneNumberId} onChange={(value) => setForm((item) => ({ ...item, phoneNumberId: value }))} options={accounts.map((item) => item.phoneNumberId)} /><Field id="template-name" label="Name" value={form.name} onChange={(value) => setForm((item) => ({ ...item, name: value }))} /><Field label="Language" value={form.language} onChange={(value) => setForm((item) => ({ ...item, language: value }))} /><Field asSelect label="Category" value={form.category} onChange={(value) => setForm((item) => ({ ...item, category: value }))} options={["MARKETING", "UTILITY", "AUTHENTICATION"]} /><label className="grid gap-1.5 text-sm font-medium">Components JSON<textarea required rows={8} value={form.components} onChange={(event) => setForm((item) => ({ ...item, components: event.target.value }))} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 font-mono text-xs outline-none focus:border-[var(--accent)]" /></label><Button type="submit" variant="primary">Save template</Button>{notice && <p role="status" className="text-sm text-[var(--muted)]">{notice}</p>}</form>
      </Surface>
    </section></main>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-xs font-medium text-[var(--muted)]">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="ml-2 h-9 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-2 text-sm text-[var(--ink)]">{options.map((item) => <option key={item} value={item}>{item || "All"}</option>)}</select></label>;
}

function Field({ label, value, onChange, options = [], asSelect = false, id }: { label: string; value: string; onChange: (value: string) => void; options?: string[]; asSelect?: boolean; id?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{asSelect ? <select required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3">{options.map((value) => <option key={value}>{value}</option>)}</select> : <input id={id} required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 outline-none focus:border-[var(--accent)]" />}</label>;
}

function pretty(value: string) { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
function message(value: unknown) { return value instanceof Error ? value.message : "Template request failed."; }
