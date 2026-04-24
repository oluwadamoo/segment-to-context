import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../app/errors";
import { EventController } from "../../modules/events/presentation/http/event.controller";

describe("EventController", () => {
    it("injects tenantId from the authenticated tenant", async () => {
        const publishRawEventUseCase = {
            execute: vi.fn().mockResolvedValue({
                eventId: "9f83b889-7486-406e-8271-9f1c7d99ab39",
                messageId: "msg-1",
            }),
        };
        const getEventHistoryUseCase = {
            execute: vi.fn(),
        };

        const controller = new EventController(
            publishRawEventUseCase as never,
            getEventHistoryUseCase as never,
        );

        const req = {
            body: {
                id: "9f83b889-7486-406e-8271-9f1c7d99ab39",
                userId: "2",
                eventType: "view",
                payload: {
                    browser: "chrome",
                },
            },
            authenticatedTenant: {
                tenantId: "tenant-123",
                email: "tenant@example.com",
            },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.ingestEvent(req, res, next);

        expect(publishRawEventUseCase.execute).toHaveBeenCalledWith({
            id: "9f83b889-7486-406e-8271-9f1c7d99ab39",
            tenantId: "tenant-123",
            userId: "2",
            eventType: "view",
            payload: {
                browser: "chrome",
            },
        });

        expect(res.status).toHaveBeenCalledWith(202);
        expect(res.json).toHaveBeenCalledWith({
            status: "accepted",
            eventId: "9f83b889-7486-406e-8271-9f1c7d99ab39",
            messageId: "msg-1",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards an UnauthorizedError when the tenant is missing", async () => {
        const controller = new EventController(
            { execute: vi.fn() } as never,
            { execute: vi.fn() } as never,
        );

        const req = {
            body: {
                id: "9f83b889-7486-406e-8271-9f1c7d99ab39",
                userId: "2",
                eventType: "view",
                payload: {},
            },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.ingestEvent(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("returns paginated tenant event history", async () => {
        const getEventHistoryUseCase = {
            execute: vi.fn().mockResolvedValue({
                items: [
                    {
                        id: "evt-1",
                        tenantId: "tenant-123",
                        userId: "2",
                        eventType: "purchase",
                        payload: { product: "Aurora Headphones" },
                        createdAt: new Date("2026-04-24T08:00:00.000Z"),
                        processed: true,
                    },
                ],
                nextCursor: {
                    createdAt: new Date("2026-04-24T08:00:00.000Z"),
                    id: "evt-1",
                },
            }),
        };

        const controller = new EventController(
            { execute: vi.fn() } as never,
            getEventHistoryUseCase as never,
        );

        const req = {
            query: {
                limit: "25",
            },
            authenticatedTenant: {
                tenantId: "tenant-123",
                email: "tenant@example.com",
            },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.getHistory(req, res, next);

        expect(getEventHistoryUseCase.execute).toHaveBeenCalledWith({
            tenantId: "tenant-123",
            limit: 25,
            cursor: undefined,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: {
                items: [
                    {
                        id: "evt-1",
                        tenantId: "tenant-123",
                        userId: "2",
                        eventType: "purchase",
                        payload: { product: "Aurora Headphones" },
                        createdAt: "2026-04-24T08:00:00.000Z",
                        processed: true,
                    },
                ],
                nextCursor: {
                    createdAt: "2026-04-24T08:00:00.000Z",
                    id: "evt-1",
                },
            },
        });
        expect(next).not.toHaveBeenCalled();
    });
});
