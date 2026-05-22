"use client";

import { PhoneCall, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/workspace-panels";
import * as api from "@/lib/workspace-api";

export function SettingsWorkspace() {
  const [tenant, setTenant] = useState<api.Tenant | null>(null);
  const [accounts, setAccounts] = useState<api.Account[]>([]);
  const [users, setUsers] = useState<api.User[]>([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState({ phoneNumberId: "", wabaId: "", displayPhoneNumber: "" });
  const [user, setUser] = useState({ displayName: "", email: "", password: "", role: "AGENT" });

  useEffect(() => { void load(); }, []);

  async function load() {
    setBusy(true);
    const [tenantResult, accountsResult, usersResult] = await Promise.allSettled([api.tenantMe(), api.accounts(), api.users()]);
    if (tenantResult.status === "fulfilled") setTenant(tenantResult.value); else setNotice(message(tenantResult.reason));
    if (accountsResult.status === "fulfilled") setAccounts(accountsResult.value); else setNotice(message(accountsResult.reason));
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    setBusy(false);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.registerAccount(account);
      setAccount({ phoneNumberId: "", wabaId: "", displayPhoneNumber: "" });
      setNotice("WhatsApp account registered.");
      await load();
    } catch (cause) { setNotice(message(cause)); }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.createUser({ displayName: user.displayName, email: user.email, password: user.password, roles: [user.role] });
      setUser((item) => ({ ...item, displayName: "", email: "", password: "" }));
      setNotice("User created.");
      await load();
    } catch (cause) { setNotice(message(cause)); }
  }

  return <main><PageHeader title="Settings" description="Manage tenant context, WhatsApp Cloud API account registration, and workspace users." />
    <section className="grid gap-4 px-4 py-5 sm:px-6 xl:grid-cols-2">
      <Surface className="p-5"><h2 className="text-lg font-semibold">Tenant</h2>{busy ? <Skeleton className="mt-4 h-20" /> : tenant ? <div className="mt-4 rounded-md bg-[var(--panel-strong)] p-4"><b className="block text-xl">{tenant.name}</b><span className="mt-1 block text-sm text-[var(--muted)]">{tenant.slug} · tenant #{tenant.id}</span><Badge className="mt-3">{tenant.status}</Badge></div> : <p className="mt-3 text-sm text-[var(--muted)]">Tenant data unavailable.</p>}{notice && <p role="status" className="mt-4 text-sm text-[var(--muted)]">{notice}</p>}</Surface>
      <Surface className="p-5"><h2 className="text-lg font-semibold">Register phone number</h2><form className="mt-4 grid gap-3" onSubmit={createAccount}><Input label="Phone number id" value={account.phoneNumberId} onChange={(phoneNumberId) => setAccount((item) => ({ ...item, phoneNumberId }))} /><Input label="WABA id" value={account.wabaId} onChange={(wabaId) => setAccount((item) => ({ ...item, wabaId }))} /><Input label="Display phone" value={account.displayPhoneNumber} onChange={(displayPhoneNumber) => setAccount((item) => ({ ...item, displayPhoneNumber }))} optional /><Button variant="primary" type="submit"><PhoneCall className="h-4 w-4" />Register account</Button></form></Surface>
      <Surface className="overflow-hidden"><div className="border-b border-[var(--line)] p-4 text-sm font-semibold">WhatsApp accounts</div>{accounts.length === 0 ? <p className="p-5 text-sm text-[var(--muted)]">No phone numbers registered.</p> : accounts.map((item) => <div key={item.id} className="border-b border-[var(--line)] p-4 last:border-0"><b className="block">{item.displayPhoneNumber || item.phoneNumberId}</b><span className="block text-sm text-[var(--muted)]">Phone id {item.phoneNumberId} · WABA {item.wabaId}</span></div>)}</Surface>
      <Surface className="p-5"><h2 className="text-lg font-semibold">Create user</h2><form className="mt-4 grid gap-3" onSubmit={createUser}><Input label="Display name" value={user.displayName} onChange={(displayName) => setUser((item) => ({ ...item, displayName }))} /><Input label="Email" value={user.email} onChange={(email) => setUser((item) => ({ ...item, email }))} type="email" /><Input label="Password" value={user.password} onChange={(password) => setUser((item) => ({ ...item, password }))} type="password" /><label className="grid gap-1.5 text-sm font-medium">Role<select value={user.role} onChange={(event) => setUser((item) => ({ ...item, role: event.target.value }))} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3"><option>AGENT</option><option>AUDITOR</option><option>TENANT_ADMIN</option></select></label><Button variant="primary" type="submit"><UserPlus className="h-4 w-4" />Create user</Button></form></Surface>
      <Surface className="overflow-hidden xl:col-span-2"><div className="border-b border-[var(--line)] p-4 text-sm font-semibold">Users</div>{users.length === 0 ? <p className="p-5 text-sm text-[var(--muted)]">User listing is available to tenant admins and auditors.</p> : users.map((item) => <div key={item.id} className="grid gap-2 border-b border-[var(--line)] p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_180px_200px]"><b>{item.displayName}</b><span className="text-sm text-[var(--muted)]">{item.email}</span><span className="flex flex-wrap gap-1">{item.roles.map((role) => <Badge key={role}>{role}</Badge>)}</span></div>)}</Surface>
    </section></main>;
}

function Input({ label, value, onChange, type = "text", optional = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<input required={!optional} type={type} minLength={type === "password" ? 12 : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3" /></label>; }
function message(value: unknown) { return value instanceof Error ? value.message : "Settings request failed."; }
