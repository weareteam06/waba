const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0F172A"/>
  <circle cx="32" cy="32" r="20" fill="#22C55E"/>
  <path d="M21 41l3.2-9.2a13 13 0 112.7 4.1L21 41z" fill="#F8FAFC"/>
  <path d="M25.8 31.3c2.7 5 6.2 7.5 11.1 8.9 1.4.4 3.1-.4 3.8-1.7l.9-1.6-4.5-2.1-1.1 1.3c-2.1-.8-4.9-2.5-6.6-5.8l1.1-1.3-2.5-4.3-1.7.7c-1.3.6-2 2.4-1.4 3.8.2.7.5 1.4.9 2.1z" fill="#0F172A"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/svg+xml",
    },
  });
}
