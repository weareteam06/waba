"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Circle,
  Clipboard,
  Copy,
  FileText,
  Image as ImageIcon,
  Languages,
  Link2,
  MessageCircle,
  MoreHorizontal,
  PanelRightClose,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/cn";
import {
  createDraftTemplate,
  deleteEnterpriseTemplate,
  fetchEnterpriseTemplates,
  fetchTemplateAccounts,
  saveEnterpriseTemplate,
  syncEnterpriseTemplates,
} from "./template-api";
import { useTemplateWorkspaceStore } from "./template-store";
import type {
  ButtonType,
  EnterpriseTemplate,
  HeaderType,
  PreviewDevice,
  PreviewTheme,
  TemplateButton,
  TemplateCategory,
  TemplateFormValues,
  TemplateStatus,
} from "./types";

const categories: Array<TemplateCategory | "All"> = ["All", "Marketing", "Utility", "Authentication"];
const statuses: Array<TemplateStatus | "All"> = ["All", "Approved", "Pending", "Rejected", "Draft", "Paused"];
const languages = ["English (US)", "English (UK)", "Hindi", "Spanish", "Portuguese", "Arabic"];
const headerTypes: HeaderType[] = ["none", "text", "image", "video", "document"];
const buttonTypes: Array<{ type: ButtonType; label: string }> = [
  { type: "quick_reply", label: "Quick reply" },
  { type: "url", label: "URL" },
  { type: "phone", label: "Phone call" },
  { type: "coupon", label: "Copy coupon" },
];

const formSchema = z.object({
  name: z.string().min(3, "Use at least 3 characters").regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores"),
  category: z.enum(["Marketing", "Utility", "Authentication"]),
  language: z.string().min(1, "Choose a language"),
  headerType: z.enum(["none", "text", "image", "video", "document"]),
  headerText: z.string().max(60, "Header text is limited to 60 characters"),
  mediaUrl: z.string(),
  body: z.string().min(12, "Body needs more detail").max(1024, "Body is limited to 1024 characters"),
  footer: z.string().max(60, "Footer is limited to 60 characters"),
  buttons: z.array(z.object({
    id: z.string(),
    type: z.enum(["quick_reply", "url", "phone", "coupon"]),
    label: z.string().min(1, "Button label is required").max(25, "Button label is limited to 25 characters"),
    value: z.string(),
  })).max(3, "WhatsApp templates support up to 3 buttons in this builder"),
});

const sampleVariables: Record<string, string> = {
  first_name: "Aarav",
  plan_name: "Scale",
  renewal_date: "May 31",
  invoice_id: "INV-2049",
  code: "482911",
  minutes: "10",
  discount: "20% off",
  workspace: "Northstar",
};

