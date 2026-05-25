"use client";

import {
  ArrowDown,
  CheckCheck,
  ChevronLeft,
  FileText,
  ImageIcon,
  LoaderCircle,
  MessageSquareOff,
  Paperclip,
  Search,
  Send,
  SlidersHorizontal,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, Surface } from "@/components/ui/surface";
import {
  assignConversation,
  loadConversations,
  loadMediaPreview,
  loadMessages,
  markRead,
  publishTyping,
  sendMessage,
} from "@/lib/inbox-api";
import { connectInboxRealtime } from "@/lib/inbox-realtime";
import type { Conversation, ConversationFilter, InboxEvent, InboxMessage } from "@/lib/inbox-types";
import { clock, cn, weekday } from "@/lib/utils";
import { currentUserId } from "@/lib/api-client";

const filters: ConversationFilter[] = ["ALL", "UNREAD", "ASSIGNED_TO_ME", "UNASSIGNED"];

export function InboxWorkspace() {
  const configuredAgentId = currentUserId();
  const [filter, setFilter] = useState<ConversationFilter>("ALL");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationPage, setConversationPage] = useState(0);
  const [conversationHasMore, setConversationHasMore] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [messagePage, setMessagePage] = useState(0);
  const [messageHasMore, setMessageHasMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingActors, setTypingActors] = useState<Record<number, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const listSentinel = useRef<HTMLDivElement>(null);
  const messageSentinel = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const loadConversationPage = useCallback(async () => {
    if (loadingConversations) return;
    setLoadingConversations(true);
    try {
      const page = await loadConversations(filter, query, conversationPage);
      setConversations((items) => mergeConversations(items, page.items));
      setSelectedId((id) => id ?? page.items[0]?.id ?? null);
      setConversationPage(page.nextPage);
      setConversationHasMore(page.hasMore);
    } catch {
      setError("Conversation list could not load.");
    } finally {
      setLoadingConversations(false);
    }
  }, [conversationPage, filter, loadingConversations, query]);

  useEffect(() => {
    if (conversationPage !== 0 || !conversationHasMore || loadingConversations) return;
    void loadConversationPage();
  }, [conversationHasMore, conversationPage, loadConversationPage, loadingConversations]);

  useEffect(() => {
    if (!conversationHasMore || loadingConversations || conversations.length === 0) return;
    const observer = observe(listSentinel.current, () => void loadConversationPage());
    return () => observer?.disconnect();
  }, [conversationHasMore, conversations.length, loadConversationPage, loadingConversations]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMessages([]);
      setMessagePage(0);
      setMessageHasMore(Boolean(selectedId));
      if (selectedId) void markRead(selectedId).then(updateConversation).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !messageHasMore || loadingMessages) return;
    const observer = observe(messageSentinel.current, () => {
      setLoadingMessages(true);
      loadMessages(selectedId, messagePage)
        .then((page) => {
          setMessages((items) => mergeMessages(page.items, items));
          setMessagePage(page.nextPage);
          setMessageHasMore(page.hasMore);
        })
        .catch(() => setError("Message history could not load."))
        .finally(() => setLoadingMessages(false));
    });
    return () => observer?.disconnect();
  }, [loadingMessages, messageHasMore, messagePage, selectedId]);

  useEffect(() => connectInboxRealtime((event: InboxEvent) => {
    if (event.conversation) {
      setConversations((items) => mergeConversations(items.filter((item) => item.id !== event.conversation?.id), [event.conversation as Conversation]));
    }
    if (event.message) {
      setMessages((items) => event.conversationId === selectedId ? reconcileMessage(items, event.message as InboxMessage) : items);
    }
    if (event.type === "TYPING_CHANGED" && event.actorId && event.actorId !== configuredAgentId) {
      setTypingActors((actors) => ({
        ...actors,
        [event.conversationId]: event.typing
          ? unique([...(actors[event.conversationId] ?? []), event.actorId as number])
          : (actors[event.conversationId] ?? []).filter((id) => id !== event.actorId),
      }));
    }
  }), [configuredAgentId, selectedId]);

  function updateConversation(conversation: Conversation) {
    setConversations((items) => mergeConversations(items.filter((item) => item.id !== conversation.id), [conversation]));
  }

  function changeFilter(next: ConversationFilter) {
    setFilter(next);
    resetConversationSearch();
  }

  function changeQuery(next: string) {
    setQuery(next);
    resetConversationSearch();
  }

  function resetConversationSearch() {
    setConversations([]);
    setConversationPage(0);
    setConversationHasMore(true);
    setSelectedId(null);
  }

  async function submit() {
    if (!selected || !draft.trim()) return;
    const body = draft.trim();
    const clientMessageId = crypto.randomUUID();
    const optimistic: InboxMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId: selected.id,
      metaMessageId: null,
      direction: "OUTBOUND",
      type: "TEXT",
      body,
      status: "QUEUED",
      mediaMimeType: null,
      mediaUrl: null,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setDraft("");
    setMessages((items) => [...items, optimistic]);
    try {
      const saved = await sendMessage(selected.id, body, clientMessageId);
      setMessages((items) => reconcileMessage(items, saved));
      await publishTyping(selected.id, false);
    } catch {
      setMessages((items) => items.map((item) => item.id === optimistic.id ? { ...item, status: "FAILED" } : item));
    }
  }

  function updateTyping(value: string) {
    setDraft(value);
    if (!selected) return;
    void publishTyping(selected.id, Boolean(value.trim())).catch(() => undefined);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => void publishTyping(selected.id, false), 1600);
  }

  async function claimConversation() {
    if (!selected || !configuredAgentId) {
      setError("Configure NEXT_PUBLIC_AGENT_ID before claiming a conversation.");
      return;
    }
    try {
      updateConversation(await assignConversation(selected.id, configuredAgentId));
    } catch {
      setError("Assignment needs an authorized tenant admin session.");
    }
  }

  return (
    <main className="grid h-[calc(100dvh-4.5rem)] min-h-[680px] min-w-0 bg-[var(--canvas)] lg:grid-cols-[336px_minmax(0,1fr)_282px]">
      <aside className={cn("grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] border-r border-[var(--line)] bg-[var(--panel)]", selected && "hidden lg:grid")}>
        <header className="border-b border-[var(--line)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Inbox</h1>
              <p className="text-sm text-[var(--muted)]">Realtime conversations</p>
            </div>
            <Badge>{conversations.reduce((total, item) => total + item.unreadCount, 0)} unread</Badge>
          </div>
          <label className="mt-4 flex h-11 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <input aria-label="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Name or phone number" value={query} onChange={(event) => changeQuery(event.target.value)} />
            <SlidersHorizontal className="h-4 w-4 text-[var(--muted)]" />
          </label>
        </header>
        <nav aria-label="Inbox filters" className="flex gap-1 overflow-x-auto border-b border-[var(--line)] px-3 py-2">
          {filters.map((item) => (
            <button key={item} aria-pressed={item === filter} onClick={() => changeFilter(item)}
              className={cn("h-8 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition", item === filter ? "bg-[var(--accent)] text-white" : "bg-[var(--panel-strong)] text-[var(--muted)] hover:text-[var(--ink)]")}>
              {item.replaceAll("_", " ")}
            </button>
          ))}
        </nav>
        {loadingConversations && conversations.length === 0 ? <ConversationSkeletons /> : (
          <VirtualConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} sentinel={listSentinel} loading={loadingConversations} />
        )}
      </aside>
      <section className={cn("grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]", !selected && "hidden lg:grid")}>
        <ChatHeader conversation={selected} onClaim={claimConversation} onBack={() => setSelectedId(null)} />
        <div className="chat-grid scrollbar-thin min-h-0 overflow-y-auto px-3 py-4 sm:px-7">
          <div ref={messageSentinel} className="grid h-9 place-items-center text-[var(--muted)]">
            {loadingMessages && <ArrowDown className="h-4 w-4 animate-bounce" />}
          </div>
          {!selected ? <NoConversation /> : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
              {messages.length === 0 && loadingMessages && <MessageSkeletons />}
              {messages.length === 0 && !loadingMessages && <NoMessages />}
              {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
              {(typingActors[selected.id]?.length ?? 0) > 0 && <TypingBubble />}
            </div>
          )}
        </div>
        <footer className="border-t border-[var(--line)] bg-[var(--panel)] px-3 py-3 sm:px-7">
          <div className="mx-auto flex max-w-4xl items-end gap-2">
            <Button aria-label="Attach media" title="Attach media" className="h-12 w-12 px-0" disabled={!selected}><Paperclip className="h-4 w-4" /></Button>
            <textarea className="min-h-12 max-h-36 flex-1 resize-y rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)]"
              disabled={!selected} value={draft} onChange={(event) => updateTyping(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && (event.preventDefault(), void submit())}
              placeholder={selected ? "Reply to this customer" : "Select a conversation"} />
            <Button aria-label="Send message" title="Send" variant="primary" disabled={!selected || !draft.trim()} onClick={() => void submit()} className="h-12 w-12 px-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {error && <p role="status" className="mx-auto mt-2 max-w-4xl text-sm text-[var(--danger)]">{error}</p>}
        </footer>
      </section>
      <ConversationRail conversation={selected} />
    </main>
  );
}

