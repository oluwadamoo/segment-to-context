export function DashboardShell() {
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
            Loading dashboard...
          </div>
        </header>

        <main className="min-h-0 flex-1 py-4">
          <div className="grid min-h-[calc(100vh-8.75rem)] gap-4 rounded-[2rem] border border-border bg-card/70 p-4 shadow-[0_24px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:grid-cols-[1.9fr_1fr]">
            <section className="rounded-[1.5rem] border border-border bg-background/50 p-6">
              <div className="h-4 w-28 rounded-full bg-muted" />
              <div className="mt-4 h-8 w-64 rounded-full bg-muted" />
              <div className="mt-6 space-y-3">
                <div className="h-24 rounded-2xl border border-border bg-card/70" />
                <div className="h-24 rounded-2xl border border-border bg-card/70" />
                <div className="h-24 rounded-2xl border border-border bg-card/70" />
              </div>
            </section>

            <aside className="rounded-[1.5rem] border border-border bg-background/50 p-6">
              <div className="h-4 w-24 rounded-full bg-muted" />
              <div className="mt-4 h-10 rounded-2xl border border-border bg-card/70" />
              <div className="mt-6 space-y-3">
                <div className="h-28 rounded-2xl border border-border bg-card/70" />
                <div className="h-24 rounded-2xl border border-border bg-card/70" />
                <div className="h-24 rounded-2xl border border-border bg-card/70" />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
