"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { login, registerTenant } from "@/lib/api-client";

const loginSchema = z.object({
  tenantSlug: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(1),
  tenantName: z.string().optional(),
  adminName: z.string().optional(),
});

type AuthForm = z.infer<typeof loginSchema>;

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "mfa">("login");
  const [error, setError] = useState("");
  const form = useForm<AuthForm>({ resolver: zodResolver(loginSchema), defaultValues: { tenantSlug: "", email: "", password: "", tenantName: "", adminName: "" } });

  async function submit(values: AuthForm) {
    setError("");
    try {
      if (mode === "register") {
        await registerTenant({
          tenantSlug: values.tenantSlug,
          tenantName: values.tenantName || values.tenantSlug,
          adminName: values.adminName || values.email,
          email: values.email,
          password: values.password,
        });
      } else {
        await login({ tenantSlug: values.tenantSlug, email: values.email, password: values.password });
      }
      router.push(new URLSearchParams(window.location.search).get("next") || "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    }
  }

  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-[var(--canvas)] p-4 lg:grid-cols-[minmax(0,1fr)_520px] lg:p-6">
      <section className="relative hidden rounded-lg border border-[var(--line)] bg-[var(--sidebar)] p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-lg bg-[var(--primary)] text-white"><MessageSquareText className="h-7 w-7" /></span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 max-w-3xl text-6xl font-semibold leading-tight text-[var(--ink)]">Enterprise WhatsApp engagement, built for serious teams.</motion.h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Inbox, campaigns, templates, automations, AI handoff, analytics, billing, and governance in one tenant-safe command center.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {["JWT refresh sessions", "MFA ready UI", "Role-aware routes"].map((item) => <Card key={item} className="p-4"><ShieldCheck className="h-5 w-5 text-[var(--success)]" /><p className="mt-3 text-sm text-[var(--ink)]">{item}</p></Card>)}
        </div>
      </section>
      <section className="relative grid place-items-center">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 flex rounded-lg bg-[var(--panel-strong)] p-1">
            {(["login", "register", "forgot", "mfa"] as const).map((item) => <button key={item} className={`h-10 flex-1 rounded-md text-xs font-medium capitalize transition ${mode === item ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`} onClick={() => setMode(item)}>{item}</button>)}
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">{mode === "mfa" ? <Fingerprint /> : <KeyRound />}</span>
            <div><h2 className="text-2xl font-semibold">{mode === "register" ? "Create tenant" : mode === "forgot" ? "Recover access" : mode === "mfa" ? "Verify identity" : "Welcome back"}</h2><p className="mt-1 text-sm text-[var(--muted)]">Secure workspace access for multi-tenant operations.</p></div>
          </div>
          <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(submit)}>
            {mode !== "mfa" && <Field label="Tenant slug" {...form.register("tenantSlug")} error={form.formState.errors.tenantSlug?.message} />}
            {mode === "register" && <Field label="Organization name" {...form.register("tenantName")} />}
            {mode === "register" && <Field label="Admin name" {...form.register("adminName")} />}
            {mode !== "mfa" && <Field label="Email" type="email" {...form.register("email")} error={form.formState.errors.email?.message} />}
            {mode !== "forgot" && <Field label={mode === "mfa" ? "One-time code" : "Password"} type={mode === "mfa" ? "text" : "password"} {...form.register("password")} error={form.formState.errors.password?.message} />}
            <Button variant="primary" size="lg" type={mode === "forgot" || mode === "mfa" ? "button" : "submit"} onClick={() => (mode === "forgot" || mode === "mfa") && setMode("login")}>
              {mode === "forgot" ? "Send recovery link" : mode === "mfa" ? "Verify code" : "Continue"} <ArrowRight className="h-4 w-4" />
            </Button>
            {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
          </form>
        </Card>
      </section>
    </main>
  );
}
