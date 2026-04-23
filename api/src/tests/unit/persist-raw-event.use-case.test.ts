import { describe, expect, it, vi } from "vitest";
import { PersistRawEventUseCase } from "../../modules/events/application/use-cases/persist-raw-event.use-case";

describe("PersistRawEventUseCase", () => {
    it("persists a new raw event, publishes realtime, and triggers persona refresh", async () => {
        const eventRepository = {
            insert: vi.fn().mockResolvedValue(true),
        };

        const personaRefreshPublisher = {
            publish: vi.fn().mockResolvedValue("message-1"),
        };

        const realtimePublisher = {
            publishEventIngested: vi.fn().mockResolvedValue(undefined),
        };

        const useCase = new PersistRawEventUseCase(
            eventRepository as never,
            personaRefreshPublisher as never,
            realtimePublisher as never,
        );

        const result = await useCase.execute({
            id: "0f8fad5b-d9cb-469f-a165-70867728950e",
            tenantId: "t1",
            userId: "u1",
            eventType: "page_view",
            payload: { browser: "chrome" },
        });

        expect(result).toEqual({ duplicate: false });
        expect(eventRepository.insert).toHaveBeenCalledTimes(1);

        expect(realtimePublisher.publishEventIngested).toHaveBeenCalledWith({
            type: "event.ingested",
            tenantId: "t1",
            event: {
                id: "0f8fad5b-d9cb-469f-a165-70867728950e",
                userId: "u1",
                eventType: "page_view",
                payload: { browser: "chrome" },
                timestamp: expect.any(String),
            },
        });

        expect(personaRefreshPublisher.publish).toHaveBeenCalledWith(
            {
                tenantId: "t1",
                userId: "u1",
                triggeredByEventId: "0f8fad5b-d9cb-469f-a165-70867728950e",
                triggeredAt: expect.any(String),
            },
            {
                orderingKey: "t1:u1",
                attributes: {
                    tenantId: "t1",
                    userId: "u1",
                    eventId: "0f8fad5b-d9cb-469f-a165-70867728950e",
                },
            },
        );
    });

    it("returns duplicate=true and does not publish anything when insert is ignored", async () => {
        const eventRepository = {
            insert: vi.fn().mockResolvedValue(false),
        };

        const personaRefreshPublisher = {
            publish: vi.fn(),
        };

        const realtimePublisher = {
            publishEventIngested: vi.fn(),
        };

        const useCase = new PersistRawEventUseCase(
            eventRepository as never,
            personaRefreshPublisher as never,
            realtimePublisher as never,
        );

        const result = await useCase.execute({
            id: "0f8fad5b-d9cb-469f-a165-70867728950e",
            tenantId: "t1",
            userId: "u1",
            eventType: "page_view",
            payload: {},
        });

        expect(result).toEqual({ duplicate: true });
        expect(realtimePublisher.publishEventIngested).not.toHaveBeenCalled();
        expect(personaRefreshPublisher.publish).not.toHaveBeenCalled();
    });
});
