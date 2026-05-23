import {
  BarChart3,
  Bot,
  Cable,
  CalendarClock,
  ContactRound,
  CreditCard,
  FileStack,
  GitBranch,
  LayoutDashboard,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export const workspaceNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/inbox", label: "Inbox", icon: MessageSquareText, shortcut: "G I" },
  { href: "/contacts", label: "Contacts", icon: ContactRound, shortcut: "G C" },
  { href: "/templates", label: "Templates", icon: FileStack, shortcut: "G T" },
  { href: "/campaigns", label: "Campaigns", icon: CalendarClock, shortcut: "G M" },
  { href: "/ai", label: "AI Chatbot", icon: Bot, shortcut: "G A" },
  { href: "/flows", label: "Flow Builder", icon: GitBranch, shortcut: "G F" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "G R" },
  { href: "/team", label: "Team", icon: UsersRound, shortcut: "G U" },
  { href: "/integrations", label: "Integrations", icon: Cable, shortcut: "G X" },
  { href: "/billing", label: "Billing", icon: CreditCard, shortcut: "G B" },
  { href: "/settings", label: "Settings", icon: Settings2, shortcut: "G S" },
];

export const governanceItems = [
  { label: "RBAC enabled", icon: ShieldCheck },
  { label: "Tenant isolated", icon: ShieldCheck },
  { label: "Webhook signed", icon: ShieldCheck },
];