function VirtualConversationList({
  conversations,
  selectedId,
  onSelect,
  sentinel,
  loading,
}: {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  sentinel: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
}) {
  const rowHeight = 84;
  const overscan = 5;
  const viewport = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(520);

  useEffect(() => {
    if (!viewport.current) return;
    const resize = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    resize.observe(viewport.current);
    return () => resize.disconnect();
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(conversations.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);

  return (
    <section ref={viewport} aria-label="Virtualized conversations" className="scrollbar-thin relative min-h-0 overflow-y-auto"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      {conversations.length === 0 ? <EmptyConversationList /> : (
        <div style={{ height: `${conversations.length * rowHeight + 64}px` }} className="relative">
          <div className="absolute inset-x-0" style={{ transform: `translateY(${start * rowHeight}px)` }}>
            {conversations.slice(start, end).map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} selected={selectedId === conversation.id} onSelect={onSelect} />
            ))}
          </div>
          <div ref={sentinel} className="absolute inset-x-0 bottom-0 grid h-14 place-items-center text-[var(--muted)]">
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      )}
    </section>
  );
}

function ConversationRow({ conversation, selected, onSelect }: { conversation: Conversation; selected: boolean; onSelect: (id: number) => void }) {
  return (
    <button onClick={() => onSelect(conversation.id)}
      className={cn("grid h-[84px] w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line)] px-4 text-left transition", selected ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--panel-strong)]")}>
      <span aria-hidden className="grid h-10 w-10 place-items-center rounded-md bg-[var(--panel-strong)] text-sm font-semibold text-[var(--accent-strong)]">
        {(conversation.contactName ?? conversation.contactPhone).slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{conversation.contactName ?? conversation.contactPhone}</span>
        <span className="mt-1 block truncate text-sm text-[var(--muted)]">{conversation.lastMessagePreview || "New WhatsApp conversation"}</span>
      </span>
      <span className="flex flex-col items-end gap-2 text-xs text-[var(--muted)]">
        <time dateTime={conversation.lastMessageAt}>{clock(conversation.lastMessageAt)}</time>
        {conversation.unreadCount > 0 && <b className="grid h-5 min-w-5 place-items-center rounded-md bg-[var(--accent)] px-1 text-white">{conversation.unreadCount}</b>}
      </span>
    </button>
  );
}

function ChatHeader({ conversation, onClaim, onBack }: { conversation: Conversation | null; onClaim: () => void; onBack: () => void }) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-3 sm:px-7">
      <div className="flex min-w-0 items-center gap-2">
        <Button aria-label="Back to conversations" variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={onBack}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{conversation?.contactName ?? conversation?.contactPhone ?? "Select a conversation"}</h2>
          {conversation && <p className="truncate text-sm text-[var(--muted)]">{conversation.contactPhone} via {conversation.phoneNumberId}</p>}
        </div>
      </div>
      {conversation && <Button onClick={onClaim}><UserRoundCheck className="h-4 w-4" />{conversation.assignedAgentId ? `Agent ${conversation.assignedAgentId}` : "Claim"}</Button>}
    </header>
  );
}

