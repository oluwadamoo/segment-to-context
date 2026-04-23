import { PubSub } from "@google-cloud/pubsub";
import type { MessagePublisherPort } from "../../../modules/shared/application/ports/message-publisher.port";
import { env } from "../../../config/env";

export class PubSubJsonPublisher<T> implements MessagePublisherPort<T> {
    private readonly topic;

    constructor(topicName: string) {
        const client = new PubSub({ projectId: env.GCP_PROJECT_ID });
        this.topic = client.topic(topicName, { messageOrdering: true });
    }

    async publish(
        message: T,
        options?: { orderingKey?: string; attributes?: Record<string, string> },
    ): Promise<string> {
        return this.topic.publishMessage({
            data: Buffer.from(JSON.stringify(message)),
            orderingKey: options?.orderingKey,
            attributes: options?.attributes,
        });
    }
}