export function TemplateManagementPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EnterpriseTemplate | null>(null);
  const [livePreview, setLivePreview] = useState<EnterpriseTemplate | null>(null);
  const [notice, setNotice] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["enterprise-templates"], queryFn: fetchEnterpriseTemplates });
  const { data: accounts = [] } = useQuery({ queryKey: ["template-accounts"], queryFn: fetchTemplateAccounts });
  const store = useTemplateWorkspaceStore();
  const templates = useMemo(() => (draft ? [draft, ...data] : data), [data, draft]);
  const selected = useMemo(() => templates.find((item) => item.id === store.selectedId) ?? templates[0], [templates, store.selectedId]);
  const previewTemplate = selected && livePreview?.id === selected.id ? livePreview : selected;
  const syncMutation = useMutation({
    mutationFn: () => syncEnterpriseTemplates(selected?.phoneNumberId || accounts[0]?.phoneNumberId),
    onSuccess: async (synced) => {
      setNotice(`Synced ${synced.length} templates from Meta.`);
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["enterprise-templates"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Template sync failed."),
  });

  useEffect(() => {
    if ((!store.selectedId || !templates.some((item) => item.id === store.selectedId)) && templates[0]) store.setSelectedId(templates[0].id);
  }, [store, templates]);

  useEffect(() => setLivePreview(null), [selected?.id]);

  function createTemplate() {
    const next = createDraftTemplate(accounts[0]?.phoneNumberId);
    setDraft(next);
    store.setSelectedId(next.id);
    setNotice("Draft ready. Submit for review to save it.");
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-[#0F172A] text-[#F8FAFC]">
      <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)_390px]">
        <TemplateSidebar
          templates={templates}
          loading={isLoading}
          accountsReady={accounts.length > 0}
          syncing={syncMutation.isPending}
          notice={notice}
          onCreate={createTemplate}
          onSync={() => syncMutation.mutate()}
        />
        <section className="min-w-0 border-x border-white/8 bg-[#0F172A]">
          {selected ? (
            <TemplateEditor
              key={selected.id}
              template={selected}
              notice={notice}
              syncing={syncMutation.isPending}
              onNotice={setNotice}
              onPreviewChange={setLivePreview}
              onSync={() => syncMutation.mutate()}
              onSaved={async (template) => {
                setDraft(null);
                store.setSelectedId(template.id);
                setNotice(`${template.name} saved.`);
                await queryClient.invalidateQueries({ queryKey: ["enterprise-templates"] });
              }}
              onDeleted={async () => {
                setNotice(`${selected.name} deleted.`);
                store.setSelectedId("");
                await queryClient.invalidateQueries({ queryKey: ["enterprise-templates"] });
              }}
            />
          ) : <EditorSkeleton />}
        </section>
        <AnimatePresence initial={false}>
          {store.rightPanelOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="min-w-0 bg-[#111827] xl:block"
            >
              {previewTemplate ? <AnalyticsPanel template={previewTemplate} /> : <RightPanelSkeleton />}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export const TemplateSidebar = memo(function TemplateSidebar({
  templates,
  loading,
  accountsReady,
  syncing,
  notice,
  onCreate,
  onSync,
}: {
  templates: EnterpriseTemplate[];
  loading: boolean;
  accountsReady: boolean;
  syncing: boolean;
  notice: string;
  onCreate: () => void;
  onSync: () => void;
}) {
  const { search, category, status, selectedId, setSearch, setCategory, setStatus, setSelectedId } = useTemplateWorkspaceStore();
  const [visibleCount, setVisibleCount] = useState(8);
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return templates.filter((item) => {
      const matchesSearch = !normalized || item.name.toLowerCase().includes(normalized) || item.body.toLowerCase().includes(normalized);
      const matchesCategory = category === "All" || item.category === category;
      const matchesStatus = status === "All" || item.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [category, search, status, templates]);
  const visible = filtered.slice(0, visibleCount);
  const approved = templates.filter((item) => item.status === "Approved").length;

  useEffect(() => setVisibleCount(8), [search, category, status]);

  return (
    <aside className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[#0B1120]">
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0B1120]/90 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-[#94A3B8]">Template hub</p>
            <h1 className="mt-1 text-xl font-semibold">WhatsApp templates</h1>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="secondary" aria-label="Sync templates from Meta" onClick={onSync} disabled={!accountsReady || syncing}>
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </Button>
            <Button size="icon" variant="primary" aria-label="Create template" onClick={onCreate} disabled={!accountsReady}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        {!accountsReady && <p className="mt-3 rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/10 p-2 text-xs text-[#FDE68A]">Register a WhatsApp phone number in Settings before syncing or creating templates.</p>}
        {notice && <p role="status" className="mt-3 rounded-lg border border-white/10 bg-white/6 p-2 text-xs text-[#CBD5E1]">{notice}</p>}
        <label className="mt-4 flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 text-sm text-[#94A3B8] focus-within:border-[#38BDF8]">
          <Search className="h-4 w-4" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates" className="min-w-0 flex-1 bg-transparent text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]" />
        </label>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickStat label="Total" value={templates.length} />
          <QuickStat label="Approved" value={approved} />
          <QuickStat label="Quality" value={`${Math.round(avg(templates.map((item) => item.quality)))}%`} />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <FilterRow label="Category" value={category} options={categories} onChange={(value) => setCategory(value as TemplateCategory | "All")} />
        <FilterRow label="Status" value={status} options={statuses} onChange={(value) => setStatus(value as TemplateStatus | "All")} />
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <div className="grid gap-3 p-1">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}</div>
        ) : (
          <motion.div layout className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-white/8 bg-white/5 p-4 text-sm text-[#94A3B8]">
                <p className="font-medium text-[#F8FAFC]">No templates loaded</p>
                <p className="mt-1">Sync from Meta after registering your WABA phone number in Settings.</p>
                <Button className="mt-3" variant="secondary" onClick={onSync} disabled={!accountsReady || syncing}>
                  <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />{syncing ? "Syncing" : "Sync Meta"}
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {visible.map((template) => (
                  <TemplateCard key={template.id} template={template} active={template.id === selectedId} onSelect={() => setSelectedId(template.id)} />
                ))}
              </AnimatePresence>
            )}
            {visible.length < filtered.length && (
              <Button variant="ghost" onClick={() => setVisibleCount((count) => count + 8)}>Load more</Button>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
});

export const TemplateCard = memo(function TemplateCard({ template, active, onSelect }: { template: EnterpriseTemplate; active: boolean; onSelect: () => void }) {
  const Icon = template.category === "Authentication" ? ShieldCheck : template.category === "Marketing" ? Sparkles : MessageCircle;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-lg border p-3 text-left transition",
        active ? "border-[#38BDF8]/50 bg-[#38BDF8]/12 shadow-[0_18px_48px_rgb(56_189_248_/_0.16)]" : "border-white/8 bg-white/6 hover:border-white/16 hover:bg-white/9",
      )}
    >
      {active && <motion.span layoutId="template-active-glow" className="absolute inset-y-0 left-0 w-1 bg-[#38BDF8]" />}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#38BDF8]/22 to-[#A78BFA]/20 text-[#38BDF8]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#F8FAFC]">{template.name}</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-[#94A3B8]">
            <span>{template.category}</span><Circle className="h-1.5 w-1.5 fill-current" /><span>{template.updatedAt}</span>
          </span>
          <span className="mt-3 flex items-center justify-between gap-2">
            <StatusBadge status={template.status} />
            <QualityPill value={template.quality} />
          </span>
        </span>
        <MoreHorizontal className="h-4 w-4 text-[#94A3B8] opacity-0 transition group-hover:opacity-100" />
      </div>
    </motion.button>
  );
});

export function TemplateEditor({
  template,
  notice,
  syncing,
  onNotice,
  onPreviewChange,
  onSync,
  onSaved,
  onDeleted,
}: {
  template: EnterpriseTemplate;
  notice: string;
  syncing: boolean;
  onNotice: (notice: string) => void;
  onPreviewChange: (template: EnterpriseTemplate) => void;
  onSync: () => void;
  onSaved: (template: EnterpriseTemplate) => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const rightPanelOpen = useTemplateWorkspaceStore((state) => state.rightPanelOpen);
  const setRightPanelOpen = useTemplateWorkspaceStore((state) => state.setRightPanelOpen);
  const mutation = useMutation({
    mutationFn: saveEnterpriseTemplate,
    onSuccess: (saved) => void onSaved(saved),
    onError: (error) => onNotice(error instanceof Error ? error.message : "Template save failed."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEnterpriseTemplate,
    onSuccess: () => void onDeleted(),
    onError: (error) => onNotice(error instanceof Error ? error.message : "Template delete failed."),
  });
  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(template),
    mode: "onChange",
  });
  const watchedValues = useWatch({ control });
  const values = useMemo<TemplateFormValues>(() => {
    const defaults = toFormValues(template);
    const watchedButtons = watchedValues.buttons ?? defaults.buttons;
    return {
      name: watchedValues.name ?? defaults.name,
      category: watchedValues.category ?? defaults.category,
      language: watchedValues.language ?? defaults.language,
      headerType: watchedValues.headerType ?? defaults.headerType,
      headerText: watchedValues.headerText ?? defaults.headerText,
      mediaUrl: watchedValues.mediaUrl ?? defaults.mediaUrl,
      mediaPreviewUrl: watchedValues.mediaPreviewUrl ?? defaults.mediaPreviewUrl,
      mediaFileName: watchedValues.mediaFileName ?? defaults.mediaFileName,
      mediaMimeType: watchedValues.mediaMimeType ?? defaults.mediaMimeType,
      body: watchedValues.body ?? defaults.body,
      footer: watchedValues.footer ?? defaults.footer,
      buttons: watchedButtons.map((button, index) => ({
        id: button.id ?? defaults.buttons[index]?.id ?? `button-${index}`,
        type: button.type ?? defaults.buttons[index]?.type ?? "quick_reply",
        label: button.label ?? defaults.buttons[index]?.label ?? "Reply",
        value: button.value ?? defaults.buttons[index]?.value ?? "",
      })),
    };
  }, [template, watchedValues]);
  const variables = useMemo(() => extractVariables(values.body), [values.body]);

  useEffect(() => reset(toFormValues(template)), [reset, template]);

  useEffect(() => {
    const url = values.mediaPreviewUrl;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [values.mediaPreviewUrl]);

  useEffect(() => {
    onPreviewChange({
      ...template,
      ...values,
      variables: extractVariables(values.body),
      updatedAt: template.backendId ? "Editing" : "Draft",
    });
  }, [onPreviewChange, template, values]);

  function insertVariable(variable: string) {
    const token = `{{${variable}}}`;
    setValue("body", `${values.body}${values.body.endsWith(" ") ? "" : " "}${token}`, { shouldDirty: true, shouldValidate: true });
  }

  function addButton(type: ButtonType) {
    if (values.buttons.length >= 3) return;
    setValue("buttons", [...values.buttons, { id: crypto.randomUUID(), type, label: type === "url" ? "Open link" : "Reply", value: "" }], { shouldDirty: true, shouldValidate: true });
  }

  function updateButton(index: number, patch: Partial<TemplateButton>) {
    setValue("buttons", values.buttons.map((button, itemIndex) => itemIndex === index ? { ...button, ...patch } : button), { shouldDirty: true, shouldValidate: true });
  }

  function removeButton(index: number) {
    setValue("buttons", values.buttons.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true, shouldValidate: true });
  }

  const onSubmit = handleSubmit((form) => {
    const next: EnterpriseTemplate = { ...template, ...form, variables: extractVariables(form.body), updatedAt: "Just now" };
    mutation.mutate(next);
  });

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0F172A]/88 px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]"><Bot className="h-3.5 w-3.5" /> Meta compliant editor <span>/</span> Live preview</div>
            <h2 className="mt-1 truncate text-lg font-semibold">{values.name || "Untitled template"}</h2>
          </div>
          <Button variant="ghost" onClick={() => setRightPanelOpen(!rightPanelOpen)}><PanelRightClose className="h-4 w-4" />Insights</Button>
          <Button variant="secondary" onClick={onSync} disabled={syncing}><RefreshCw className="h-4 w-4" />{syncing ? "Syncing" : "Sync"}</Button>
          {template.backendId && (
            <Button variant="ghost" onClick={() => deleteMutation.mutate(template)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" />Delete</Button>
          )}
          <Button variant="primary" form="template-editor-form" type="submit" disabled={mutation.isPending}><Send className="h-4 w-4" />{mutation.isPending ? "Saving" : "Submit for review"}</Button>
        </div>
        {notice && <p role="status" className="mt-3 text-sm text-[#94A3B8]">{notice}</p>}
      </header>

      <div className="grid min-h-0 flex-1">
        <form id="template-editor-form" onSubmit={onSubmit} className="scrollbar-thin min-w-0 space-y-4 overflow-y-auto p-5">
          <motion.div layout className="grid gap-4 lg:grid-cols-3">
            <EditorField label="Template name" error={errors.name?.message}>
              <input {...register("name")} className="field-control" />
            </EditorField>
            <EditorField label="Category" icon={<Zap className="h-4 w-4" />}>
              <select {...register("category")} className="field-control">{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select>
            </EditorField>
            <EditorField label="Language" icon={<Languages className="h-4 w-4" />}>
              <select {...register("language")} className="field-control">{languages.map((item) => <option key={item}>{item}</option>)}</select>
            </EditorField>
          </motion.div>

          <Section title="Header" action={<StatusDot label={values.headerType} />}>
            <div className="grid gap-3 md:grid-cols-5">
              {headerTypes.map((type) => <HeaderTypeButton key={type} type={type} active={values.headerType === type} onClick={() => setValue("headerType", type, { shouldDirty: true })} />)}
            </div>
            <AnimatePresence mode="wait">
              {values.headerType === "text" && (
                <motion.div key="text-header" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <EditorField label="Header text" counter={`${values.headerText.length}/60`} error={errors.headerText?.message}>
                    <input {...register("headerText")} className="field-control" placeholder="Short headline" />
                  </EditorField>
                </motion.div>
              )}
              {["image", "video", "document"].includes(values.headerType) && (
                <MediaUploader
                  key="media-header"
                  type={values.headerType}
                  value={values.mediaUrl}
                  fileName={values.mediaFileName}
                  onChange={(media) => {
                    setValue("mediaUrl", media.url, { shouldDirty: true, shouldValidate: true });
                    setValue("mediaPreviewUrl", media.previewUrl, { shouldDirty: true });
                    setValue("mediaFileName", media.fileName, { shouldDirty: true });
                    setValue("mediaMimeType", media.mimeType, { shouldDirty: true });
                  }}
                />
              )}
            </AnimatePresence>
          </Section>

          <Section title="Body" action={<span className="text-xs text-[#94A3B8]">{values.body.length}/1024</span>}>
            <VariableToolbar variables={variables.length ? variables : ["first_name", "order_id", "date"]} onInsert={insertVariable} />
            <textarea {...register("body")} rows={9} className="field-control min-h-56 resize-y leading-7" placeholder="Write your approved WhatsApp template body..." />
            {errors.body?.message && <InlineError message={errors.body.message} />}
          </Section>

          <Section title="Footer">
            <EditorField label="Footer note" counter={`${values.footer.length}/60`} error={errors.footer?.message}>
              <input {...register("footer")} className="field-control" placeholder="Optional footer" />
            </EditorField>
          </Section>

          <CTAButtonBuilder buttons={values.buttons} onAdd={addButton} onUpdate={updateButton} onRemove={removeButton} error={errors.buttons?.message} />
        </form>
      </div>
    </div>
  );
}

export function VariableToolbar({ variables, onInsert }: { variables: string[]; onInsert: (variable: string) => void }) {
  return (
    <div className="sticky top-[88px] z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-[#111827]/92 p-2 backdrop-blur-xl">
      <span className="flex items-center gap-1 px-2 text-xs font-medium text-[#94A3B8]"><Wand2 className="h-3.5 w-3.5" />Variables</span>
      {variables.map((variable) => (
        <button key={variable} type="button" onClick={() => onInsert(variable)} className="rounded-md border border-[#38BDF8]/20 bg-[#38BDF8]/10 px-2 py-1 text-xs text-[#7DD3FC] transition hover:bg-[#38BDF8]/18">
          {`{{${variable}}}`}
        </button>
      ))}
      <button type="button" className="ml-auto rounded-md p-1.5 text-[#94A3B8] transition hover:bg-white/10 hover:text-white" aria-label="Emoji picker">☺</button>
    </div>
  );
}

export function MediaUploader({
  type,
  value,
  fileName,
  onChange,
}: {
  type: HeaderType;
  value: string;
  fileName?: string;
  onChange: (media: { url: string; previewUrl: string; fileName: string; mimeType: string }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const icon = type === "image" ? <ImageIcon className="h-5 w-5" /> : type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />;
  const accept = type === "image" ? "image/*" : type === "video" ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf";
  const handleFile = (file?: File) => {
    if (!file) return;
    onChange({
      url: file.name,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type,
    });
  };

  return (
    <div
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }}
      className={cn("rounded-lg border border-dashed p-5 transition", dragging ? "border-[#38BDF8] bg-[#38BDF8]/10" : "border-white/12 bg-white/5")}
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#38BDF8]/12 text-[#38BDF8]">{icon}</span>
        <div>
          <p className="text-sm font-semibold">Drop {type} asset here</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Optimized for Meta template review</p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 text-sm transition hover:bg-white/12">
          <UploadCloud className="h-4 w-4" /> Upload
          <input type="file" accept={accept} className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        {(fileName || value) && <p className="max-w-full truncate text-xs text-[#22C55E]">{fileName || value}</p>}
      </div>
    </div>
  );
}

export function CTAButtonBuilder({ buttons, onAdd, onUpdate, onRemove, error }: {
  buttons: TemplateButton[];
  onAdd: (type: ButtonType) => void;
  onUpdate: (index: number, patch: Partial<TemplateButton>) => void;
  onRemove: (index: number) => void;
  error?: string;
}) {
  return (
    <Section title="Buttons" action={<span className="text-xs text-[#94A3B8]">{buttons.length}/3</span>}>
      <div className="flex flex-wrap gap-2">
        {buttonTypes.map((item) => (
          <Button key={item.type} type="button" size="sm" variant="secondary" onClick={() => onAdd(item.type)} disabled={buttons.length >= 3}>
            <Plus className="h-3.5 w-3.5" />{item.label}
          </Button>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        {buttons.map((button, index) => (
          <motion.div key={button.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 rounded-lg border border-white/8 bg-white/5 p-3 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_40px]">
            <select value={button.type} onChange={(event) => onUpdate(index, { type: event.target.value as ButtonType })} className="field-control h-10">
              {buttonTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
            </select>
            <input value={button.label} onChange={(event) => onUpdate(index, { label: event.target.value })} className="field-control h-10" placeholder="Button label" />
            <input value={button.value} onChange={(event) => onUpdate(index, { value: event.target.value })} className="field-control h-10" placeholder="URL, phone, payload, coupon" />
            <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(index)} aria-label="Remove button"><Trash2 className="h-4 w-4" /></Button>
          </motion.div>
        ))}
      </div>
      {error && <InlineError message={error} />}
    </Section>
  );
}

export function AnalyticsPanel({ template }: { template: EnterpriseTemplate }) {
  const { previewDevice, previewTheme, setPreviewDevice, setPreviewTheme } = useTemplateWorkspaceStore();
  return (
    <div className="scrollbar-thin flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-l border-white/8">
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#111827]/92 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-[#94A3B8]">Realtime preview</p>
            <h2 className="mt-1 text-base font-semibold">Template health</h2>
          </div>
          <StatusBadge status={template.status} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Segmented value={previewDevice} values={["iphone", "android"]} onChange={(value) => setPreviewDevice(value as PreviewDevice)} />
          <Segmented value={previewTheme} values={["dark", "light"]} onChange={(value) => setPreviewTheme(value as PreviewTheme)} />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <WhatsAppPreview template={template} />
        <TemplateHealthCard template={template} />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Delivered" value={compactNumber(template.insight.delivered)} trend="+12%" />
          <KpiCard label="Usage" value={compactNumber(template.insight.usage)} trend="live" />
          <KpiCard label="Read rate" value={`${template.insight.readRate}%`} trend="+4%" />
          <KpiCard label="Click rate" value={`${template.insight.clickRate}%`} trend="+2%" />
        </div>
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Campaign usage</h3><BarChart3 className="h-4 w-4 text-[#38BDF8]" /></div>
          <AnimatedBars values={[72, 46, 88, 63, 91, 58, 76]} />
        </Card>
        {template.insight.rejectionReasons.length > 0 && (
          <Card className="rounded-lg border-[#FB7185]/30 bg-[#FB7185]/8 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#FDA4AF]"><AlertTriangle className="h-4 w-4" />Rejection reasons</h3>
            <div className="mt-3 grid gap-2">{template.insight.rejectionReasons.map((reason) => <p key={reason} className="text-sm text-[#FECDD3]">{reason}</p>)}</div>
          </Card>
        )}
        <Card className="rounded-lg p-4">
          <h3 className="text-sm font-semibold">Template history</h3>
          <div className="mt-4 grid gap-4">
            {template.history.map((item) => (
              <div key={item.id} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3">
                <span className="mt-1 h-3 w-3 rounded-full border border-[#38BDF8] bg-[#38BDF8]/25" />
                <span>
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-1 block text-xs text-[#94A3B8]">{item.detail} · {item.at}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function WhatsAppPreview({ template }: { template: EnterpriseTemplate }) {
  const { previewDevice, previewTheme } = useTemplateWorkspaceStore();
  return (
    <motion.div layout className="mx-auto max-w-[350px]">
      <div className={cn("rounded-[34px] border p-2 shadow-2xl", previewDevice === "iphone" ? "border-white/16" : "rounded-[26px] border-white/10", previewTheme === "dark" ? "bg-black" : "bg-slate-200")}>
        <div className={cn("overflow-hidden rounded-[26px]", previewDevice === "android" && "rounded-[18px]")}>
          <div className={cn("flex items-center gap-3 px-4 py-3", previewTheme === "dark" ? "bg-[#075E54] text-white" : "bg-[#128C7E] text-white")}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><MessageCircle className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">Northstar Business</span>
              <span className="flex items-center gap-1 text-[11px] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />online</span>
            </span>
            <Phone className="h-4 w-4" />
          </div>
          <RealtimePreviewRenderer template={template} theme={previewTheme} />
        </div>
      </div>
    </motion.div>
  );
}

export function RealtimePreviewRenderer({ template, theme }: { template: EnterpriseTemplate; theme: PreviewTheme }) {
  const renderedBody = renderVariables(template.body);
  return (
    <div className={cn("min-h-[520px] p-3", theme === "dark" ? "bg-[#0B141A]" : "bg-[#E7DDD3]")}>
      <div className="mb-3 flex justify-center"><span className="rounded-full bg-black/20 px-2 py-1 text-[10px] text-white/80">Today</span></div>
      <AnimatePresence mode="wait">
        <motion.div key={template.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className={cn("ml-auto max-w-[86%] overflow-hidden rounded-lg rounded-tr-sm shadow-lg", theme === "dark" ? "bg-[#005C4B] text-white" : "bg-[#DCF8C6] text-slate-950")}>
          {template.headerType === "text" && template.headerText && <div className="border-b border-black/10 px-3 pt-3 text-sm font-semibold">{renderVariables(template.headerText)}</div>}
          {["image", "video", "document"].includes(template.headerType) && <MediaPreview template={template} />}
          <div className="whitespace-pre-wrap px-3 py-3 text-[13px] leading-5">{renderedBody}</div>
          {template.footer && <div className="px-3 pb-2 text-[11px] opacity-70">{renderVariables(template.footer)}</div>}
          <div className="flex justify-end gap-1 px-3 pb-2 text-[10px] opacity-70">10:42 <Check className="h-3 w-3" /><Check className="-ml-2 h-3 w-3 text-[#53BDEB]" /></div>
          {template.buttons.length > 0 && <div className="border-t border-black/10">{template.buttons.map((button) => <PreviewButton key={button.id} button={button} />)}</div>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex w-16 items-center gap-1 rounded-full bg-white/12 px-3 py-2">
        {[0, 1, 2].map((item) => <span key={item} className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" style={{ animation: `pulse-typing 1.2s ${item * 120}ms infinite` }} />)}
      </div>
    </div>
  );
}

export function TemplateHealthCard({ template }: { template: EnterpriseTemplate }) {
  return (
    <Card className="rounded-lg p-4">
      <div className="flex items-center gap-4">
        <CircularProgress value={template.insight.quality} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Quality score</h3>
          <p className="mt-1 text-xs text-[#94A3B8]">Realtime delivery, report, and review signals</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><motion.div initial={{ width: 0 }} animate={{ width: `${template.insight.quality}%` }} className="h-full rounded-full bg-[#22C55E]" /></div>
        </div>
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: TemplateStatus }) {
  const styles: Record<TemplateStatus, string> = {
    Approved: "border-[#22C55E]/25 bg-[#22C55E]/12 text-[#86EFAC]",
    Pending: "border-[#38BDF8]/25 bg-[#38BDF8]/12 text-[#7DD3FC]",
    Rejected: "border-[#FB7185]/25 bg-[#FB7185]/12 text-[#FDA4AF]",
    Draft: "border-white/12 bg-white/8 text-[#CBD5E1]",
    Paused: "border-[#A78BFA]/25 bg-[#A78BFA]/12 text-[#C4B5FD]",
  };
  return <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium", styles[status])}>{status}</span>;
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section layout className="rounded-lg border border-white/8 bg-[#1E293B]/72 p-4 shadow-[0_20px_70px_rgb(0_0_0_/_0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function EditorField({ label, icon, counter, error, children }: { label: string; icon?: React.ReactNode; counter?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="flex items-center justify-between gap-2 text-[#CBD5E1]"><span className="flex items-center gap-2">{icon}{label}</span>{counter && <span className="text-xs text-[#94A3B8]">{counter}</span>}</span>
      {children}
      {error && <InlineError message={error} />}
    </label>
  );
}

function HeaderTypeButton({ type, active, onClick }: { type: HeaderType; active: boolean; onClick: () => void }) {
  const icon = type === "image" ? ImageIcon : type === "video" ? Video : type === "document" ? FileText : type === "text" ? FileText : X;
  const Icon = icon;
  return (
    <button type="button" onClick={onClick} className={cn("flex h-20 flex-col items-center justify-center gap-2 rounded-lg border text-sm capitalize transition", active ? "border-[#38BDF8]/50 bg-[#38BDF8]/12 text-[#7DD3FC]" : "border-white/8 bg-white/5 text-[#94A3B8] hover:bg-white/9")}>
      <Icon className="h-5 w-5" />{type}
    </button>
  );
}

function FilterRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-[#94A3B8]">
      {label}
      <span className="relative">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-white/7 px-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#38BDF8]">
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#94A3B8]" />
      </span>
    </label>
  );
}

function QuickStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/8 bg-white/6 p-2"><p className="text-[10px] uppercase text-[#94A3B8]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function QualityPill({ value }: { value: number }) {
  return <span className={cn("rounded-md px-2 py-1 text-xs font-medium", value >= 85 ? "bg-[#22C55E]/12 text-[#86EFAC]" : value >= 65 ? "bg-[#FBBF24]/12 text-[#FDE68A]" : "bg-[#FB7185]/12 text-[#FDA4AF]")}>{value}% quality</span>;
}

function StatusDot({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-2 text-xs capitalize text-[#94A3B8]"><span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_18px_rgb(34_197_94_/_0.8)]" />{label}</span>;
}

function InlineError({ message }: { message: string }) {
  return <p className="flex items-center gap-1.5 text-xs text-[#FDA4AF]"><AlertTriangle className="h-3.5 w-3.5" />{message}</p>;
}

function KpiCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return <Card className="rounded-lg p-3"><p className="text-xs text-[#94A3B8]">{label}</p><div className="mt-2 flex items-end justify-between"><b className="text-lg">{value}</b><span className="text-xs text-[#22C55E]">{trend}</span></div></Card>;
}

function Segmented({ value, values, onChange }: { value: string; values: string[]; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-2 rounded-lg border border-white/8 bg-white/5 p-1">{values.map((item) => <button key={item} onClick={() => onChange(item)} className={cn("h-8 rounded-md text-xs capitalize transition", value === item ? "bg-white text-slate-950" : "text-[#94A3B8] hover:text-white")}>{item}</button>)}</div>;
}

function CircularProgress({ value }: { value: number }) {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,.08)" strokeWidth="8" fill="none" />
        <motion.circle cx="40" cy="40" r="32" stroke="#22C55E" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={201} initial={{ strokeDashoffset: 201 }} animate={{ strokeDashoffset: 201 - (201 * value) / 100 }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold">{value}%</span>
    </div>
  );
}

function AnimatedBars({ values }: { values: number[] }) {
  return <div className="mt-4 flex h-28 items-end gap-2">{values.map((value, index) => <motion.span key={index} initial={{ height: 0 }} animate={{ height: `${value}%` }} transition={{ delay: index * 0.04 }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#38BDF8] to-[#A78BFA]" />)}</div>;
}

function MediaPreview({ template }: { template: EnterpriseTemplate }) {
  const { headerType, mediaPreviewUrl, mediaFileName, mediaMimeType, mediaUrl } = template;
  const Icon = headerType === "image" ? ImageIcon : headerType === "video" ? Video : FileText;
  const label = mediaFileName || mediaUrl || `${headerType} header`;

  if (headerType === "image" && mediaPreviewUrl) {
    return (
      <figure className="m-2 overflow-hidden rounded-md bg-black/20">
        <div
          role="img"
          aria-label={label}
          className="h-40 w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${mediaPreviewUrl}")` }}
        />
      </figure>
    );
  }

  if (headerType === "video" && mediaPreviewUrl) {
    return (
      <div className="m-2 overflow-hidden rounded-md bg-black">
        <video src={mediaPreviewUrl} controls muted playsInline className="h-40 w-full object-cover" />
      </div>
    );
  }

  if (headerType === "document") {
    return (
      <div className="m-2 rounded-md border border-black/10 bg-white/12 p-3">
        {mediaPreviewUrl && mediaMimeType === "application/pdf" ? (
          <iframe src={mediaPreviewUrl} title={label} className="h-40 w-full rounded bg-white" />
        ) : (
          <div className="flex h-32 items-center gap-3 rounded bg-black/10 px-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-[#38BDF8]/20 text-[#7DD3FC]"><FileText className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs opacity-70">{mediaMimeType || "Document preview"}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  return <div className="m-2 grid h-32 place-items-center rounded-md bg-gradient-to-br from-[#38BDF8]/25 via-[#22C55E]/15 to-[#A78BFA]/25"><Icon className="h-8 w-8 opacity-80" /></div>;
}

function PreviewButton({ button }: { button: TemplateButton }) {
  const Icon = button.type === "url" ? Link2 : button.type === "phone" ? Phone : button.type === "coupon" ? Copy : Clipboard;
  return <button className="flex h-10 w-full items-center justify-center gap-2 text-[13px] font-medium text-[#53BDEB]"><Icon className="h-3.5 w-3.5" />{button.label}</button>;
}

function EditorSkeleton() {
  return <div className="grid gap-4 p-5"><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-72 rounded-lg" /><Skeleton className="h-52 rounded-lg" /></div>;
}

function RightPanelSkeleton() {
  return <div className="grid gap-4 p-4"><Skeleton className="h-96 rounded-[34px]" /><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-40 rounded-lg" /></div>;
}

function toFormValues(template: EnterpriseTemplate): TemplateFormValues {
  return {
    name: template.name,
    category: template.category,
    language: template.language,
    headerType: template.headerType,
    headerText: template.headerText,
    mediaUrl: template.mediaUrl,
    mediaPreviewUrl: template.mediaPreviewUrl,
    mediaFileName: template.mediaFileName,
    mediaMimeType: template.mediaMimeType,
    body: template.body,
    footer: template.footer,
    buttons: template.buttons,
  };
}

function extractVariables(value: string) {
  return Array.from(value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map((match) => match[1]).filter((item, index, all) => all.indexOf(item) === index);
}

function renderVariables(value: string) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => sampleVariables[key] ?? key);
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function compactNumber(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
