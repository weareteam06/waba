# WA Command Backend

Java 17 and Spring Boot 3 modular monolith for a multi-tenant WhatsApp SaaS command API.

## Architecture

The deployable unit is one Spring Boot application. Packages are module boundaries:

```text
backend/
|-- Dockerfile
|-- docker-compose.yml
|-- pom.xml
`-- src/main/
    |-- java/com/whatsaas/
    |   |-- common/
    |   |   |-- api/                 global response wrapper
    |   |   |-- audit/               audit entities and service
    |   |   |-- config/              OpenAPI, Redis, RabbitMQ
    |   |   |-- exception/           centralized API exceptions
    |   |   |-- security/            JWT and Spring Security
    |   |   `-- tenant/              request tenant context
    |   |-- identity/
    |   |   |-- application/         auth and user use cases plus DTOs
    |   |   |-- domain/              users, roles, refresh tokens
    |   |   |-- infrastructure/      repositories
    |   |   `-- web/                 versioned controllers
    |   |-- tenant/
    |   |   |-- application/         tenant provisioning plus DTOs
    |   |   |-- domain/              tenant aggregate
    |   |   |-- infrastructure/      tenant repository
    |   |   `-- web/                 tenant API
    |   `-- whatsapp/
    |       |-- application/         queue message use case plus DTOs
    |       |-- domain/              WhatsApp message aggregate
    |       |-- infrastructure/      repository and Rabbit adapters
    |       `-- web/                 message API
    `-- resources/
        |-- application.yml
        |-- application-dev.yml
        |-- application-prod.yml
        `-- db/migration/V1__baseline.sql
```

Controllers depend on application services and DTOs. Services coordinate domain state, scoped repositories, audit events,
cache access, and infrastructure adapters. Modules share only explicit common infrastructure and ids, which keeps this
monolith ready for later extraction without paying distributed-system costs now.

## Security and tenancy

- Access JWTs are HMAC-signed and contain the user id, tenant id, email, and role names.
- Spring Security resource-server validation authenticates bearer JWTs.
- Tenant context is derived from the verified JWT claim. Tenant-facing repositories query by `tenant_id`; client headers
  are not trusted as the isolation boundary.
- Roles are seeded by Flyway and method security gates tenant admin, agent, and auditor flows.
- Refresh tokens are random opaque values. Only SHA-256 hashes are stored, and refresh rotates the token.
- Passwords are BCrypt hashes.

For higher assurance deployments, move JWT signing material into a secret manager or asymmetric key service, add
refresh-token family/reuse detection, and use a database-per-tenant or row-level policy layer where regulation requires it.

## APIs

- `POST /api/v1/auth/register-tenant`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/tenants/me`
- `POST /api/v1/users`
- `GET /api/v1/users`
- `POST /api/v1/messages`
- `POST /api/v1/messages/media`
- `GET /api/v1/messages`
- `GET /api/v1/inbox/conversations`
- `GET /api/v1/inbox/conversations/{conversationId}/messages`
- `POST /api/v1/inbox/conversations/{conversationId}/messages`
- `PATCH /api/v1/inbox/conversations/{conversationId}/assignment`
- `POST /api/v1/inbox/conversations/{conversationId}/read`
- `POST /api/v1/inbox/conversations/{conversationId}/typing`
- `POST /api/v1/templates`
- `PUT /api/v1/templates/{templateId}`
- `DELETE /api/v1/templates/{templateId}`
- `POST /api/v1/templates/sync`
- `GET /api/v1/templates/{templateId}/analytics`
- `POST /api/v1/templates/{templateId}/analytics/sync`
- `POST /api/v1/campaigns`
- `GET /api/v1/campaigns`
- `POST /api/v1/workflows`
- `PUT /api/v1/workflows/{workflowId}/draft`
- `POST /api/v1/workflows/{workflowId}/publish`
- `GET /api/v1/workflows/{workflowId}/versions`
- `GET /api/v1/workflows/{workflowId}/executions`
- `GET /api/v1/workflows/{workflowId}/analytics`
- `POST /api/v1/whatsapp/accounts`
- `GET /api/v1/webhooks/whatsapp`
- `POST /api/v1/webhooks/whatsapp`

Swagger UI is exposed at `/swagger-ui.html` and OpenAPI JSON at `/v3/api-docs`.

## Runtime

Create a local `.env` from `.env.example`. The Spring Boot app imports `backend/.env` during local runs, and Docker
Compose passes the Meta Cloud API values into the API container. Never commit `backend/.env`.

Start the stack:

```powershell
docker compose up --build
```

`JWT_SECRET` is required outside local development and must contain at least 32 bytes of secret material. The `dev`
profile includes a local-only fallback so `mvn spring-boot:run` can boot without checking a secret into the repo; set
`JWT_SECRET` before testing tokens that need to survive restarts or before using any shared environment.
Browser frontends are allowed by `APP_ALLOWED_ORIGINS`; local defaults include `http://localhost:3000`.

