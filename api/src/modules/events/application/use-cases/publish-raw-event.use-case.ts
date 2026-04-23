import type { IngestEventDTO } from "../../domain/event";
import type { MessagePublisherPort } from "../../../shared/application/ports/message-publisher.port";
import { userOrderingKey } from "../../../shared/domain/pubsub";

export class PublishRawEventUseCase {
    constructor(private readonly rawEventsPublisher: MessagePublisherPort<IngestEventDTO>) { }

    async execute(event: IngestEventDTO) {
        const messageId = await this.rawEventsPublisher.publish(event, {
            orderingKey: userOrderingKey(event),
            attributes: {
                tenantId: event.tenantId,
                userId: event.userId,
                eventId: event.id,
            },
        });

        return { eventId: event.id, messageId };
    }
}
