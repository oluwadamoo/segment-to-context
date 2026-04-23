import { AppDataSource } from "../db/data-source";
import type { RealtimePublisherPort } from "../../modules/realtime/application/ports/realtime-publisher.port";
import type {
    TenantEventStreamMessage,
    UserPersonaStreamMessage,
} from "../../modules/realtime/domain/realtime-message";
import { env } from "../../config/env";

export class PostgresRealtimePublisher implements RealtimePublisherPort {
    async publishEventIngested(message: TenantEventStreamMessage): Promise<void> {
        await AppDataSource.query(
            `SELECT pg_notify('${env.TENANT_EVENTS_CHANNEL}', $1)`,
            [JSON.stringify(message)],
        );
    }

    async publishPersonaUpdated(message: UserPersonaStreamMessage): Promise<void> {
        await AppDataSource.query(
            `SELECT pg_notify('${env.USER_PERSONAS_CHANNEL}', $1)`,
            [JSON.stringify(message)],
        );
    }
}
