import type {
    ApiAcceptedResponse,
    AutoTrackOptions,
    BrowserContext,
    EventPayload,
    SegmentToContextClientOptions,
    SegmentToContextEvent,
    TrackEventInput,
    TrackPageViewInput,
    TrackResult,
    TransportMode,
} from "./types";

type PendingEvent = {
    event: SegmentToContextEvent;
    retryCount: number;
};

const DEFAULT_API_BASE_URL = "https://segment-to-context-api-101914438119.us-central1.run.app";
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const ANONYMOUS_USER_STORAGE_KEY = "segment_to_context.anonymous_user_id";

export class SegmentToContextClient {
    private readonly apiKey: string;
    private readonly apiBaseUrl: string;
    private readonly maxRetries: number;
    private readonly debug: boolean;
    private readonly autoTrack: Required<AutoTrackOptions>;
    private readonly anonymousUserId: string;
    private readonly sessionId: string;
    private currentUserId: string | null;
    private lastTrackedPageUrl: string | null = null;
    private readonly retryTimeouts = new Map<string, number>();
    private readonly cleanupCallbacks: Array<() => void> = [];

    constructor(options: SegmentToContextClientOptions) {
        if (!options.apiKey.trim()) {
            throw new Error("apiKey is required");
        }

        this.apiKey = options.apiKey;
        this.apiBaseUrl = normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
        this.currentUserId = options.userId?.trim() || null;
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.debug = options.debug ?? false;
        this.autoTrack = normalizeAutoTrackOptions(options.autoTrack);
        this.anonymousUserId = getOrCreateAnonymousUserId();
        this.sessionId = generateSessionId();

        this.startAutoTracking();
    }

    identify(userId: string | null) {
        this.currentUserId = userId?.trim() || null;
    }

    reset() {
        this.currentUserId = null;
    }

    async track(
        eventType: string,
        payload: EventPayload = {},
        input: TrackEventInput = {},
    ): Promise<TrackResult> {
        const resolvedUserId = this.resolveUserId(input.userId);

        if (!resolvedUserId) {
            throw new Error("userId is required");
        }

        if (!eventType.trim()) {
            throw new Error("eventType is required");
        }

        const event: SegmentToContextEvent = {
            id: input.eventId ?? generateEventId(),
            userId: resolvedUserId,
            eventType,
            payload: enrichPayload(payload, this.buildBrowserContext()),
        };

        await this.sendWithRetry(
            {
                event,
                retryCount: 0,
            },
            input.transport ?? "fetch",
        );

        return {
            eventId: event.id,
        };
    }

    async trackPageView(input: TrackPageViewInput = {}): Promise<TrackResult | null> {
        const browserContext = this.buildBrowserContext();

        if (this.lastTrackedPageUrl === browserContext.url) {
            return null;
        }

        this.lastTrackedPageUrl = browserContext.url;

        return this.track(
            "page_view",
            {
                page: {
                    url: browserContext.url,
                    path: browserContext.path,
                    title: browserContext.title,
                    referrer: browserContext.referrer,
                    type: browserContext.pageType,
                },
                ...(input.payload ?? {}),
            },
            {
                userId: input.userId,
                eventId: input.eventId,
                transport: input.transport,
            },
        );
    }

    destroy() {
        for (const cleanup of this.cleanupCallbacks) {
            cleanup();
        }

        this.cleanupCallbacks.length = 0;

        for (const timeoutId of this.retryTimeouts.values()) {
            window.clearTimeout(timeoutId);
        }

        this.retryTimeouts.clear();
    }

    private resolveUserId(explicitUserId?: string) {
        return explicitUserId?.trim() || this.currentUserId || this.anonymousUserId;
    }

    private startAutoTracking() {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return;
        }

        if (this.autoTrack.sessions) {
            void this.track("session_started", {
                sessionId: this.sessionId,
            }).catch((error) => {
                this.log("Failed to send session_started", { error });
            });

            const handlePageHide = () => {
                void this.track(
                    "session_ended",
                    {
                        sessionId: this.sessionId,
                    },
                    {
                        transport: "keepalive",
                    },
                ).catch((error) => {
                    this.log("Failed to send session_ended", { error });
                });
            };

            window.addEventListener("pagehide", handlePageHide);
            this.cleanupCallbacks.push(() => {
                window.removeEventListener("pagehide", handlePageHide);
            });
        }

