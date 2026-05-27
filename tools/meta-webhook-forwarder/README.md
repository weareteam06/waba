# Meta Webhook Forwarder

Small local helper for testing when you want to keep a visible Node webhook log and still forward the same Meta webhook payload into the Spring Boot backend.

Run from the repo root:

```powershell
$env:PORT="8090"
$env:META_WEBHOOK_VERIFY_TOKEN="wa_command_verify"
$env:META_APP_SECRET="your-meta-app-secret"
$env:TARGET_WEBHOOK_URL="http://localhost:8080/api/v1/webhooks/whatsapp"
node tools/meta-webhook-forwarder/server.js
```

Point ngrok to this helper:

```powershell
ngrok http 8090
```

Use the ngrok HTTPS URL as the Meta callback URL. The helper:

- answers Meta webhook verification
- logs the raw webhook body
- forwards POST bodies and `X-Hub-Signature-256` to Spring Boot
- signs the forwarded body with `META_APP_SECRET` when the incoming request has no signature, which is useful for manual local tests

For production, point Meta directly to the Spring Boot webhook path instead of using this helper.