function ConversationRail({ conversation }: { conversation: Conversation | null }) {
  return (
    <aside className="hidden min-h-0 border-l border-[var(--line)] bg-[var(--panel)] p-4 lg:block">
      <h2 className="text-sm font-semibold">Customer context</h2>
      {!conversation ? <p className="mt-3 text-sm text-[var(--muted)]">Select a chat to review assignment and channel details.</p> : (
        <div className="mt-4 grid gap-3">
          <Surface className="shadow-none p-4">
            <span className="block text-sm text-[var(--muted)]">Contact</span>
            <b className="mt-1 block truncate">{conversation.contactName ?? conversation.contactPhone}</b>
            <span className="mt-1 block truncate text-sm text-[var(--muted)]">{conversation.contactPhone}</span>
          </Surface>
          <RailFact label="Last activity" value={weekday(conversation.lastMessageAt)} />
          <RailFact label="Unread" value={String(conversation.unreadCount)} />
          <RailFact label="Assignment" value={conversation.assignedAgentId ? `Agent ${conversation.assignedAgentId}` : "Unassigned"} />
        </div>
      )}
    </aside>
  );
}

function RailFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3"><span className="block text-xs text-[var(--muted)]">{label}</span><b className="mt-1 block truncate text-sm">{value}</b></div>;
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const outbound = message.direction === "OUTBOUND";
  return (
    <article className={cn("enter max-w-[min(84%,640px)] rounded-lg border px-3 py-2 shadow-sm", outbound ? "ml-auto border-emerald-500/25 bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--panel)]")}>
      {message.type !== "TEXT" && <MediaPreview message={message} />}
      {message.body && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>}
      <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[var(--muted)]">
        <time dateTime={message.createdAt}>{clock(message.createdAt)}</time>
        {outbound && <CheckCheck className={cn("h-3.5 w-3.5", message.status === "READ" && "text-[var(--accent)]")} />}
        {message.optimistic && <span>sending</span>}
        {message.status === "FAILED" && <span className="text-[var(--danger)]">failed</span>}
      </div>
    </article>
  );
}

