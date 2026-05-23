import { EnterpriseShell } from "@/src/layouts/enterprise-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <EnterpriseShell>{children}</EnterpriseShell>;
}
