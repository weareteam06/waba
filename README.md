# WA Command

`wa_command` is a multi-tenant WhatsApp SaaS workspace for tenant onboarding, WhatsApp Cloud API operations, realtime
agent inbox work, template management, campaigns, analytics, and automation workflows.

The repository contains:

```text
wa_command/
|-- backend/     Java 17 Spring Boot modular monolith
`-- frontend/    Next.js App Router operations UI
```

## Status

The current application includes:

- Tenant registration, login, JWT access tokens, refresh-token rotation, and role-based access control.
- Tenant-scoped WhatsApp account registration, message storage, Cloud API send/webhook handling, media support, and retries.
- Realtime inbox REST APIs, STOMP WebSocket updates, Redis Pub/Sub fanout, typing, unread state, assignment, and media preview.
- WhatsApp template CRUD, Meta template sync, template analytics snapshots, and bulk campaign scheduling.
- Automation workflow authoring, publish/version history, triggers, execution history, and processor-based nodes.
- Frontend pages for login, dashboard, inbox, templates, analytics, campaigns, settings, and workflow flows.

## Stack

Backend:

- Java 17
- Spring Boot 3
- Spring Security and JWT
- MySQL
- Redis
- RabbitMQ
- Flyway
- Maven
- Docker Compose

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local reusable UI primitives
- STOMP WebSocket client
- React Flow workflow authoring

## Tenancy

A tenant is one customer/company workspace inside the shared SaaS system. Users, WhatsApp phone numbers, inbox data,
templates, campaigns, workflow data, and audit records are tenant scoped.

On login, the backend issues a JWT containing the verified user and `tenant_id`. Backend services derive tenant context
from that verified token and query tenant-owned data by tenant id. The frontend does not choose tenant ownership for API
requests.

## Services

Local development expects:

| Service | Purpose |
| --- | --- |
| MySQL | Durable tenant, identity, inbox, template, campaign, workflow, and audit data |
| Redis | Spring cache and realtime inbox Pub/Sub |
| RabbitMQ | Async WhatsApp jobs, webhook work, campaign send jobs, and retries |
| Backend API | Versioned REST APIs, Swagger, WebSocket endpoint |
| Frontend UI | Browser workspace |

Meta-dependent features also require WhatsApp Cloud API credentials on the backend:

- `META_WHATSAPP_ACCESS_TOKEN`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`

## Quick Start

1. Start infrastructure from the backend folder:

```powershell
cd backend
docker compose up redis rabbitmq -d
```

The current local app also needs a running MySQL database matching `DB_URL` in backend configuration. The backend
defaults to `jdbc:mysql://localhost:3308/wa_command`.

2. Start the backend:

```powershell
mvn spring-boot:run
```

3. Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

4. Open the login page:

```text
http://localhost:3000/login
```

For the first workspace, use **Create tenant**. Later logins use:

- Tenant slug
- Work email
- Password

After login:

1. Open Settings and register the WhatsApp phone number id and WABA id.
2. Configure backend Meta credentials before using Meta sync/send/webhook features.
3. Use Templates, Campaigns, Inbox, Analytics, and Flows from the workspace navigation.

## Runtime Notes

- Local backend frontend origins default to `http://localhost:3000` and `http://127.0.0.1:3000`.
- `JWT_SECRET` must contain at least 32 bytes outside local development.
- Flyway migration scripts stay in the backend, but runtime migration is disabled by default for already-provisioned schemas.
- Hibernate defaults to `ddl-auto: none`, so the backend does not create/update tables at startup.
- Redis is required by the current realtime inbox/cache runtime.
- RabbitMQ is required for async campaign/message/webhook job flows.

## Documentation

Read the focused docs for module details:

- Backend architecture, APIs, schema management, Cloud API, templates, inbox, and automation:
  [`backend/README.md`](backend/README.md)
- Frontend structure, session model, routes, and UI runtime:
  [`frontend/README.md`](frontend/README.md)

Swagger is available from a running backend at:

```text
http://localhost:8080/swagger-ui.html
```

## Documentation Maintenance

Documentation is part of the definition of done for this repository.

When a change affects architecture, setup, environment variables, routes, API behavior, database/runtime dependencies,
feature status, login flow, or operational behavior:

1. Update this root README when the project-level story changes.
2. Update `backend/README.md` for backend contracts, configuration, migrations, infrastructure, or module behavior.
3. Update `frontend/README.md` for frontend routes, session behavior, UI architecture, or browser runtime changes.
4. Keep README updates in the same change as the code change so the docs do not drift.

## Verification

Backend:

```powershell
cd backend
mvn test
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```
