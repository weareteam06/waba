"use client";

import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Target,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";
import { cn } from "@/lib/utils";

type CampaignForm = {
  name: string;
  templateId: string;
  phoneNumberId: string;
  scheduledAt: string;
  recipients: string;
  parameters: string;
};

type DraftRecipient = {
  recipient: string;
  valid: boolean;
  reason?: string;
};

const campaignStatuses = ["All", "SCHEDULED", "QUEUING", "SENDING", "COMPLETED", "FAILED"] as const;

export function CampaignsWorkspace() {
  const [campaigns, setCampaigns] = useState<api.Campaign[]>([]);
  const [templates, setTemplates] = useState<api.Template[]>([]);
  const [accounts, setAccounts] = useState<api.Account[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof campaignStatuses)[number]>("All");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<CampaignForm>({
    name: "",
    templateId: "",
    phoneNumberId: "",
    scheduledAt: dateTimeValue(),
    recipients: "",
    parameters: "{}",
  });

  useEffect(() => { void load(); }, []);

  const approvedTemplates = useMemo(() => templates.filter((template) => template.approvalStatus === "APPROVED"), [templates]);
  const templateById = useMemo(() => new Map(templates.map((template) => [template.id, template])), [templates]);
  const accountByPhone = useMemo(() => new Map(accounts.map((account) => [account.phoneNumberId, account])), [accounts]);
  const selectedTemplate = form.templateId ? templateById.get(Number(form.templateId)) ?? null : null;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0] ?? null;
  const filteredCampaigns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const template = templateById.get(campaign.templateId);
      const matchesQuery = !normalized
        || campaign.name.toLowerCase().includes(normalized)
        || campaign.phoneNumberId.toLowerCase().includes(normalized)
        || template?.name.toLowerCase().includes(normalized);
      const matchesStatus = status === "All" || campaign.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [campaigns, query, status, templateById]);
  const draftRecipients = useMemo(() => parseRecipients(form.recipients), [form.recipients]);
  const validRecipients = draftRecipients.filter((item) => item.valid);
  const invalidRecipients = draftRecipients.filter((item) => !item.valid);
  const variables = useMemo(() => extractVariables(selectedTemplate), [selectedTemplate]);
  const totals = useMemo(() => campaignTotals(campaigns), [campaigns]);
  const loadingRef = useRef(false);

  useEffect(() => {
    function updateVisibility() {
      setPageVisible(document.visibilityState === "visible");
    }
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const activeCampaign = campaigns.some((campaign) => ["QUEUING", "SENDING"].includes(campaign.status));
    const interval = window.setInterval(() => void load(true), pageVisible ? activeCampaign ? 10000 : 30000 : 120000);
    return () => window.clearInterval(interval);
  }, [campaigns, pageVisible]);

  async function load(silent = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (silent) setRefreshing(true);
    else {
      setBusy(true);
      setNotice("");
    }
    try {
      const [campaignItems, templateItems, accountItems] = await Promise.all([
        api.campaigns(),
        api.templates(),
        api.accounts(),
      ]);
      setCampaigns(campaignItems);
      setTemplates(templateItems);
      setAccounts(accountItems);
      setSelectedId((id) => id ?? campaignItems[0]?.id ?? null);
      setForm((item) => ({
        ...item,
        templateId: item.templateId || String(templateItems.find((template) => template.approvalStatus === "APPROVED")?.id ?? ""),
        phoneNumberId: item.phoneNumberId || accountItems[0]?.phoneNumberId || "",
      }));
    } catch (cause) {
      if (!silent) setNotice(message(cause));
    } finally {
      loadingRef.current = false;
      if (silent) setRefreshing(false);
      else setBusy(false);
    }
  }

  function updateForm(patch: Partial<CampaignForm>) {
    setForm((item) => ({ ...item, ...patch }));
  }

  function openComposer() {
    updateForm({
      name: "",
      scheduledAt: dateTimeValue(),
      recipients: "",
      parameters: sampleParameters(variables),
      templateId: form.templateId || String(approvedTemplates[0]?.id ?? ""),
      phoneNumberId: form.phoneNumberId || accounts[0]?.phoneNumberId || "",
    });
    setComposerOpen(true);
  }

  function loadRecipientFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateForm({ recipients: String(reader.result ?? "") });
    reader.readAsText(file);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parameters = parseParameters(form.parameters);
    if (parameters instanceof Error) {
      setNotice(parameters.message);
      return;
    }
    if (!validRecipients.length || invalidRecipients.length) {
      setNotice("Fix recipient numbers before scheduling. Use E.164 format, for example +919876543210.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const campaign = await api.createCampaign({
        name: form.name.trim(),
        templateId: Number(form.templateId),
        phoneNumberId: form.phoneNumberId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recipients: validRecipients.map((item) => ({ recipient: item.recipient, parameters })),
      });
      setNotice(`${campaign.name} scheduled for ${campaign.totalRecipients} recipients.`);
      setComposerOpen(false);
      await load();
      setSelectedId(campaign.id);
    } catch (cause) {
      setNotice(message(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[var(--canvas)]">
      <PageHeader
        title="Campaigns"
        description="Create, schedule, and monitor approved WhatsApp template campaigns with tenant-safe accounts, rate-limited queues, and retry visibility."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void load()} disabled={busy || refreshing}><RefreshCw className={cn("h-4 w-4", (busy || refreshing) && "animate-spin")} />Refresh</Button>
            <Button variant="primary" onClick={openComposer} disabled={!approvedTemplates.length || !accounts.length}>
              <CalendarPlus className="h-4 w-4" />Create campaign
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        <CampaignMetric label="Recipients targeted" value={totals.recipients} detail="All campaigns" icon={<UsersRound className="h-5 w-5" />} />
        <CampaignMetric label="Queued" value={totals.queued} detail="Waiting workers" icon={<Clock3 className="h-5 w-5" />} />
        <CampaignMetric label="Sent" value={totals.sent} detail={`${deliveryRate(totals)} delivery progress`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <CampaignMetric label="Failed" value={totals.failed} detail="Retry attention" icon={<AlertTriangle className="h-5 w-5" />} />
      </section>

      <section className="grid min-h-0 gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="overflow-hidden">
          <div className="grid gap-3 border-b border-[var(--line)] p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
            <label className="flex h-11 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm text-[var(--muted)] focus-within:border-[var(--accent)]">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaigns, template, or phone number" className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none" />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value as (typeof campaignStatuses)[number])} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm outline-none">
              {campaignStatuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          {busy ? <CampaignTableSkeleton /> : filteredCampaigns.length === 0 ? (
            <EmptyCampaignState accountsReady={accounts.length > 0} templatesReady={approvedTemplates.length > 0} onCreate={openComposer} />
          ) : (
            <div role="table" aria-label="Campaign list">
              <div role="row" className="hidden border-b border-[var(--line)] px-4 py-3 text-xs font-medium uppercase text-[var(--muted)] md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_130px_170px_120px]">
                <span>Campaign</span>
                <span>Template</span>
                <span>Status</span>
                <span>Progress</span>
                <span>Schedule</span>
              </div>
              {filteredCampaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  template={templateById.get(campaign.templateId)}
                  active={campaign.id === selectedCampaign?.id}
                  onSelect={() => setSelectedId(campaign.id)}
                />
              ))}
            </div>
          )}
        </Surface>

        <CampaignDetail campaign={selectedCampaign} template={selectedCampaign ? templateById.get(selectedCampaign.templateId) : undefined} account={selectedCampaign ? accountByPhone.get(selectedCampaign.phoneNumberId) : undefined} />
      </section>

      {composerOpen && (
        <CampaignComposer
          form={form}
          templates={approvedTemplates}
          accounts={accounts}
          selectedTemplate={selectedTemplate}
          variables={variables}
          recipients={draftRecipients}
          invalidCount={invalidRecipients.length}
          busy={saving}
          notice={notice}
          onChange={updateForm}
          onClose={() => setComposerOpen(false)}
          onSubmit={create}
          onFile={loadRecipientFile}
        />
      )}

      {notice && !composerOpen && <p role="status" className="px-6 pb-5 text-sm text-[var(--muted)]">{notice}</p>}
    </main>
  );
}

