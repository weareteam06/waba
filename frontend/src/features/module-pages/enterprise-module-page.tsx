"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Cable,
  ContactRound,
  CreditCard,
  Download,
  FileUp,
  KeyRound,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Field, Textarea } from "@/src/components/ui/field";
import { PageShell } from "@/src/components/page-shell";
import { VirtualizedList } from "@/src/components/virtualized-list";
import { contactSegments, integrationHealth } from "@/src/constants/demo-data";

type ModuleKind = "contacts" | "ai" | "team" | "integrations" | "billing" | "reports";

const config: Record<ModuleKind, { title: string; description: string; icon: typeof Bot; action: string }> = {
  contacts: {
    title: "Contact management",
    description: "Customer profiles, segmentation, tags, notes, and interaction history stitched into tenant-safe WhatsApp context.",
    icon: ContactRound,
    action: "Create segment",
  },
  ai: {
    title: "AI chatbot",
    description: "Configure prompts, model behavior, guardrails, knowledge sources, training workflows, and AI performance metrics.",
    icon: Bot,
    action: "Train assistant",
  },
  team: {
    title: "Team management",
    description: "Manage users, roles, permissions, access policy, agent activity, and audit-friendly operating controls.",
    icon: UsersRound,
    action: "Invite user",
  },
  integrations: {
    title: "Integrations",
    description: "Monitor webhooks, API keys, external tools, status checks, and operational connectivity.",
    icon: Cable,
    action: "Add integration",
  },
  billing: {
    title: "Billing and subscription",
    description: "Plan usage, invoices, WhatsApp send volume, payment history, and subscription controls.",
    icon: CreditCard,
    action: "Upgrade plan",
  },
  reports: {
    title: "Reports and analytics",
    description: "Exportable conversation, campaign, AI, and agent performance reporting with executive-grade views.",
    icon: Download,
    action: "Export report",
  },
};

export function EnterpriseModulePage({ kind }: { kind: ModuleKind }) {
  const item = config[kind];
  const Icon = item.icon;

  return (
    <PageShell
      title={item.title}
      description={item.description}
      action={<Button variant="primary"><Plus className="h-4 w-4" />{item.action}</Button>}
    >
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Operational workspace</CardTitle>
            <Badge>Backend-ready UI</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {kind === "integrations" ? (
              <div className="md:col-span-2">
                <VirtualizedList
                  items={integrationHealth}
                  height={320}
                  render={(row) => (
                    <div className="mx-1 mb-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                      <b>{row[0]}</b>
                      <p className="mt-1 text-sm text-[var(--muted)]">{row[1]} · {row[2]} · {row[3]}</p>
                    </div>
                  )}
                />
              </div>
            ) : (
              contactSegments.map((row, index) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-[var(--accent)]" />
                    </span>
                    <Badge>{row.growth}</Badge>
                  </div>
                  <h2 className="mt-4 font-semibold">{row.name}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{row.contacts.toLocaleString()} records</p>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
        <RightComposer kind={kind} />
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <InfoCard icon={ShieldCheck} title="Permission-aware" detail="Controls render around tenant roles and backend authorization boundaries." />
        <InfoCard icon={KeyRound} title="Secure by design" detail="API calls use the shared session client, token refresh, and protected workspace routes." />
        <InfoCard icon={FileUp} title="Extensible module" detail="The UI is structured for future backend endpoints without redesigning the workspace." />
      </section>
    </PageShell>
  );
}

function RightComposer({ kind }: { kind: ModuleKind }) {
  const pie = [
    { name: "Delivered", value: 68, color: "#38BDF8" },
    { name: "Read", value: 24, color: "#A78BFA" },
    { name: "Failed", value: 8, color: "#F59E0B" },
  ];

  if (kind === "reports" || kind === "billing") {
    return (
      <Card>
        <CardHeader><CardTitle>{kind === "billing" ? "Usage mix" : "Report mix"}</CardTitle></CardHeader>
        <CardContent className="grid place-items-center overflow-hidden">
          <PieChart width={340} height={260}>
            <Pie data={pie} dataKey="value" innerRadius={58} outerRadius={92}>
              {pie.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{kind === "ai" ? "Prompt studio" : kind === "integrations" ? "Webhook setup" : "Quick editor"}</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <Field label={kind === "ai" ? "Model" : kind === "team" ? "Role" : "Name"} defaultValue={kind === "ai" ? "gpt-4.1-mini" : ""} />
        <Textarea
          label={kind === "ai" ? "System prompt" : "Notes"}
          defaultValue={kind === "ai" ? "You are a helpful WhatsApp support assistant. Escalate uncertain cases to humans." : ""}
        />
        <Button variant="primary">Save draft</Button>
      </CardContent>
    </Card>
  );
}

function InfoCard({ icon: Icon, title, detail }: { icon: typeof ShieldCheck; title: string; detail: string }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-[var(--accent)]" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </Card>
  );
}
