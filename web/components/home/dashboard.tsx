"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/home/dashboard-shell";

const AuthModal = dynamic(
  () => import("@/components/auth/auth-modal").then((mod) => mod.AuthModal),
  {
    ssr: false,
  },
);

const AuthenticatedDashboard = dynamic(
  () =>
    import("@/components/home/authenticated-dashboard").then(
      (mod) => mod.AuthenticatedDashboard,
    ),
  {
    ssr: false,
    loading: () => <DashboardShell />,
  },
);

export function Dashboard() {
  const { latestIssuedApiKey, logout, session, status } = useAuth();

  if (status === "authenticated" && session?.accessToken) {
    return (
      <>
        <AuthenticatedDashboard
          accessToken={session.accessToken}
          tenantEmail={session.tenant.email}
          onLogout={logout}
        />
        {latestIssuedApiKey ? <AuthModal /> : null}
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 md:px-6">
        <header className="flex items-center justify-between rounded-3xl border border-border bg-card/80 px-5 py-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="space-y-1">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Segment To Context
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time user event stream and persona viewer
            </p>
          </div>

          <div className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
            Authentication required
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-3xl rounded-[2rem] border border-border bg-card/70 p-8 text-center shadow-[0_24px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="mx-auto max-w-xl space-y-4">
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Event Pulse
              </div>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                Stream user activity and inspect persona changes in real time
              </h1>
              <p className="text-sm leading-7 text-muted-foreground md:text-base">
                Sign in to open the live event terminal, inspect user behavior,
                and follow persona updates as they happen.
              </p>
              <div className="grid gap-3 pt-2 md:grid-cols-3">
                <FeatureCard
                  title="Live stream"
                  description="Incoming events appear as soon as they are ingested."
                />
                <FeatureCard
                  title="User focus"
                  description="Select a user and inspect their evolving activity trail."
                />
                <FeatureCard
                  title="Actionable persona"
                  description="See interests, confidence, and recommended next steps."
                />
              </div>
              <div className="flex justify-center pt-2">
                <Button size="lg">Open authentication</Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AuthModal />
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4 text-left">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
