import type { ProgressState } from "../types";
import { mergeProgress, normalizeProgress } from "./progress";

const SESSION_KEY = "basic-english-coach-cloud-session-v1";
const PROGRESS_TABLE = "learning_progress";

interface SupabaseUser {
  id: string;
  email?: string;
}

interface SupabaseSessionResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: SupabaseUser;
}

interface ProgressRow {
  progress: Partial<ProgressState>;
  updated_at: string;
}

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string | null;
  };
}

export interface CloudSyncResult {
  session: CloudSession;
  progress: ProgressState;
  pulledRemote: boolean;
}

function cleanUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function getSupabaseUrl() {
  return cleanUrl(import.meta.env.VITE_SUPABASE_URL ?? "");
}

function getSupabaseAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
}

export function isCloudSyncConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getCloudSyncConfigStatus() {
  return {
    configured: isCloudSyncConfigured(),
    url: getSupabaseUrl(),
  };
}

function requireCloudSyncConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("云同步还没有配置 Supabase 环境变量。");
  }

  return { url, anonKey };
}

function authUrl(path: string) {
  return `${requireCloudSyncConfig().url}/auth/v1${path}`;
}

function restUrl(path: string) {
  return `${requireCloudSyncConfig().url}/rest/v1${path}`;
}

function anonymousHeaders() {
  const { anonKey } = requireCloudSyncConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

function sessionHeaders(session: CloudSession) {
  const { anonKey } = requireCloudSyncConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

async function readResponseError(response: Response) {
  const text = await response.text();
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const parsed = JSON.parse(text) as { msg?: string; message?: string; error_description?: string };
    return parsed.error_description ?? parsed.message ?? parsed.msg ?? text;
  } catch {
    return text;
  }
}

async function fetchJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await readResponseError(response));
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function getRedirectTo() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

function saveCloudSession(session: CloudSession) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

function toCloudSession(payload: SupabaseSessionResponse, fallbackRefreshToken?: string): CloudSession {
  const refreshToken = payload.refresh_token ?? fallbackRefreshToken;
  const expiresAt =
    payload.expires_at ?? Math.floor(Date.now() / 1000) + Math.max(0, Number(payload.expires_in) || 3600);

  if (!payload.access_token || !refreshToken || !payload.user?.id) {
    throw new Error("登录信息不完整，请重新发送邮箱登录链接。");
  }

  const session: CloudSession = {
    accessToken: payload.access_token,
    refreshToken,
    expiresAt,
    user: {
      id: payload.user.id,
      email: payload.user.email ?? null,
    },
  };

  saveCloudSession(session);
  return session;
}

export function loadCloudSession(): CloudSession | null {
  if (!isCloudSyncConfigured() || typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CloudSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCloudSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function fetchCurrentUser(accessToken: string) {
  const { anonKey } = requireCloudSyncConfig();
  return fetchJson<SupabaseUser>(authUrl("/user"), {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function requestMagicLink(email: string) {
  const redirectTo = getRedirectTo();
  await fetchJson<null>(authUrl("/otp"), {
    method: "POST",
    headers: anonymousHeaders(),
    body: JSON.stringify({
      email,
      create_user: true,
      options: redirectTo ? { email_redirect_to: redirectTo } : undefined,
    }),
  });
}

export async function consumeCloudAuthRedirect() {
  if (!isCloudSyncConfigured() || typeof window === "undefined") {
    return null;
  }

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = hash.get("error_description") ?? hash.get("error");
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in")) || 3600;

  if (!accessToken && !error) {
    return null;
  }

  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);

  if (error) {
    throw new Error(error);
  }

  if (!accessToken || !refreshToken) {
    throw new Error("邮箱登录链接缺少会话信息，请重新发送一次。");
  }

  const user = await fetchCurrentUser(accessToken);
  return toCloudSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    user,
  });
}

export async function refreshCloudSession(session: CloudSession | null) {
  if (!session) {
    return null;
  }

  const shouldRefresh = session.expiresAt <= Math.floor(Date.now() / 1000) + 60;
  if (!shouldRefresh) {
    return session;
  }

  try {
    return toCloudSession(
      await fetchJson<SupabaseSessionResponse>(authUrl("/token?grant_type=refresh_token"), {
        method: "POST",
        headers: anonymousHeaders(),
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      }),
      session.refreshToken
    );
  } catch (error) {
    clearCloudSession();
    throw error;
  }
}

export async function fetchCloudProgress(session: CloudSession) {
  const rows = await fetchJson<ProgressRow[]>(
    `${restUrl(`/${PROGRESS_TABLE}`)}?select=progress,updated_at&user_id=eq.${encodeURIComponent(
      session.user.id
    )}&limit=1`,
    {
      headers: sessionHeaders(session),
    }
  );

  return rows?.[0]?.progress ? normalizeProgress(rows[0].progress) : null;
}

export async function pushCloudProgress(session: CloudSession, progress: ProgressState) {
  await fetchJson<null>(`${restUrl(`/${PROGRESS_TABLE}`)}?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...sessionHeaders(session),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: session.user.id,
      progress: normalizeProgress(progress),
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function syncProgressWithCloud(
  session: CloudSession,
  localProgress: ProgressState
): Promise<CloudSyncResult> {
  const freshSession = await refreshCloudSession(session);
  if (!freshSession) {
    throw new Error("登录已失效，请重新发送邮箱登录链接。");
  }

  const remoteProgress = await fetchCloudProgress(freshSession);
  const progress = mergeProgress(localProgress, remoteProgress);
  await pushCloudProgress(freshSession, progress);

  return {
    session: freshSession,
    progress,
    pulledRemote: Boolean(remoteProgress),
  };
}
