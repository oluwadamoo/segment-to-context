export type EventPayload = Record<string, unknown>;

export type TransportMode = "fetch" | "keepalive";

export type AutoTrackOptions = {
    pageViews?: boolean;
    sessions?: boolean;
    buttonClicks?: boolean;
    linkClicks?: boolean;
};

export type TrackEventInput = {
    userId?: string;
    eventId?: string;
    transport?: TransportMode;
};

export type TrackPageViewInput = {
    userId?: string;
    eventId?: string;
    transport?: TransportMode;
    payload?: EventPayload;
};

export type SegmentToContextClientOptions = {
    apiKey: string;
    userId?: string;
    maxRetries?: number;
    debug?: boolean;
    autoTrack?: AutoTrackOptions;
};

export type SegmentToContextEvent = {
    id: string;
    userId: string;
    eventType: string;
    payload: EventPayload;
};

export type TrackResult = {
    eventId: string;
};

export type ApiAcceptedResponse = {
    status: "accepted";
    eventId: string;
    messageId: string;
};

export type BrowserContext = {
    url: string;
    path: string;
    title: string;
    referrer: string;
    userAgent: string;
    language: string;
    platform: string;
    screenWidth: number | null;
    screenHeight: number | null;
    viewportWidth: number | null;
    viewportHeight: number | null;
    pageType: string;
    sessionId: string;
    timestamp: string;
};
