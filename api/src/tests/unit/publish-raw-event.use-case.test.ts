import { describe, expect, it, vi } from "vitest";
import { PublishRawEventUseCase } from "../../modules/events/application/use-cases/publish-raw-event.use-case";

describe("PublishRawEventUseCase", () => {
    it("publishes an incoming event to the raw events topic", async () => {
        const rawEventsPublisher = {
            publish: vi.fn().mockResolvedValue("message-1"),
        };

        const useCase = new PublishRawEventUseCase(rawEventsPublisher as never);

        const result = await useCase.execute({
            id: "0f8fad5b-d9cb-469f-a165-70867728950e",
            tenantId: "tenant-1",
            userId: "user-1",
            eventType: "page_view",
            payload: {},
        });

        expect(result).toEqual({
            eventId: "0f8fad5b-d9cb-469f-a165-70867728950e",
            messageId: "message-1",
        });
        expect(rawEventsPublisher.publish).toHaveBeenCalledTimes(1);
    });
});
