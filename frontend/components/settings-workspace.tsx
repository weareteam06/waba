"use client";

import {
  CheckCircle2,
  Copy,
  FileStack,
  Inbox,
  KeyRound,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Webhook,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function SettingsWorkspace() {
  const [tenant, setTenant] = useState<api.Tenant | null>(null);
  const [accounts, setAccounts] = useState<api.Account[]>([]);
  const [readiness, setReadiness] = useState<api.WhatsAppReadiness | null>(null);
  const [templates, setTemplates] = useState<api.Template[]>([]);
  const [messages, setMessages] = useState<api.Message[]>([]);
  const [users, setUsers] = useState<api.User[]>([]);
  const [busy, setBusy] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState({ phoneNumberId: "", wabaId: "", displayPhoneNumber: "" });
  const [user, setUser] = useState({ displayName: "", email: "", password: "", role: "AGENT" });
  const [publicBaseUrl, setPublicBaseUrl] = useState("");

  useEffect(() => { void load(); }, []);

  const webhookUrl = useMemo(() => `${apiBase}${readiness?.webhookPath ?? "/api/v1/webhooks/whatsapp"}`, [readiness]);
  const publicWebhookUrl = useMemo(() => {
    const base = publicBaseUrl.trim().replace(/\/+$/, "");
    return base ? `${base}${readiness?.webhookPath ?? "/api/v1/webhooks/whatsapp"}` : "";
  }, [publicBaseUrl, readiness]);
  const readyCount = readiness ? [
    readiness.accessTokenConfigured,
    readiness.appSecretConfigured,
    readiness.webhookVerifyTokenConfigured,
    accounts.length > 0,
  ].filter(Boolean).length : 0;
  const metaReady = Boolean(readiness?.accessTokenConfigured && readiness.appSecretConfigured && readiness.webhookVerifyTokenConfigured);
  const approvedTemplates = templates.filter((template) => template.approvalStatus === "APPROVED").length;
  const outboundMessages = messages.filter((item) => item.direction === "OUTBOUND").length;
  const inboundMessages = messages.filter((item) => item.direction === "INBOUND").length;
  const testSteps = [
    {
      title: "Backend Meta credentials",
      detail: metaReady ? "Token, app secret, and verify token are configured." : "Configure Meta values in backend .env and restart the API.",
      done: metaReady,
      icon: ShieldCheck,
      action: "Review readiness",
      href: "#meta-readiness",
    },
    {
      title: "WhatsApp phone registered",
      detail: accounts.length ? `${accounts.length} tenant phone number${accounts.length === 1 ? "" : "s"} registered.` : "Save Phone Number ID and WABA ID from Meta.",
      done: accounts.length > 0,
      icon: PhoneCall,
      action: "Register account",
      href: "#register-phone",
    },
    {
      title: "Templates synced",
      detail: templates.length ? `${templates.length} templates loaded, ${approvedTemplates} approved.` : "Sync templates from Meta before campaigns.",
      done: templates.length > 0,
      icon: FileStack,
      action: "Open Templates",
      href: "/templates",
    },
    {
      title: "Outbound message tested",
      detail: outboundMessages ? `${outboundMessages} outbound messages stored.` : "Start a new chat in Inbox and send a test message.",
      done: outboundMessages > 0,
      icon: MessageCircle,
      action: "Open Inbox",
      href: "/inbox",
    },
    {
      title: "Inbound webhook received",
      detail: inboundMessages ? `${inboundMessages} inbound webhook messages stored.` : "Send a WhatsApp message to your Meta test/business number.",
      done: inboundMessages > 0,
      icon: Inbox,
      action: "Open Inbox",
      href: "/inbox",
    },
  ];

  async function load() {
    setBusy(true);
    setNotice("");
    const [tenantResult, accountsResult, readinessResult, usersResult, templatesResult, messagesResult] = await Promise.allSettled([
      api.tenantMe(),
      api.accounts(),
      api.whatsappReadiness(),
      api.users(),
      api.templates(),
      api.messages(),
    ]);
    if (tenantResult.status === "fulfilled") setTenant(tenantResult.value); else setNotice(message(tenantResult.reason));
    if (accountsResult.status === "fulfilled") setAccounts(accountsResult.value); else setNotice(message(accountsResult.reason));
    if (readinessResult.status === "fulfilled") setReadiness(readinessResult.value); else setNotice(message(readinessResult.reason));
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    if (templatesResult.status === "fulfilled") setTemplates(templatesResult.value);
    if (messagesResult.status === "fulfilled") setMessages(messagesResult.value);
    setBusy(false);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAccount(true);
    setNotice("");
    try {
      const saved = await api.registerAccount({
        phoneNumberId: account.phoneNumberId.trim(),
        wabaId: account.wabaId.trim(),
        displayPhoneNumber: account.displayPhoneNumber.trim(),
      });
      setAccount({ phoneNumberId: "", wabaId: "", displayPhoneNumber: "" });
      await load();
      setNotice(`WhatsApp account ${saved.phoneNumberId} saved successfully.`);
    } catch (cause) {
      setNotice(message(cause));
    } finally {
      setSavingAccount(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingUser(true);
    setNotice("");
    try {
      await api.createUser({ displayName: user.displayName, email: user.email, password: user.password, roles: [user.role] });
      setUser((item) => ({ ...item, displayName: "", email: "", password: "" }));
      setNotice("User created.");
      await load();
    } catch (cause) {
      setNotice(message(cause));
    } finally {
      setSavingUser(false);
    }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setNotice(`${label} copied.`);
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[var(--canvas)]">
      <PageHeader
        title="Settings"
        description="Manage tenant identity, WhatsApp Cloud API readiness, webhook setup, registered phone numbers, and team access."
        action={<Button onClick={() => void load()} disabled={busy}><RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />Refresh</Button>}
      />

      <section className="grid gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid content-start gap-4">
          <Surface id="meta-readiness" className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Meta WhatsApp readiness</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">These checks read backend configuration without exposing secrets.</p>
              </div>
              <Badge>{readyCount}/4 ready</Badge>
            </div>
            {busy && !readiness ? <Skeleton className="mt-4 h-32" /> : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ReadinessCard ok={Boolean(readiness?.accessTokenConfigured)} title="Access token" detail="META_WHATSAPP_ACCESS_TOKEN" />
                <ReadinessCard ok={Boolean(readiness?.appSecretConfigured)} title="App secret" detail="META_APP_SECRET for signature validation" />
                <ReadinessCard ok={Boolean(readiness?.webhookVerifyTokenConfigured)} title="Verify token" detail="META_WEBHOOK_VERIFY_TOKEN" />
                <ReadinessCard ok={accounts.length > 0} title="Phone account" detail={`${accounts.length} registered phone number${accounts.length === 1 ? "" : "s"}`} />
              </div>
            )}
          </Surface>

          <Surface id="register-phone" className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><ListChecks className="h-5 w-5 text-[var(--accent)]" />Live Meta test run</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Follow this sequence to prove the portal is connected end to end.</p>
              </div>
              <Badge>{testSteps.filter((step) => step.done).length}/{testSteps.length} complete</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {testSteps.map((step, index) => <TestStep key={step.title} index={index + 1} {...step} />)}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Webhook callback</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Use your public tunnel domain plus this backend path in Meta.</p>
              </div>
              <Webhook className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Public tunnel base URL
                <input
                  value={publicBaseUrl}
                  onChange={(event) => setPublicBaseUrl(event.target.value)}
                  placeholder="https://your-ngrok-domain.ngrok-free.dev"
                  className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 outline-none focus:border-[var(--accent)]"
                />
              </label>
              {publicWebhookUrl && <CopyRow label="Meta callback" value={publicWebhookUrl} onCopy={() => void copy(publicWebhookUrl, "Meta callback URL")} />}
              <CopyRow label="Local callback" value={webhookUrl} onCopy={() => void copy(webhookUrl, "Webhook URL")} />
              <CopyRow label="Callback path" value={readiness?.webhookPath ?? "/api/v1/webhooks/whatsapp"} onCopy={() => void copy(readiness?.webhookPath ?? "/api/v1/webhooks/whatsapp", "Webhook path")} />
              <CopyRow label="Graph version" value={readiness?.graphVersion ?? "Not loaded"} onCopy={() => void copy(readiness?.graphVersion ?? "", "Graph version")} />
            </div>
            <p className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm text-[var(--muted)]">
              For ngrok, replace the local domain with your ngrok HTTPS domain and keep the same path.
            </p>
          </Surface>

          <Surface className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
              <div>
                <h2 className="text-sm font-semibold">Registered WhatsApp accounts</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Incoming webhooks are matched by phone number id.</p>
              </div>
              <Button variant="ghost" onClick={() => void load()} disabled={busy}><RefreshCw className="h-4 w-4" />Refresh</Button>
            </div>
            {busy ? <div className="grid gap-3 p-5"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : accounts.length === 0 ? (
              <div className="p-5 text-sm text-[var(--muted)]">
                No phone numbers registered yet. Add the Phone Number ID and WABA ID from Meta, then refresh this list.
              </div>
            ) : accounts.map((item) => <AccountRow key={item.id} account={item} />)}
          </Surface>
        </div>

        <div className="grid content-start gap-4">
          <Surface className="p-5">
            <h2 className="text-lg font-semibold">Register phone number</h2>
            <form className="mt-4 grid gap-3" onSubmit={createAccount}>
              <Input label="Phone number id" value={account.phoneNumberId} onChange={(phoneNumberId) => setAccount((item) => ({ ...item, phoneNumberId }))} />
              <Input label="WABA id" value={account.wabaId} onChange={(wabaId) => setAccount((item) => ({ ...item, wabaId }))} />
              <Input label="Display phone" value={account.displayPhoneNumber} onChange={(displayPhoneNumber) => setAccount((item) => ({ ...item, displayPhoneNumber }))} optional />
              <Button variant="primary" type="submit" disabled={savingAccount || !account.phoneNumberId.trim() || !account.wabaId.trim()}>
                {savingAccount ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                {savingAccount ? "Saving" : "Save account"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-[var(--muted)]">The access token and app secret stay in backend `.env`; do not paste secrets into the browser.</p>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-lg font-semibold">Tenant</h2>
            {busy ? <Skeleton className="mt-4 h-20" /> : tenant ? (
              <div className="mt-4 rounded-md bg-[var(--panel-strong)] p-4">
                <b className="block text-xl">{tenant.name}</b>
                <span className="mt-1 block text-sm text-[var(--muted)]">{tenant.slug} · tenant #{tenant.id}</span>
                <Badge className="mt-3">{tenant.status}</Badge>
              </div>
            ) : <p className="mt-3 text-sm text-[var(--muted)]">Tenant data unavailable.</p>}
          </Surface>

          <Surface className="p-5">
            <h2 className="text-lg font-semibold">Create user</h2>
            <form className="mt-4 grid gap-3" onSubmit={createUser}>
              <Input label="Display name" value={user.displayName} onChange={(displayName) => setUser((item) => ({ ...item, displayName }))} />
              <Input label="Email" value={user.email} onChange={(email) => setUser((item) => ({ ...item, email }))} type="email" />
              <Input label="Password" value={user.password} onChange={(password) => setUser((item) => ({ ...item, password }))} type="password" />
              <label className="grid gap-1.5 text-sm font-medium">Role<select value={user.role} onChange={(event) => setUser((item) => ({ ...item, role: event.target.value }))} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3"><option>AGENT</option><option>AUDITOR</option><option>TENANT_ADMIN</option></select></label>
              <Button variant="primary" type="submit" disabled={savingUser}>{savingUser ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Create user</Button>
            </form>
          </Surface>
        </div>

        <Surface className="overflow-hidden xl:col-span-2">
          <div className="border-b border-[var(--line)] p-4 text-sm font-semibold">Users</div>
          {users.length === 0 ? <p className="p-5 text-sm text-[var(--muted)]">User listing is available to tenant admins and auditors.</p> : users.map((item) => (
            <div key={item.id} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_220px_220px]">
              <b>{item.displayName}</b>
              <span className="text-sm text-[var(--muted)]">{item.email}</span>
              <span className="flex flex-wrap gap-1">{item.roles.map((role) => <Badge key={role}>{role}</Badge>)}</span>
            </div>
          ))}
        </Surface>
      </section>

      {notice && <p role="status" className="px-6 pb-5 text-sm text-[var(--muted)]">{notice}</p>}
    </main>
  );
}

function TestStep({
  index,
  title,
  detail,
  done,
  icon: Icon,
  action,
  href,
}: {
  index: number;
  title: string;
  detail: string;
  done: boolean;
  icon: LucideIcon;
  action: string;
  href: string;
}) {
  function go() {
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.assign(href);
  }

  return (
    <div className={cn("grid gap-3 rounded-md border p-3 sm:grid-cols-[36px_minmax(0,1fr)_140px] sm:items-center", done ? "border-emerald-500/25 bg-emerald-500/8" : "border-[var(--line)] bg-[var(--panel-strong)]")}>
      <span className={cn("grid h-9 w-9 place-items-center rounded-md", done ? "bg-emerald-500/15 text-emerald-300" : "bg-[var(--panel)] text-[var(--accent)]")}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{index}. {title}</span>
        <span className="mt-1 block text-xs text-[var(--muted)]">{detail}</span>
      </span>
      <Button variant={done ? "ghost" : "secondary"} onClick={go}>{action}</Button>
    </div>
  );
}

function ReadinessCard({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-[var(--danger)]" />}
        <b className="text-sm">{title}</b>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="grid gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 sm:grid-cols-[120px_minmax(0,1fr)_40px] sm:items-center">
      <span className="text-xs uppercase text-[var(--muted)]">{label}</span>
      <code className="min-w-0 break-all text-sm">{value}</code>
      <Button aria-label={`Copy ${label}`} className="h-9 w-9 px-0" onClick={onCopy}><Copy className="h-4 w-4" /></Button>
    </div>
  );
}

function AccountRow({ account }: { account: api.Account }) {
  return (
    <div className="grid gap-3 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <b className="truncate">{account.displayPhoneNumber || account.phoneNumberId}</b>
        </div>
        <span className="mt-1 block break-all text-sm text-[var(--muted)]">Phone id {account.phoneNumberId}</span>
      </div>
      <div className="min-w-0">
        <span className="block text-xs uppercase text-[var(--muted)]">WABA</span>
        <span className="mt-1 block break-all text-sm">{account.wabaId}</span>
      </div>
      <Badge className="w-fit gap-1"><KeyRound className="h-3.5 w-3.5" />Tenant scoped</Badge>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", optional = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input required={!optional} type={type} minLength={type === "password" ? 12 : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 outline-none focus:border-[var(--accent)]" />
    </label>
  );
}

function message(value: unknown) {
  return value instanceof Error ? value.message : "Settings request failed.";
}
