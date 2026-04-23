import type { EventRepositoryPort } from "../ports/event-repository.port";
import type { IngestEventDTO } from "../../domain/event";
import type { MessagePublisherPort } from "../../../shared/application/ports/message-publisher.port";
import type { PersonaRefreshMessage } from "../../../persona/domain/persona-refresh-message";
import { userOrderingKey } from "../../../shared/domain/pubsub";
import { RealtimePublisherPort } from "../../../realtime/application/ports/realtime-publisher.port";

export class PersistRawEventUseCase {
    constructor(
        private readonly eventRepository: EventRepositoryPort,
        private readonly personaRefreshPublisher: MessagePublisherPort<PersonaRefreshMessage>,
        private readonly realtimePublisher: RealtimePublisherPort,
    ) { }

    async execute(event: IngestEventDTO) {
        const inserted = await this.eventRepository.insert(event);


        if (!inserted) {
            return { duplicate: true };
        }

        await this.realtimePublisher.publishEventIngested({
            type: "event.ingested",
            tenantId: event.tenantId,
            event: {
                id: event.id,
                userId: event.userId,
                eventType: event.eventType,
                payload: event.payload,
                timestamp: new Date().toISOString(),
            },
        });

        await this.personaRefreshPublisher.publish(
            {
                tenantId: event.tenantId,
                userId: event.userId,
                triggeredByEventId: event.id,
                triggeredAt: new Date().toISOString(),
            },
            {
                orderingKey: userOrderingKey(event),
                attributes: {
                    tenantId: event.tenantId,
                    userId: event.userId,
                    eventId: event.id,
                },
            },
        );

        return { duplicate: false };
    }
}