function CampaignMetric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: ReactNode }) {
  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--panel-strong)] text-[var(--accent)]">{icon}</span>
        <Badge>{detail}</Badge>
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatNumber(value)}</p>
    </Surface>
  );
}

function CampaignRow({ campaign, template, active, onSelect }: { campaign: api.Campaign; template?: api.Template; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("grid w-full gap-3 border-b border-[var(--line)] px-4 py-4 text-left text-sm transition last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_130px_170px_120px]", active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--panel-strong)]")}
    >
      <span className="min-w-0">
        <b className="block truncate font-semibold">{campaign.name}</b>
        <span className="mt-1 block text-[var(--muted)]">{campaign.totalRecipients} recipients via {campaign.phoneNumberId}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{template?.name ?? `Template ${campaign.templateId}`}</span>
        <span className="mt-1 block text-[var(--muted)]">{template?.language ?? "Template language"}</span>
      </span>
      <span><CampaignStatusBadge status={campaign.status} /></span>
      <span>
        <ProgressBar campaign={campaign} />
        <span className="mt-1 block text-xs text-[var(--muted)]">{campaign.sent} sent, {campaign.failed} failed</span>
      </span>
      <time className="text-[var(--muted)]" dateTime={campaign.scheduledAt}>{shortDate(campaign.scheduledAt)}</time>
    </button>
  );
}

