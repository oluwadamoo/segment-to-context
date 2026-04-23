import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../app/errors";
import { RealtimeController } from "../../modules/realtime/presentation/http/realtime.controller";

describe("RealtimeController", () => {
    it("opens the tenant event SSE stream and forwards incoming events", async () => {
        let closeHandler: (() => void) | undefined;
        let subscriptionCallback: ((message: unknown) => void) | undefined;

        const unsubscribe = vi.fn();

        const realtimeSubscriber = {
            subscribeToTenantEvents: vi.fn().mockImplementation((_tenantId, callback) => {
                subscriptionCallback = callback;
                return unsubscribe;
            }),
            subscribeToUserPersona: vi.fn(),
        };

        const controller = new RealtimeController(
            realtimeSubscriber as never,
            {} as never,
        );

        const req = {
            authenticatedTenant: {
                tenantId: "t1",
                email: "tenant@example.com",
            },
            on: vi.fn().mockImplementation((event: string, callback: () => void) => {
                if (event === "close") {
                    closeHandler = callback;
                }
            }),
        } as unknown as Request;

        const res = {
            setHeader: vi.fn(),
            flushHeaders: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.streamTenantEvents(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
        expect(res.write).toHaveBeenCalledWith("retry: 3000\n\n");
        expect(res.write).toHaveBeenCalledWith("event: connected\n");

        subscriptionCallback?.({
            type: "event.ingested",
            tenantId: "t1",
            event: {
                id: "e1",
                userId: "u1",
                eventType: "view",
                payload: { browser: "chrome" },
                timestamp: "2026-04-23T10:00:00.000Z",
            },
        });

        expect(res.write).toHaveBeenCalledWith("event: event.ingested\n");
        expect(next).not.toHaveBeenCalled();

        closeHandler?.();

        expect(unsubscribe).toHaveBeenCalled();
        expect(res.end).toHaveBeenCalled();
    });

    it("opens the user persona stream with an initial snapshot", async () => {
        let closeHandler: (() => void) | undefined;
        let subscriptionCallback: ((message: unknown) => void) | undefined;

        const unsubscribe = vi.fn();

        const realtimeSubscriber = {
            subscribeToTenantEvents: vi.fn(),
            subscribeToUserPersona: vi.fn().mockImplementation((_input, callback) => {
                subscriptionCallback = callback;
                return unsubscribe;
            }),
        };

        const getUserPersonaUseCase = {
            execute: vi.fn().mockResolvedValue({
                tenantId: "t1",
                userId: "u1",
                persona: {
                    personaType: "High-Intent buyer",
                    engagementScore: 82,
                    keyInterests: ["pricing"],
                    recommendedAction: "Offer trial",
                },
                lastUpdated: new Date("2026-04-23T10:00:00.000Z"),
            }),
        };

        const controller = new RealtimeController(
            realtimeSubscriber as never,
            getUserPersonaUseCase as never,
        );

        const req = {
            params: { userId: "u1" },
            authenticatedTenant: {
                tenantId: "t1",
                email: "tenant@example.com",
            },
            on: vi.fn().mockImplementation((event: string, callback: () => void) => {
                if (event === "close") {
                    closeHandler = callback;
                }
            }),
        } as unknown as Request;

        const res = {
            setHeader: vi.fn(),
            flushHeaders: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.streamUserPersona(req, res, next);

        expect(res.write).toHaveBeenCalledWith("event: persona.snapshot\n");

        subscriptionCallback?.({
            type: "persona.updated",
            tenantId: "t1",
            userId: "u1",
            persona: {
                personaType: "High-Intent buyer",
                engagementScore: 90,
                keyInterests: ["pricing", "plans"],
                recommendedAction: "Offer enterprise demo",
            },
            lastUpdated: "2026-04-23T10:01:00.000Z",
        });

        expect(res.write).toHaveBeenCalledWith("event: persona.updated\n");

        closeHandler?.();

        expect(unsubscribe).toHaveBeenCalled();
        expect(res.end).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards UnauthorizedError when tenant auth is missing", async () => {
        const controller = new RealtimeController(
            {} as never,
            {} as never,
        );

        const req = {
            on: vi.fn(),
        } as unknown as Request;

        const res = {
            setHeader: vi.fn(),
            flushHeaders: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.streamTenantEvents(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
