"use client";

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type Session = TokenResponse & {
  tenantSlug: string;
  expiresAt: number;
};

type Wrapped<T> = { data: T; message: string };
type ApiErrorBody = { code?: string; message?: string };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const sessionKey = "wa-command-session";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function writeSession(tokens: TokenResponse, tenantSlug: string) {
  const session = { ...tokens, tenantSlug, expiresAt: Date.now() + tokens.expiresInSeconds * 1000 };
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new Event("wa-session-changed"));
  return session;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event("wa-session-changed"));
}

export function currentAccessToken() {
  return readSession()?.accessToken ?? process.env.NEXT_PUBLIC_ACCESS_TOKEN ?? "";
}

export function currentTenantId() {
  const payload = jwtPayload(currentAccessToken());
  return String(payload?.tenant_id ?? process.env.NEXT_PUBLIC_TENANT_ID ?? "");
}

export function currentUserId() {
  const payload = jwtPayload(currentAccessToken());
  return Number(payload?.sub ?? process.env.NEXT_PUBLIC_AGENT_ID ?? 0);
}

export function currentRoles() {
  const payload = jwtPayload(currentAccessToken());
  return Array.isArray(payload?.roles) ? payload.roles.map(String) : [];
}

export async function apiRequest<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(currentAccessToken() ? { Authorization: `Bearer ${currentAccessToken()}` } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 401 && retry && readSession()?.refreshToken) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest<T>(path, init, false);
  }
  if (!response.ok) throw await errorFrom(response);
  if (response.status === 204) return undefined as T;
  return ((await response.json()) as Wrapped<T>).data;
}

export async function login(input: { tenantSlug: string; email: string; password: string }) {
  const tokens = await publicRequest<TokenResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) });
  return writeSession(tokens, input.tenantSlug);
}

export async function registerTenant(input: {
  tenantSlug: string;
  tenantName: string;
  adminName: string;
  email: string;
  password: string;
}) {
  const tokens = await publicRequest<TokenResponse>("/api/v1/auth/register-tenant", { method: "POST", body: JSON.stringify(input) });
  return writeSession(tokens, input.tenantSlug);
}

export async function logout() {
  const refreshToken = readSession()?.refreshToken;
  if (refreshToken) await apiRequest<void>("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
  clearSession();
}

async function refreshSession() {
  const session = readSession();
  if (!session?.refreshToken) return null;
  try {
    const tokens = await publicRequest<TokenResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    return writeSession(tokens, session.tenantSlug);
  } catch {
    clearSession();
    return null;
  }
}

async function publicRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw await errorFrom(response);
  return ((await response.json()) as Wrapped<T>).data;
}

async function errorFrom(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(response.status, body.message ?? `API request failed with ${response.status}.`);
  } catch {
    return new ApiError(response.status, `API request failed with ${response.status}.`);
  }
}

function jwtPayload(token: string) {
  if (!token || typeof window === "undefined") return null;
  try {
    const value = token.split(".")[1]?.replaceAll("-", "+").replaceAll("_", "/");
    return value ? JSON.parse(window.atob(value)) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