function CampaignDetail({ campaign, template, account }: { campaign: api.Campaign | null; template?: api.Template; account?: api.Account }) {
  if (!campaign) {
    return (
      <Surface className="grid min-h-80 place-items-center p-6 text-center">
        <div>
          <Target className="mx-auto h-8 w-8 text-[var(--muted)]" />
          <h2 className="mt-3 text-lg font-semibold">Select a campaign</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Status, queue progress, and retry attention appear here.</p>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="h-fit p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase text-[var(--muted)]">Campaign detail</p>
          <h2 className="mt-1 truncate text-lg font-semibold">{campaign.name}</h2>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <div className="mt-5 grid gap-3">
        <DetailFact label="Template" value={template?.name ?? `Template ${campaign.templateId}`} icon={<FileText className="h-4 w-4" />} />
        <DetailFact label="WhatsApp account" value={account?.displayPhoneNumber ?? campaign.phoneNumberId} icon={<MessageSquareText className="h-4 w-4" />} />
        <DetailFact label="Scheduled" value={new Date(campaign.scheduledAt).toLocaleString()} icon={<CalendarClock className="h-4 w-4" />} />
      </div>
      <div className="mt-5">
        <ProgressBar campaign={campaign} large />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SmallCounter label="Total" value={campaign.totalRecipients} />
          <SmallCounter label="Queued" value={campaign.queued} />
          <SmallCounter label="Sent" value={campaign.sent} />
          <SmallCounter label="Failed" value={campaign.failed} danger={campaign.failed > 0} />
        </div>
      </div>
      <div className="mt-5 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm text-[var(--muted)]">
        Retry handling runs in RabbitMQ. Failed recipient jobs are retried by the backend until the configured attempt limit is reached.
      </div>
    </Surface>
  );
}

function CampaignComposer({
  form,
  templates,
  accounts,
  selectedTemplate,
  variables,
  recipients,
  invalidCount,
  busy,
  notice,
  onChange,
  onClose,
  onSubmit,
  onFile,
}: {
  form: CampaignForm;
  templates: api.Template[];
  accounts: api.Account[];
  selectedTemplate: api.Template | null;
  variables: string[];
  recipients: DraftRecipient[];
  invalidCount: number;
  busy: boolean;
  notice: string;
  onChange: (patch: Partial<CampaignForm>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid bg-black/50 backdrop-blur-sm lg:place-items-center">
      <form onSubmit={onSubmit} className="ml-auto grid h-full w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] border-l border-[var(--line)] bg-[var(--panel)] shadow-2xl lg:h-[88dvh] lg:rounded-lg lg:border">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">Campaign composer</p>
            <h2 className="mt-1 text-xl font-semibold">Schedule template campaign</h2>
          </div>
          <Button aria-label="Close composer" variant="ghost" className="h-10 w-10 px-0" onClick={onClose}><X className="h-5 w-5" /></Button>
        </header>

        <div className="scrollbar-thin grid min-h-0 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid content-start gap-4">
            <ComposerField label="Campaign name">
              <input required value={form.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="May renewal nudge" className="field-control" />
            </ComposerField>
            <div className="grid gap-4 md:grid-cols-2">
              <ComposerField label="Approved template">
                <select required value={form.templateId} onChange={(event) => onChange({ templateId: event.target.value, parameters: sampleParameters(extractVariables(templates.find((template) => template.id === Number(event.target.value)) ?? null)) })} className="field-control">
                  <option value="">Select template</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name} - {template.language}</option>)}
                </select>
              </ComposerField>
              <ComposerField label="WhatsApp account">
                <select required value={form.phoneNumberId} onChange={(event) => onChange({ phoneNumberId: event.target.value })} className="field-control">
                  <option value="">Select phone number</option>
                  {accounts.map((account) => <option key={account.id} value={account.phoneNumberId}>{account.displayPhoneNumber || account.phoneNumberId}</option>)}
                </select>
              </ComposerField>
            </div>
            <ComposerField label="Schedule">
              <input required type="datetime-local" value={form.scheduledAt} onChange={(event) => onChange({ scheduledAt: event.target.value })} className="field-control" />
            </ComposerField>
            <ComposerField label="Recipients">
              <textarea required rows={8} value={form.recipients} onChange={(event) => onChange({ recipients: event.target.value })} placeholder="+919876543210&#10;+15551234567" className="field-control resize-y leading-6" />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>{recipients.filter((item) => item.valid).length} valid recipients, {invalidCount} invalid</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--ink)]">
                  <UploadCloud className="h-4 w-4" />Upload CSV/TXT
                  <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={onFile} />
                </label>
              </div>
            </ComposerField>
            <ComposerField label="Template parameters JSON">
              <textarea value={form.parameters} onChange={(event) => onChange({ parameters: event.target.value })} rows={6} className="field-control resize-y font-mono text-xs leading-5" />
            </ComposerField>
          </div>

          <aside className="grid content-start gap-4">
            <Surface className="p-4 shadow-none">
              <h3 className="text-sm font-semibold">Template preview</h3>
              {!selectedTemplate ? <p className="mt-2 text-sm text-[var(--muted)]">Choose an approved template.</p> : (
                <div className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
                  <p className="text-sm font-semibold">{selectedTemplate.name}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{templateBody(selectedTemplate)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variables.length ? variables.map((item) => <Badge key={item}>{`{{${item}}}`}</Badge>) : <Badge>No variables</Badge>}
                  </div>
                </div>
              )}
            </Surface>
            <Surface className="p-4 shadow-none">
              <h3 className="text-sm font-semibold">Readiness</h3>
              <div className="mt-3 grid gap-2 text-sm">
                <ReadinessRow ok={templates.length > 0} label="Approved template selected" />
                <ReadinessRow ok={accounts.length > 0} label="WhatsApp phone number ready" />
                <ReadinessRow ok={recipients.some((item) => item.valid) && invalidCount === 0} label="Recipient list valid" />
                <ReadinessRow ok={!(parseParameters(form.parameters) instanceof Error)} label="Parameters JSON valid" />
              </div>
            </Surface>
            {notice && <p role="status" className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm text-[var(--muted)]">{notice}</p>}
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] p-5">
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={busy || !form.name.trim() || !form.templateId || !form.phoneNumberId || !recipients.some((item) => item.valid) || invalidCount > 0}>
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Schedule campaign
          </Button>
        </footer>
      </form>
    </div>
  );
}

