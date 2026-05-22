# WA Command Frontend

Next.js App Router, TypeScript, and Tailwind operations UI for the WA Command backend.

## Structure

- `app/(workspace)/` contains dashboard, inbox, templates, analytics, campaigns, and settings routes in the shared SaaS shell.
- `app/login/` contains the authentication entry surface.
- `components/app-shell.tsx` owns responsive navigation, workspace search, dark-mode control, and route shortcuts.
- `components/ui/` contains local shadcn-style primitives used by feature components.
- `components/inbox-workspace.tsx` contains the backend-aware realtime inbox surface and virtualized conversation list.
- `components/workspace-panels.tsx` contains shared metric, status, header, skeleton, and empty-state patterns.
- `lib/inbox-api.ts` wraps durable REST pagination and mutations.
- `lib/inbox-realtime.ts` connects STOMP WebSocket updates for the active tenant.
- `lib/inbox-types.ts` is the UI contract for conversations, messages, and realtime events.
- `app/flows` and `components/workflow-builder.tsx` provide React Flow workflow authoring.

## Runtime

Set values from `.env.example`, open `/login`, then sign in or create the first tenant admin. Access and refresh tokens
are stored in a local browser session for this standalone frontend and are refreshed by the shared API client before REST
retries. `NEXT_PUBLIC_ACCESS_TOKEN`, `NEXT_PUBLIC_TENANT_ID`, and `NEXT_PUBLIC_AGENT_ID` remain optional development
overrides for direct API debugging.

The UI keeps REST as the durable source for filters, unread counts, and paginated conversation/message history. WebSocket
events update loaded state for incoming messages, status changes, assignment changes, unread changes, and typing. The inbox
uses optimistic outbound messages and a fixed-row windowed conversation list to keep high-volume queues responsive.

Template creation and Meta sync require a WhatsApp phone number registered in Settings plus configured backend Meta
credentials. Campaigns require an approved template. Inbox realtime requires backend Redis Pub/Sub and WebSocket support;
campaign queueing requires RabbitMQ.

The workspace supports responsive navigation, persisted light/dark mode, reduced-motion browser preferences, focus-visible
keyboard access, `Ctrl K` workspace search focus, `G I` inbox routing, `G D` dashboard routing, and `?` shortcut help.

`/flows` authors visual workflow graphs with draggable trigger, condition, delay, webhook, WhatsApp text, and future AI
placeholder nodes. The builder saves draft JSON, publishes immutable versions, and shows recent execution analytics and
history from the backend workflow APIs.
