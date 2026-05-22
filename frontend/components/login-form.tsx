"use client";

import { ArrowRight, LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, InputHTMLAttributes, useState } from "react";
import { login, registerTenant } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function LoginForm() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tenantSlug: "",
    tenantName: "",
    adminName: "",
    email: "",
    password: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) await registerTenant(form);
      else await login({ tenantSlug: form.tenantSlug, email: form.email, password: form.password });
      router.push(new URLSearchParams(window.location.search).get("next") || "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  function change(key: keyof typeof form, value: string) {
    setForm((item) => ({ ...item, [key]: value }));
  }

  return (
    <main className="grid min-h-dvh bg-[var(--canvas)] p-4 lg:grid-cols-[minmax(420px,1fr)_520px] lg:p-6">
      <section className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-lg bg-[var(--sidebar)] p-6 text-[var(--sidebar-ink)] sm:p-10">
        <div><span className="grid h-12 w-12 place-items-center rounded-md bg-[#23b08d] text-[#07100f]"><MessageSquareText className="h-6 w-6" /></span><h1 className="mt-7 max-w-xl text-4xl font-semibold">WA Command</h1><p className="mt-3 max-w-xl text-emerald-50/72">WhatsApp operations for inbox teams, campaigns, templates, and auditable automations.</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2"><PreviewBubble label="Session model" detail="JWT refresh rotation" /><PreviewBubble label="Tenant guard" detail="Role scoped APIs" /></div>
      </section>
      <section className="grid place-items-center px-0 py-6 sm:px-8">
        <Surface className="w-full max-w-md p-6 sm:p-8">
          <div className="flex gap-1 rounded-md bg-[var(--panel-strong)] p-1">
            <button className={`h-9 flex-1 rounded text-sm ${!register ? "bg-[var(--panel)] font-medium shadow" : ""}`} onClick={() => setRegister(false)}>Sign in</button>
            <button className={`h-9 flex-1 rounded text-sm ${register ? "bg-[var(--panel)] font-medium shadow" : ""}`} onClick={() => setRegister(true)}>Create tenant</button>
          </div>
          <h2 className="mt-6 text-2xl font-semibold">{register ? "Provision tenant" : "Sign in"}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{register ? "Create the first tenant admin for this workspace." : "Use your tenant slug and work account."}</p>
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <Field required label="Tenant slug" value={form.tenantSlug} onChange={(event) => change("tenantSlug", event.target.value)} placeholder="northstar-support" />
            {register && <Field required label="Tenant name" value={form.tenantName} onChange={(event) => change("tenantName", event.target.value)} placeholder="Northstar Support" />}
            {register && <Field required label="Admin name" value={form.adminName} onChange={(event) => change("adminName", event.target.value)} placeholder="Tushar" />}
            <Field required label="Work email" type="email" value={form.email} onChange={(event) => change("email", event.target.value)} placeholder="admin@company.com" />
            <Field required minLength={register ? 12 : undefined} label="Password" type="password" value={form.password} onChange={(event) => change("password", event.target.value)} placeholder={register ? "At least 12 characters" : "Enter password"} />
            <Button type="submit" variant="primary" disabled={busy} className="mt-1 w-full">{busy ? "Working" : register ? "Create and continue" : "Continue"} <ArrowRight className="h-4 w-4" /></Button>
            {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
          </form>
          <div className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--accent)]" />Access and refresh tokens rotate through backend auth</p><p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[var(--accent)]" />Tenant roles gate every workspace request</p></div>
        </Surface>
      </section>
    </main>
  );
}

function PreviewBubble({ label, detail }: { label: string; detail: string }) {
  return <div className="rounded-md border border-white/12 bg-white/8 p-4"><span className="block text-sm text-emerald-50/68">{label}</span><b className="mt-2 block text-lg">{detail}</b></div>;
}

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input {...props} className="h-11 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 outline-none focus:border-[var(--accent)]" /></label>;
}