MySQL stores tenant data and Flyway migrations. Redis backs Spring Cache; `TenantService.currentTenant` demonstrates a
tenant-keyed cache. RabbitMQ receives after-commit send commands, webhook work, and delayed send retries.

### Schema management

Hibernate defaults to `ddl-auto: none`, so it does not create, update, or validate tables during startup. Set
`JPA_DDL_AUTO=validate` in an environment where the existing schema should be checked against the JPA mappings.
Flyway migration scripts remain in the app, but runtime migration is disabled by default with `FLYWAY_ENABLED=false` for
already-provisioned schemas.

Enable Flyway only for an environment whose migration history has been verified:

```powershell
$env:FLYWAY_ENABLED="true"
```

For a pre-existing schema without a Flyway history table, set the matching baseline values deliberately before enabling
Flyway. Do not baseline at `V1` if the schema already contains tables or columns from later migrations.

## WhatsApp Cloud API

Set `META_WHATSAPP_ACCESS_TOKEN`, `META_APP_SECRET`, and `META_WEBHOOK_VERIFY_TOKEN`. The webhook callback path is
`/api/v1/webhooks/whatsapp`. The POST endpoint validates `X-Hub-Signature-256` against the raw request bytes before it
queues the payload for async processing.

Register each tenant phone number id with `POST /api/v1/whatsapp/accounts` before sending or receiving Cloud API traffic
for that number. The webhook processor uses the incoming `metadata.phone_number_id` to resolve tenant ownership.

Outbound text and media messages are stored before an after-commit Rabbit send event calls Meta Graph API. Failed sends
are marked with the provider error and requeued through a TTL retry queue until `META_MAX_SEND_ATTEMPTS` is reached.
Inbound webhook messages and status updates are stored in MySQL; inbound media metadata is resolved through Graph API and
downloaded under `META_MEDIA_DOWNLOAD_DIRECTORY`. Unhandled Rabbit worker exceptions dead-letter to `.dlq` queues rather
than spin on poison jobs.

## Realtime Inbox

`inbox` persists conversation assignment, last-message preview, and unread state around the existing WhatsApp message
table. REST endpoints page filtered conversation lists and reverse-chronological message history. Incoming WhatsApp
webhooks, send reconciliation, assignment changes, read markers, and typing publish tenant-scoped inbox events into Redis
Pub/Sub. Each Spring Boot node subscribes and forwards events to STOMP clients on `/topic/inbox/tenant/{tenantId}` after
the WebSocket `CONNECT` bearer JWT and subscription tenant claim are validated.

## Template Management

`templates` stores tenant-scoped WhatsApp template records, category and approval status, analytics snapshots, scheduled
campaigns, and recipient-level delivery attempts. Template create/delete/sync and analytics refresh go through the Meta
Graph adapter using the WABA id registered on each WhatsApp account. Campaign scheduling emits recipient jobs after the
database transaction commits; a Redis minute bucket throttles sends per tenant phone number, Rabbit retry queues delay
rate-limited or provider-failed jobs, and recipient rows keep attempts and provider errors for auditability.

## Automation Workflows

`automation` stores editable draft graphs and immutable published graph snapshots separately. Inbound WhatsApp messages
trigger active published workflows. The engine interprets versioned graph JSON through a `WorkflowNodeProcessor`
registry, so delay, condition, webhook, WhatsApp text, and future AI nodes can evolve independently of execution history.
Delay and retry state persist on workflow executions for scheduler resumption; step rows keep node-level history and
analytics aggregate recent completion, failure, and waiting state.