function MediaPreview({ message }: { message: InboxMessage }) {
  const image = message.mediaMimeType?.startsWith("image/");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!image || !message.mediaUrl) return;
    let url: string | null = null;
    void loadMediaPreview(message.mediaUrl).then((value) => {
      url = value;
      setPreview(value);
    }).catch(() => undefined);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image, message.mediaUrl]);
  return (
    <div className="mb-2 flex min-h-24 items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-3">
      {preview ? <Image alt="" src={preview} width={96} height={96} unoptimized className="h-24 w-24 rounded-md object-cover" /> :
        image ? <ImageIcon className="h-7 w-7 text-[var(--accent)]" /> : <FileText className="h-7 w-7 text-indigo-400" />}
      <div className="min-w-0 text-sm">
        <p className="font-medium">{message.type.toLowerCase()} attachment</p>
        <p className="truncate text-[var(--muted)]">{message.mediaMimeType ?? "Preview pending"}</p>
      </div>
    </div>
  );
}

function TypingBubble() {
  return <div aria-label="Customer is typing" className="flex w-16 gap-1 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-3">{[0, 1, 2].map((index) => <span key={index} className="h-2 w-2 rounded-full bg-[var(--accent)]" style={{ animation: `pulse-typing 1s ${index * 120}ms infinite` }} />)}</div>;
}

function ConversationSkeletons() {
  return <div className="grid gap-3 p-4">{Array.from({ length: 7 }, (_, index) => <div key={index} className="flex gap-3"><Skeleton className="h-10 w-10 shrink-0" /><div className="flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-full" /></div></div>)}</div>;
}

function MessageSkeletons() {
  return <div className="grid gap-3">{[60, 42, 72].map((width, index) => <Skeleton key={width} className={cn("h-16", index === 1 ? "ml-auto" : "")} style={{ width: `${width}%` }} />)}</div>;
}

function EmptyConversationList() {
  return <div className="grid h-full min-h-72 place-items-center p-5 text-center"><div><MessageSquareOff className="mx-auto h-7 w-7 text-[var(--muted)]" /><p className="mt-3 text-sm font-medium">No conversations found</p><p className="mt-1 text-sm text-[var(--muted)]">Try another filter or wait for webhook traffic.</p></div></div>;
}

function NoConversation() {
  return <div className="mx-auto grid h-full max-w-md place-items-center text-center"><div><MessageSquareOff className="mx-auto h-9 w-9 text-[var(--muted)]" /><h2 className="mt-3 text-lg font-semibold">Pick a customer chat</h2><p className="mt-1 text-sm text-[var(--muted)]">Replies, statuses, assignment, media previews, and typing updates appear here.</p></div></div>;
}

function NoMessages() {
  return <div className="mx-auto my-10 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">This conversation has no loaded messages yet.</div>;
}

function mergeConversations(existing: Conversation[], incoming: Conversation[]) {
  const map = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => map.set(item.id, item));
  return [...map.values()].sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
}

function mergeMessages(first: InboxMessage[], second: InboxMessage[]) {
  return reconcileMany([...first, ...second]);
}

function reconcileMessage(items: InboxMessage[], message: InboxMessage) {
  return reconcileMany(items.map((item) => item.clientMessageId && item.clientMessageId === message.clientMessageId ? message : item)
    .concat(items.some((item) => item.id === message.id || item.clientMessageId === message.clientMessageId) ? [] : [message]));
}

function reconcileMany(items: InboxMessage[]) {
  const map = new Map(items.map((item) => [String(item.id), item]));
  return [...map.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

function observe(target: Element | null, onVisible: () => void) {
  if (!target) return null;
  const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onVisible(), { rootMargin: "180px" });
  observer.observe(target);
  return observer;
}

function unique(values: number[]) {
  return [...new Set(values)];
}