function ComposerField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

function CampaignTableSkeleton() {
  return <div className="grid gap-3 p-4">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16" />)}</div>;
}

function EmptyCampaignState({ accountsReady, templatesReady, onCreate }: { accountsReady: boolean; templatesReady: boolean; onCreate: () => void }) {
  return (
    <div className="grid min-h-96 place-items-center p-6 text-center">
      <div>
        <Send className="mx-auto h-9 w-9 text-[var(--muted)]" />
        <h2 className="mt-4 text-lg font-semibold">No campaigns found</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
          {accountsReady && templatesReady ? "Create your first scheduled WhatsApp campaign." : "Register a WhatsApp account and sync approved templates before scheduling campaigns."}
        </p>
        <Button className="mt-5" variant="primary" onClick={onCreate} disabled={!accountsReady || !templatesReady}><CalendarPlus className="h-4 w-4" />Create campaign</Button>
      </div>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const success = status === "COMPLETED";
  const danger = status === "FAILED";
  return <Badge className={cn(success && "bg-emerald-500/15 text-emerald-300", danger && "bg-rose-500/15 text-rose-300")}>{status}</Badge>;
}

function ProgressBar({ campaign, large }: { campaign: api.Campaign; large?: boolean }) {
  const total = Math.max(1, campaign.totalRecipients);
  const sent = Math.min(100, (campaign.sent / total) * 100);
  const failed = Math.min(100 - sent, (campaign.failed / total) * 100);
  return (
    <div className={cn("overflow-hidden rounded-full bg-[var(--panel-strong)]", large ? "h-3" : "h-2")}>
      <div className="flex h-full">
        <span className="bg-emerald-400" style={{ width: `${sent}%` }} />
        <span className="bg-rose-400" style={{ width: `${failed}%` }} />
      </div>
    </div>
  );
}

function DetailFact({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--panel)] text-[var(--accent)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-[var(--muted)]">{label}</span>
        <b className="mt-1 block truncate text-sm">{value}</b>
      </span>
    </div>
  );
}

