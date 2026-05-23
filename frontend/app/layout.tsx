import type { Metadata } from "next";
import { AppProviders } from "@/src/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WA Command",
    template: "%s | WA Command",
  },
  description: "WhatsApp operations workspace for SaaS teams.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
