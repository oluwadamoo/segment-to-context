import { Client } from "pg";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type { RealtimeSubscriberPort } from "../../modules/realtime/application/ports/realtime-subscriber.port";
import type {
    TenantEventStreamMessage,
    UserPersonaStreamMessage,
} from "../../modules/realtime/domain/realtime-message";


type TenantEventCallback = (message: TenantEventStreamMessage) => void;
type UserPersonaCallback = (message: UserPersonaStreamMessage) => void;

export class PostgresRealtimeSubscriber implements RealtimeSubscriberPort {
    private readonly client = new Client({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
    });

    private readonly tenantEventSubscribers = new Map<string, Set<TenantEventCallback>>();
    private readonly userPersonaSubscribers = new Map<string, Set<UserPersonaCallback>>();
    private started = false;

    async start() {
        if (this.started) {
            return;
        }

        await this.client.connect();
        await this.client.query(`LISTEN ${env.TENANT_EVENTS_CHANNEL}`);
        await this.client.query(`LISTEN ${env.USER_PERSONAS_CHANNEL}`);

        this.client.on("notification", (notification) => {
            if (!notification.payload) {
                return;
            }

            try {
                if (notification.channel === env.TENANT_EVENTS_CHANNEL) {
                    const message = JSON.parse(notification.payload) as TenantEventStreamMessage;
                    const subscribers = this.tenantEventSubscribers.get(message.tenantId);

                    subscribers?.forEach((callback) => callback(message));
                    return;
                }

                if (notification.channel === env.USER_PERSONAS_CHANNEL) {
                    const message = JSON.parse(notification.payload) as UserPersonaStreamMessage;
                    const subscriberKey = this.getUserPersonaKey(message.tenantId, message.userId);
                    const subscribers = this.userPersonaSubscribers.get(subscriberKey);

                    subscribers?.forEach((callback) => callback(message));
                }
            } catch (error) {
                logger.error("Failed to process realtime notification", error);
            }
        });

        this.client.on("error", (error) => {
            logger.error("Postgres realtime subscriber error", error);
        });

        this.started = true;
    }

    async stop() {
        if (!this.started) {
            return;
        }

        await this.client.end();
        this.started = false;
    }

    subscribeToTenantEvents(
        tenantId: string,
        onMessage: TenantEventCallback,
    ): () => void {
        const existingSubscribers = this.tenantEventSubscribers.get(tenantId) ?? new Set<TenantEventCallback>();
        existingSubscribers.add(onMessage);
        this.tenantEventSubscribers.set(tenantId, existingSubscribers);

        return () => {
            const subscribers = this.tenantEventSubscribers.get(tenantId);

            if (!subscribers) {
                return;
            }

            subscribers.delete(onMessage);

            if (subscribers.size === 0) {
                this.tenantEventSubscribers.delete(tenantId);
            }
        };
    }

    subscribeToUserPersona(
        input: { tenantId: string; userId: string },
        onMessage: UserPersonaCallback,
    ): () => void {
        const key = this.getUserPersonaKey(input.tenantId, input.userId);
        const existingSubscribers = this.userPersonaSubscribers.get(key) ?? new Set<UserPersonaCallback>();
        existingSubscribers.add(onMessage);
        this.userPersonaSubscribers.set(key, existingSubscribers);

        return () => {
            const subscribers = this.userPersonaSubscribers.get(key);

            if (!subscribers) {
                return;
            }

            subscribers.delete(onMessage);

            if (subscribers.size === 0) {
                this.userPersonaSubscribers.delete(key);
            }
        };
    }

    private getUserPersonaKey(tenantId: string, userId: string) {
        return `${tenantId}:${userId}`;
    }
}
