import type { AuthSession } from "@/lib/auth/types";

const AUTH_STORAGE_KEY = "segment-to-context.auth-session";
const sessionListeners = new Set<() => void>();
let cachedRawValue: string | null = null;
let cachedSession: AuthSession | null = null;

export function subscribeToStoredSession(listener: () => void) {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}


export function loadStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (rawValue === cachedRawValue) {
    return cachedSession;
  }

  cachedRawValue = rawValue;

  if (!rawValue) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(rawValue) as AuthSession;
    return cachedSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedRawValue = null;
    cachedSession = null;
    return null;
  }
}


export function saveStoredSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitStoredSessionChange();
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitStoredSessionChange();
}

function emitStoredSessionChange() {
  sessionListeners.forEach((listener) => listener());
}