        if (this.autoTrack.pageViews) {
            void this.trackPageView().catch((error) => {
                this.log("Failed to send initial page_view", { error });
            });

            const emitPageView = () => {
                void this.trackPageView().catch((error) => {
                    this.log("Failed to send page_view", { error });
                });
            };

            const originalPushState = window.history.pushState.bind(window.history);
            const originalReplaceState = window.history.replaceState.bind(window.history);

            window.history.pushState = (...args) => {
                originalPushState(...args);
                emitPageView();
            };

            window.history.replaceState = (...args) => {
                originalReplaceState(...args);
                emitPageView();
            };

            const handlePopState = () => emitPageView();
            const handleHashChange = () => emitPageView();

            window.addEventListener("popstate", handlePopState);
            window.addEventListener("hashchange", handleHashChange);

            this.cleanupCallbacks.push(() => {
                window.history.pushState = originalPushState;
                window.history.replaceState = originalReplaceState;
                window.removeEventListener("popstate", handlePopState);
                window.removeEventListener("hashchange", handleHashChange);
            });
        }

        if (this.autoTrack.buttonClicks || this.autoTrack.linkClicks) {
            const handleClick = (event: MouseEvent) => {
                const target = event.target;

                if (!(target instanceof Element)) {
                    return;
                }

                if (this.autoTrack.linkClicks) {
                    const linkElement = target.closest("a[href]");

                    if (linkElement instanceof HTMLAnchorElement) {
                        void this.track(
                            "link_click",
                            {
                                element: serializeElement(linkElement),
                                destination: linkElement.href,
                            },
                            {
                                transport: "keepalive",
                            },
                        ).catch((error) => {
                            this.log("Failed to send link_click", { error });
                        });

                        return;
                    }
                }

                if (this.autoTrack.buttonClicks) {
                    const buttonElement = target.closest("button, [role='button'], input[type='button'], input[type='submit']");

                    if (!(buttonElement instanceof Element)) {
                        return;
                    }

                    void this.track(
                        "button_click",
                        {
                            element: serializeElement(buttonElement),
                        },
                        {
                            transport: "keepalive",
                        },
                    ).catch((error) => {
                        this.log("Failed to send button_click", { error });
                    });
                }
            };

            document.addEventListener("click", handleClick, true);
            this.cleanupCallbacks.push(() => {
                document.removeEventListener("click", handleClick, true);
            });
        }
    }

    private buildBrowserContext(): BrowserContext {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return {
                url: "",
                path: "",
                title: "",
                referrer: "",
                userAgent: "",
                language: "",
                platform: "",
                screenWidth: null,
                screenHeight: null,
                viewportWidth: null,
                viewportHeight: null,
                pageType: "unknown",
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
            };
        }

        return {
            url: window.location.href,
            path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
            title: document.title,
            referrer: document.referrer,
            userAgent: window.navigator.userAgent,
            language: window.navigator.language,
            platform: window.navigator.platform,
            screenWidth: window.screen?.width ?? null,
            screenHeight: window.screen?.height ?? null,
            viewportWidth: window.innerWidth ?? null,
            viewportHeight: window.innerHeight ?? null,
            pageType: classifyPage(window.location.pathname),
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
        };
    }

    private async sendWithRetry(
        pendingEvent: PendingEvent,
        transport: TransportMode,
    ): Promise<void> {
        try {
            await this.sendEvent(pendingEvent.event, transport);
            this.clearRetry(pendingEvent.event.id);
        } catch (error) {
            if (!shouldRetry(error) || pendingEvent.retryCount >= this.maxRetries) {
                this.log("Dropping event after failed delivery", {
                    eventId: pendingEvent.event.id,
                    retryCount: pendingEvent.retryCount,
                    error,
                });

                throw error;
            }

            const nextRetryCount = pendingEvent.retryCount + 1;
            const delayMs = getRetryDelay(nextRetryCount);

            this.log("Retrying event delivery", {
                eventId: pendingEvent.event.id,
                nextRetryCount,
                delayMs,
            });

            await new Promise<void>((resolve, reject) => {
                const timeoutId = window.setTimeout(async () => {
                    this.retryTimeouts.delete(pendingEvent.event.id);

                    try {
                        await this.sendWithRetry(
                            {
                                event: pendingEvent.event,
                                retryCount: nextRetryCount,
                            },
                            transport,
                        );
                        resolve();
                    } catch (retryError) {
                        reject(retryError);
                    }
                }, delayMs);

                this.retryTimeouts.set(pendingEvent.event.id, timeoutId);
            });
        }
    }

    private async sendEvent(
        event: SegmentToContextEvent,
        transport: TransportMode,
    ): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/v1/sdk/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
            },
            body: JSON.stringify(event),
            keepalive: transport === "keepalive",
        });

        const payload = (await response.json().catch(() => null)) as
            | ApiAcceptedResponse
            | { message?: string }
            | null;

        if (!response.ok) {
            throw new SegmentToContextRequestError(
                payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
                    ? payload.message
                    : "Event delivery failed",
                response.status,
            );
        }

        this.log("Event delivered", {
            eventId: event.id,
            userId: event.userId,
            eventType: event.eventType,
            transport,
        });
    }

    private clearRetry(eventId: string) {
        const timeoutId = this.retryTimeouts.get(eventId);

        if (timeoutId) {
            window.clearTimeout(timeoutId);
            this.retryTimeouts.delete(eventId);
        }
    }

    private log(message: string, meta?: Record<string, unknown>) {
        if (!this.debug) {
            return;
        }

        console.info(`[segment-to-context] ${message}`, meta ?? {});
    }
}

