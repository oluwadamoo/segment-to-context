import { describe, expect, it, vi } from "vitest";
import { ProcessPersonaRefreshUseCase } from "../../modules/persona/application/use-cases/process-persona-refresh.use-case";

describe("ProcessPersonaRefreshUseCase", () => {
    it("builds persona, publishes realtime update, and marks events processed", async () => {
        const events = [
            {
                id: "e1",
                tenantId: "t1",
                userId: "u1",
                eventType: "page_view",
                payload: {},
                createdAt: new Date(),
                processed: false,
            },
        ];

        const eventRepository = {
            getRecentUnprocessedByUser: vi.fn().mockResolvedValue(events),
            markProcessed: vi.fn().mockResolvedValue(undefined),
        };

        const personaRepository = {
            upsert: vi.fn().mockResolvedValue(undefined),
        };

        const personaModel = {
            generateFromEvents: vi.fn().mockResolvedValue({
                personaType: "High-Intent buyer",
                engagementScore: 82,
                keyInterests: ["pricing"],
                recommendedAction: "Offer trial",
            }),
        };

        const realtimePublisher = {
            publishPersonaUpdated: vi.fn().mockResolvedValue(undefined),
        };

        const useCase = new ProcessPersonaRefreshUseCase(
            eventRepository as never,
            personaRepository as never,
            personaModel as never,
            realtimePublisher as never,
        );

        const result = await useCase.execute({ tenantId: "t1", userId: "u1" });

        expect(result).toEqual({ processedCount: 1 });

        expect(personaRepository.upsert).toHaveBeenCalledWith({
            tenantId: "t1",
            userId: "u1",
            persona: {
                personaType: "High-Intent buyer",
                engagementScore: 82,
                keyInterests: ["pricing"],
                recommendedAction: "Offer trial",
            },
        });

        expect(realtimePublisher.publishPersonaUpdated).toHaveBeenCalledWith({
            type: "persona.updated",
            tenantId: "t1",
            userId: "u1",
            persona: {
                personaType: "High-Intent buyer",
                engagementScore: 82,
                keyInterests: ["pricing"],
                recommendedAction: "Offer trial",
            },
            lastUpdated: expect.any(String),
        });

        expect(eventRepository.markProcessed).toHaveBeenCalledWith(["e1"]);
    });

    it("returns processedCount=0 and skips downstream work when there are no events", async () => {
        const eventRepository = {
            getRecentUnprocessedByUser: vi.fn().mockResolvedValue([]),
            markProcessed: vi.fn(),
        };

        const personaRepository = {
            upsert: vi.fn(),
        };

        const personaModel = {
            generateFromEvents: vi.fn(),
        };

        const realtimePublisher = {
            publishPersonaUpdated: vi.fn(),
        };

        const useCase = new ProcessPersonaRefreshUseCase(
            eventRepository as never,
            personaRepository as never,
            personaModel as never,
            realtimePublisher as never,
        );

        const result = await useCase.execute({ tenantId: "t1", userId: "u1" });

        expect(result).toEqual({ processedCount: 0 });
        expect(personaModel.generateFromEvents).not.toHaveBeenCalled();
        expect(personaRepository.upsert).not.toHaveBeenCalled();
        expect(realtimePublisher.publishPersonaUpdated).not.toHaveBeenCalled();
        expect(eventRepository.markProcessed).not.toHaveBeenCalled();
    });
});
