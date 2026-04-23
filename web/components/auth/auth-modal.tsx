"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, KeyRound, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type AuthMode = "signup" | "login";

export function AuthModal() {
  const {
    latestIssuedApiKey,
    clearIssuedApiKey,
    signUp,
    login,
    status,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [copied, setCopied] = useState(false);

  const title = useMemo(() => {
    if (latestIssuedApiKey) {
      return "Your account is ready";
    }

    return mode === "signup" ? "Create your tenant account" : "Sign in with your API key";
  }, [latestIssuedApiKey, mode]);

  const subtitle = useMemo(() => {
    if (latestIssuedApiKey) {
      return "Copy and keep this API key somewhere safe. You will use it to sign in again later.";
    }

    return mode === "signup"
      ? "Start with email and password. We will generate your tenant API key automatically."
      : "Use the API key issued to your tenant account to get back in.";
  }, [latestIssuedApiKey, mode]);

  async function copyApiKey() {
    if (!latestIssuedApiKey) {
      return;
    }

    await navigator.clipboard.writeText(latestIssuedApiKey);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/95 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Tenant authentication
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>

        {latestIssuedApiKey ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                Tenant created successfully
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-sm break-all text-foreground">
                {latestIssuedApiKey}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={copyApiKey}>
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy API key"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={clearIssuedApiKey}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : status === "loading" ? (
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Restoring your session...
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  mode === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserPlus className="size-4" />
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LogIn className="size-4" />
                Login
              </button>
            </div>

            {mode === "signup" ? (
              <SignupForm onSubmit={signUp} />
            ) : (
              <LoginForm onSubmit={login} />
            )}

            <div className="mt-5 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <KeyRound className="size-4" />
                How it works
              </div>
              <p className="leading-6">
                Signup gives you both a JWT session and a tenant API key. Later
                logins use the API key, while event requests use the bearer
                token.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
