export const activityFeed = [
  ["Template sync completed", "Meta approved 12 utility templates", "2m"],
  ["Campaign retry queue drained", "84 recipients recovered after provider throttle", "16m"],
  ["AI handoff triggered", "Conversation moved to Priya after low confidence", "28m"],
  ["Webhook latency stable", "p95 184 ms across 2 phone numbers", "1h"],
];

export const contactSegments = [
  { name: "VIP buyers", contacts: 1840, growth: "+12%", color: "var(--accent)" },
  { name: "Dormant leads", contacts: 9200, growth: "-3%", color: "var(--purple)" },
  { name: "Open support", contacts: 318, growth: "+22%", color: "var(--highlight)" },
  { name: "High intent", contacts: 642, growth: "+8%", color: "var(--success)" },
];

export const integrationHealth = [
  ["Meta Cloud API", "Operational", "99.99%", "Webhook + Graph"],
  ["Stripe", "Connected", "99.95%", "Billing portal"],
  ["HubSpot", "Needs review", "Token expires soon", "CRM sync"],
  ["Segment", "Operational", "Events streaming", "Analytics"],
];