function SmallCounter({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3"><p className="text-xs text-[var(--muted)]">{label}</p><b className={cn("mt-1 block text-lg", danger && "text-[var(--danger)]")}>{formatNumber(value)}</b></div>;
}

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", ok ? "bg-emerald-400" : "bg-[var(--muted)]")} />{label}</div>;
}

function campaignTotals(campaigns: api.Campaign[]) {
  return campaigns.reduce((total, campaign) => ({
    recipients: total.recipients + campaign.totalRecipients,
    queued: total.queued + campaign.queued,
    sent: total.sent + campaign.sent,
    failed: total.failed + campaign.failed,
  }), { recipients: 0, queued: 0, sent: 0, failed: 0 });
}

function deliveryRate(total: ReturnType<typeof campaignTotals>) {
  if (!total.recipients) return "0%";
  return `${Math.round((total.sent / total.recipients) * 100)}%`;
}

function parseRecipients(value: string): DraftRecipient[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((recipient) => {
      const normalized = recipient.split(/[;\s]/)[0]?.trim() ?? "";
      const valid = /^\+[1-9]\d{7,14}$/.test(normalized);
      return { recipient: normalized, valid, reason: valid ? undefined : "Use E.164 format" };
    });
}

function parseParameters(value: string): unknown | Error {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed;
  } catch {
    return new Error("Template parameters must be valid JSON.");
  }
}

function extractVariables(template: api.Template | null) {
  const body = templateBody(template);
  const pattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const variables: string[] = [];
  let match = pattern.exec(body);
  while (match) {
    if (match[1] && !variables.includes(match[1])) variables.push(match[1]);
    match = pattern.exec(body);
  }
  return variables;
}

function templateBody(template: api.Template | null | undefined) {
  if (!template) return "";
  try {
    const components = JSON.parse(template.componentsJson);
    if (!Array.isArray(components)) return "";
    return components.find((component) => component?.type === "BODY")?.text ?? "";
  } catch {
    return "";
  }
}

function sampleParameters(variables: string[]) {
  if (!variables.length) return "{}";
  return JSON.stringify(Object.fromEntries(variables.map((item) => [item, "sample"])), null, 2);
}

function dateTimeValue() {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function shortDate(value: string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatNumber(value: number) {
  return Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value);
}

function message(value: unknown) {
  return value instanceof Error ? value.message : "Campaign request failed.";
}
