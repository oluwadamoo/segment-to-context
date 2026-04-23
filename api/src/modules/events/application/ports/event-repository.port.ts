import type { IngestEventDTO, StoredEvent } from "../../domain/event";

export interface EventRepositoryPort {
    insert(event: IngestEventDTO): Promise<boolean>;
    getRecentUnprocessedByUser(input: {
        tenantId: string;
        userId: string;
        limit: number;
    }): Promise<StoredEvent[]>;
    markProcessed(eventIds: string[]): Promise<void>;
}