export function createSegmentToContextClient(
    options: SegmentToContextClientOptions,
) {
    return new SegmentToContextClient(options);
}

function normalizeApiBaseUrl(apiBaseUrl: string) {
    return apiBaseUrl.replace(/\/+$/, "");
}

function normalizeAutoTrackOptions(autoTrack: AutoTrackOptions | undefined): Required<AutoTrackOptions> {
    return {
        pageViews: autoTrack?.pageViews ?? true,
        sessions: autoTrack?.sessions ?? true,
        buttonClicks: autoTrack?.buttonClicks ?? false,
        linkClicks: autoTrack?.linkClicks ?? false,
    };
}

function generateEventId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).slice(2, 10);

    return `${timestamp}-${random}`;
}

function generateSessionId() {
    return `sess_${generateEventId()}`;
}

function getRetryDelay(retryCount: number) {
    return RETRY_BASE_DELAY_MS * retryCount;
}

function shouldRetry(error: unknown) {
    if (!(error instanceof SegmentToContextRequestError)) {
        return true;
    }

    return error.statusCode >= 500;
}

function getOrCreateAnonymousUserId() {
    if (typeof window === "undefined") {
        return `anon_${generateEventId()}`;
    }

    const existingId = window.localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);

    if (existingId) {
        return existingId;
    }

    const nextId = `anon_${generateEventId()}`;
    window.localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, nextId);
    return nextId;
}

function classifyPage(pathname: string) {
    const normalizedPath = pathname.toLowerCase();

    if (normalizedPath === "/" || normalizedPath === "") {
        return "home";
    }

    if (normalizedPath.includes("/product")) {
        return "product";
    }

    if (normalizedPath.includes("/checkout")) {
        return "checkout";
    }

    if (normalizedPath.includes("/cart")) {
        return "cart";
    }

    if (normalizedPath.includes("/pricing")) {
        return "pricing";
    }

    return "content";
}

function enrichPayload(payload: EventPayload, browserContext: BrowserContext): EventPayload {
    return {
        ...payload,
        context: browserContext,
    };
}

function serializeElement(element: Element) {
    const textContent = element.textContent?.trim() ?? "";

    return {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        role: element.getAttribute("role"),
        name: element.getAttribute("name"),
        text: textContent.slice(0, 120) || null,
        classes: Array.from(element.classList).slice(0, 6),
        path: getElementPath(element),
    };
}

function getElementPath(element: Element) {
    const segments: string[] = [];
    let current: Element | null = element;

    while (current && segments.length < 4) {
        const segment = current.tagName.toLowerCase();
        segments.unshift(segment);
        current = current.parentElement;
    }

    return segments.join(" > ");
}

class SegmentToContextRequestError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
    }
}

export type {
    AutoTrackOptions,
    EventPayload,
    SegmentToContextClientOptions,
    TrackEventInput,
    TrackPageViewInput,
    TrackResult,
    TransportMode,
};
