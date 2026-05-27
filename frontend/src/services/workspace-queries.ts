import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/workspace-api";
import * as workflow from "@/lib/workflow-api";

export const keys = {
  tenant: ["tenant"] as const,
  accounts: ["accounts"] as const,
  users: ["users"] as const,
  templates: (category = "", status = "") => ["templates", category, status] as const,
  campaigns: ["campaigns"] as const,
  messages: ["messages"] as const,
  workflows: ["workflows"] as const,
};

const visibleInterval = (milliseconds: number) => () =>
  typeof document === "undefined" || document.visibilityState === "visible" ? milliseconds : false;

export function useTenant() {
  return useQuery({ queryKey: keys.tenant, queryFn: api.tenantMe });
}

export function useWorkspaceSummary() {
  return {
    tenant: useTenant(),
    accounts: useQuery({ queryKey: keys.accounts, queryFn: api.accounts }),
    templates: useQuery({ queryKey: keys.templates(), queryFn: () => api.templates(), refetchInterval: visibleInterval(30000) }),
    campaigns: useQuery({ queryKey: keys.campaigns, queryFn: api.campaigns, refetchInterval: visibleInterval(15000) }),
    messages: useQuery({ queryKey: keys.messages, queryFn: api.messages, refetchInterval: visibleInterval(15000) }),
  };
}

export function useCreateCampaign() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => void client.invalidateQueries({ queryKey: keys.campaigns }),
  });
}

export function useRegisterAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.registerAccount,
    onSuccess: () => void client.invalidateQueries({ queryKey: keys.accounts }),
  });
}

export function useWorkflowList() {
  return useQuery({ queryKey: keys.workflows, queryFn: workflow.workflows });
}
