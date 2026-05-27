const http = require("http");
const crypto = require("crypto");

const port = Number(process.env.PORT || 8090);
const target = process.env.TARGET_WEBHOOK_URL || "http://localhost:8080/api/v1/webhooks/whatsapp";
const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "wa_command_verify";
const appSecret = process.env.META_APP_SECRET || "";

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge") || "";
    if (mode === "subscribe" && token === verifyToken) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(challenge);
      return;
    }
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Verification failed");
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return;
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    const body = Buffer.concat(chunks);
    const signature = req.headers["x-hub-signature-256"] || signBody(body);

    console.log(body.toString("utf8"));

    try {
      const response = await fetch(target, {
        method: "POST",
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
          ...(signature ? { "X-Hub-Signature-256": signature } : {}),
        },
        body,
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`Forward failed: ${response.status} ${text}`);
      } else {
        console.log(`Forwarded webhook to Spring: ${response.status}`);
      }
    } catch (error) {
      console.error("Forward failed:", error);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("EVENT_RECEIVED");
  });
});

server.listen(port, () => {
  console.log(`Meta webhook forwarder listening on http://localhost:${port}`);
  console.log(`Forwarding POST webhooks to ${target}`);
});

function signBody(body) {
  if (!appSecret) return undefined;
  return `sha256=${crypto.createHmac("sha256", appSecret).update(body).digest("hex")}`;
}
