"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  loginTenant,
  rotateTenantApiKey,
  signupTenant,
} from "@/lib/auth/client";
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from "@/lib/auth/storage";
import type {
  AuthSession,
  LoginFormValues,
  SignupFormValues,
} from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  latestIssuedApiKey: string | null;
  signUp: (values: SignupFormValues) => Promise<void>;
  login: (values: LoginFormValues) => Promise<void>;
  rotateApiKey: () => Promise<string>;
  logout: () => void;
  clearIssuedApiKey: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState(() => getInitialAuthState());
  const [latestIssuedApiKey, setLatestIssuedApiKey] = useState<string | null>(
    null
  );

  function applySession(nextSession: AuthSession) {
    setAuthState({
      status: "authenticated",
      session: nextSession,
    });
    saveStoredSession(nextSession);
  }

  async function signUp(values: SignupFormValues) {
    const result = await signupTenant(values);

    applySession({
      accessToken: result.accessToken,
      tenant: result.tenant,
    });
    setLatestIssuedApiKey(result.apiKey);
  }

  async function login(values: LoginFormValues) {
    const result = await loginTenant(values);

    applySession(result);
    setLatestIssuedApiKey(null);
  }

  async function rotateApiKey() {
    if (!authState.session?.accessToken) {
      throw new Error("You must be signed in to rotate your API key.");
    }

    const result = await rotateTenantApiKey(authState.session.accessToken);
    return result.apiKey;
  }

  function logout() {
    setAuthState({
      status: "unauthenticated",
      session: null,
    });
    setLatestIssuedApiKey(null);
    clearStoredSession();
  }

  function clearIssuedApiKey() {
    setLatestIssuedApiKey(null);
  }

  return (
    <AuthContext.Provider
      value={{
        status: authState.status,
        session: authState.session,
        latestIssuedApiKey,
        signUp,
        login,
        rotateApiKey,
        logout,
        clearIssuedApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

function getInitialAuthState(): {
  status: AuthStatus;
  session: AuthSession | null;
} {
  const storedSession = loadStoredSession();

  if (storedSession) {
    return {
      status: "authenticated",
      session: storedSession,
    };
  }

  return {
    status: "unauthenticated",
    session: null,
  };
}
