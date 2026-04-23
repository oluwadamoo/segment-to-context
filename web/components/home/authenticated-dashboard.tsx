"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  LogOut,
  Pause,
  Play,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
} from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  deriveUserPersona,
  mapStreamMessageToEventStreamItem,
  type EventIngestedMessage,
  type EventStreamItem,
} from "@/lib/dashboard/event-pulse";
import {
  formatTimestamp,
  getUserInitials,
  formatLastAnalyzed,
} from "@/lib/dashboard/format";

type ConnectionStatus = "open" | "closed";

type AuthenticatedDashboardProps = {
  accessToken: string;
  tenantEmail: string;
  onLogout: () => void;
};

const MAX_VISIBLE_EVENTS = 50;
const MAX_BUFFERED_EVENTS = 50;

export function AuthenticatedDashboard({
  accessToken,
  tenantEmail,
  onLogout,
}: AuthenticatedDashboardProps) {
  const [displayedEvents, setDisplayedEvents] = useState<EventStreamItem[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("closed");
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const bufferRef = useRef<EventStreamItem[]>([]);
  const isStreamPausedRef = useRef(false);

  const resolvedSelectedUserId = useMemo(() => {
    if (
      selectedUserId &&
      displayedEvents.some((event) => event.userId === selectedUserId)
    ) {
      return selectedUserId;
    }

    return displayedEvents[0]?.userId ?? "";
  }, [displayedEvents, selectedUserId]);

  const selectedUserPersona = useMemo(
    () => deriveUserPersona(displayedEvents, resolvedSelectedUserId),
    [displayedEvents, resolvedSelectedUserId],
  );

  useEffect(() => {
    isStreamPausedRef.current = isStreamPaused;
  }, [isStreamPaused]);

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;
    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      eventSource = new EventSource(
        `/api/stream/events?token=${encodeURIComponent(accessToken)}`,
      );

      function handleOpen() {
        setConnectionStatus("open");
      }

      function handleError() {
        setConnectionStatus("closed");
      }

      function handleEventIngested(event: MessageEvent<string>) {
        const message = JSON.parse(event.data) as EventIngestedMessage;
        const normalizedEvent = {
          ...mapStreamMessageToEventStreamItem(message),
          animationMode: "live" as const,
          animationIndex: 0,
        };

        if (isStreamPausedRef.current) {
          bufferRef.current = [
            {
              ...normalizedEvent,
              animationMode: "buffered" as const,
              animationIndex: bufferRef.current.length,
            },
            ...bufferRef.current,
          ].slice(0, MAX_BUFFERED_EVENTS);
          setBufferedCount(bufferRef.current.length);
          return;
        }

        setDisplayedEvents((currentEvents) =>
          [normalizedEvent, ...currentEvents].slice(0, MAX_VISIBLE_EVENTS),
        );
      }

      eventSource.onopen = handleOpen;
      eventSource.onerror = handleError;
      eventSource.addEventListener(
        "event.ingested",
        handleEventIngested as EventListener,
      );
    };

    if (typeof browserWindow.requestIdleCallback === "function") {
      idleCallbackId = browserWindow.requestIdleCallback(connect, {
        timeout: 1500,
      });
    } else {
      timeoutId = globalThis.setTimeout(connect, 250);
    }

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (
        idleCallbackId !== null &&
        typeof browserWindow.cancelIdleCallback === "function"
      ) {
        browserWindow.cancelIdleCallback(idleCallbackId);
      }

      eventSource?.close();
      setConnectionStatus("closed");
    };
  }, [accessToken]);

  function toggleStream() {
    setIsStreamPaused((currentValue) => {
      if (currentValue) {
        const bufferedEvents = bufferRef.current.map((event, index) => ({
          ...event,
          animationMode: "buffered" as const,
          animationIndex: index,
        }));

        setDisplayedEvents((currentEvents) =>
          [...bufferedEvents, ...currentEvents].slice(0, MAX_VISIBLE_EVENTS),
        );
        bufferRef.current = [];
        setBufferedCount(0);
      }

      return !currentValue;
    });
  }

  function selectUser(userId: string) {
    setSelectedUserId(userId);
    setSearchUserId(userId);
  }

  function handlePersonaLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUserId = searchUserId.trim();

    if (!normalizedUserId) {
      return;
    }

    setSelectedUserId(normalizedUserId);
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
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Real-time user event stream and persona viewer
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-live-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground">
              {tenantEmail}
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 py-4">
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-[calc(100vh-8.75rem)] rounded-[2rem] border border-border bg-card/70 shadow-[0_24px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl"
          >
            <ResizablePanel defaultSize={70} minSize={55}>
              <section className="flex h-full flex-col">
                <div className="border-b border-border px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Event Stream
                      </div>
                      <h1 className="mt-2 text-2xl font-semibold text-foreground">
                        Live ingested event stream
                      </h1>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConnectionStatusBadge status={connectionStatus} />
                      <div className="rounded-2xl border border-border bg-background/70 px-4 py-2 font-mono text-xs text-muted-foreground">
                        {displayedEvents.length} visible events
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleStream}
                      >
                        {isStreamPaused ? (
                          <Play className="size-4" />
                        ) : (
                          <Pause className="size-4" />
                        )}
                        {isStreamPaused ? "Resume" : "Pause"}
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="relative p-6 font-mono">
                    {isStreamPaused && bufferedCount > 0 ? (
                      <div className="pointer-events-none sticky top-0 z-20 mb-4 flex justify-center">
                        <Badge
                          variant="warning"
                          className="px-4 py-1.5 text-[10px] shadow-lg backdrop-blur"
                        >
                          +{bufferedCount} new events buffered
                        </Badge>
                      </div>
                    ) : null}

                    {displayedEvents.length === 0 ? (
                      <Card className="border-dashed bg-background/55">
                        <CardContent className="flex min-h-40 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                          {connectionStatus === "closed"
                            ? "Stream disconnected. Waiting for the live feed to reconnect..."
                            : "No live events yet. New ingested events will appear here automatically."}
                        </CardContent>
                      </Card>
                    ) : (
                      <LazyMotion features={domAnimation}>
                        <div className="space-y-3">
                          <AnimatePresence initial={false}>
                            {displayedEvents.map((event, index) => (
                              <m.div
                                key={event.id}
                                initial={{ opacity: 0, y: -18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{
                                  duration: 0.28,
                                  ease: "easeOut",
                                  delay:
                                    event.animationMode === "buffered"
                                      ? Math.min(event.animationIndex ?? 0, 8) *
                                        0.05
                                      : 0,
                                }}
                              >
                                <Card
                                  className={cn(
                                    "border-l-4 bg-background/70 shadow-none transition-colors",
                                    index === 0 && "bg-emerald-500/6",
                                    getEventBorderClassName(event.eventType),
                                  )}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge
                                            variant={getEventBadgeVariant(
                                              event.eventType,
                                            )}
                                          >
                                            {event.eventType}
                                          </Badge>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              selectUser(event.userId)
                                            }
                                            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                          >
                                            <Badge
                                              variant={
                                                resolvedSelectedUserId ===
                                                event.userId
                                                  ? "info"
                                                  : "secondary"
                                              }
                                              className="cursor-pointer font-mono normal-case tracking-normal"
                                            >
                                              user:{event.userId}
                                            </Badge>
                                          </button>
                                          <Badge
                                            variant="outline"
                                            className="font-mono normal-case tracking-normal"
                                          >
                                            {event.channel}
                                          </Badge>
                                        </div>
                                        <div>
                                          <h2 className="text-base font-semibold text-foreground">
                                            {event.product}
                                          </h2>
                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {event.category} | {event.brand}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="text-right text-xs text-muted-foreground">
                                        <Badge
                                          variant="success"
                                          className="mb-2 gap-1 font-mono normal-case tracking-normal"
                                        >
                                          <ArrowDownLeft className="size-3" />
                                          ingested
                                        </Badge>
                                        <p>{formatTimestamp(event.timestamp)}</p>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                      <MetricTile
                                        label="Category"
                                        value={event.category}
                                      />
                                      <MetricTile
                                        label="Price"
                                        value={`$${event.price.toFixed(2)}`}
                                      />
                                      <MetricTile
                                        label="Event ID"
                                        value={event.id.slice(0, 16)}
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              </m.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </LazyMotion>
                    )}
                  </div>
                </ScrollArea>
              </section>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={24}>
              <aside className="flex h-full flex-col border-l border-border bg-background/40">
                <div className="border-b border-border px-5 py-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    Persona Viewer
                  </div>
                  <form onSubmit={handlePersonaLookup} className="mt-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchUserId}
                        onChange={(event) =>
                          setSearchUserId(event.target.value)
                        }
                        className="pl-9 font-mono"
                        placeholder="Search user_id"
                      />
                    </div>
                  </form>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-4 p-5">
                    {selectedUserPersona ? (
                      <>
                        <Card className="bg-card/90">
                          <CardContent className="flex items-center gap-4 p-5">
                            <Avatar>
                              <AvatarFallback>
                                {getUserInitials(selectedUserPersona.userId)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                                Persona Viewer
                              </p>
                              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                                User {selectedUserPersona.userId}
                              </h2>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Last analyzed{" "}
                                {formatLastAnalyzed(
                                  selectedUserPersona.lastAnalyzed,
                                )}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Card className="md:col-span-2 bg-card/90">
                            <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                              <Badge className="border-primary/20 bg-primary/10 px-5 py-2 text-sm tracking-[0.2em] text-primary shadow-[0_0_0_1px_rgba(99,102,241,0.08)] backdrop-blur-xl">
                                {selectedUserPersona.archetype}
                              </Badge>
                              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                                {selectedUserPersona.summary}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-card/90">
                            <CardHeader>
                              <CardDescription>Confidence</CardDescription>
                              <CardTitle className="flex items-center gap-2 text-3xl">
                                <Activity className="size-5 text-emerald-400" />
                                {selectedUserPersona.confidence}%
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="font-mono text-xs text-muted-foreground">
                              Based on {selectedUserPersona.eventCount} events
                              and consistent behavioral signals.
                            </CardContent>
                          </Card>

                          <Card className="bg-card/90">
                            <CardHeader>
                              <CardDescription>Top context</CardDescription>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="size-4 text-cyan-300" />
                                {selectedUserPersona.dominantCategory}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 font-mono text-xs text-muted-foreground">
                              <div>
                                Primary channel:{" "}
                                {selectedUserPersona.primaryChannel}
                              </div>
                              <div>
                                Avg. spend: $
                                {selectedUserPersona.averageSpend.toFixed(2)}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="md:col-span-2 bg-card/90">
                            <CardHeader>
                              <CardDescription>Interests</CardDescription>
                              <CardTitle className="text-lg">
                                Intent clusters
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {selectedUserPersona.interests.map(
                                  (interest) => (
                                    <Badge
                                      key={interest}
                                      variant="outline"
                                      className="font-mono normal-case tracking-normal"
                                    >
                                      {interest}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="md:col-span-2 bg-card/90">
                            <CardHeader>
                              <CardDescription>
                                Recommended action
                              </CardDescription>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <UserRound className="size-4 text-violet-300" />
                                Next best move
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm leading-7 text-muted-foreground">
                              {selectedUserPersona.recommendedAction}
                            </CardContent>
                            <CardFooter>
                              <Button size="lg" className="w-full">
                                Recommended Action
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </>
                    ) : (
                      <Card className="bg-card/90">
                        <CardContent className="p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            {resolvedSelectedUserId ? (
                              <>
                                No user persona found for{" "}
                                <span className="font-mono text-foreground">
                                  {resolvedSelectedUserId}
                                </span>
                                .
                              </>
                            ) : (
                              "Select a user from the live stream to inspect their persona."
                            )}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click a user tag from the stream or search for
                            another user_id.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </aside>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const styles =
    status === "open"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border-red-500/20 bg-red-500/10 text-red-300";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        styles,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status === "open" ? "bg-emerald-400" : "bg-red-400",
        )}
      />
      Connection {status}
    </div>
  );
}

function getEventBadgeVariant(eventType: string) {
  switch (eventType) {
    case "purchase":
      return "success";
    case "checkout_started":
      return "warning";
    case "add_to_cart":
      return "info";
    default:
      return "default";
  }
}

function getEventBorderClassName(eventType: string) {
  switch (eventType) {
    case "purchase":
      return "border-l-emerald-400";
    case "checkout_started":
      return "border-l-amber-400";
    case "add_to_cart":
      return "border-l-sky-400";
    default:
      return "border-l-violet-400";
  }
}
