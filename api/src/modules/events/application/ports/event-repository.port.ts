import type { IngestEventDTO, StoredEvent } from "../../domain/event";

export interface EventHistoryCursor {
    createdAt: Date;
    id: string;
}

export interface EventHistoryPage {
    items: StoredEvent[];
    nextCursor: EventHistoryCursor | null;
}

export interface EventRepositoryPort {
    insert(event: IngestEventDTO): Promise<boolean>;
    listHistoryByTenant(input: {
        tenantId: string;
        limit: number;
        cursor?: EventHistoryCursor;
    }): Promise<EventHistoryPage>;
    getRecentUnprocessedByUser(input: {
        tenantId: string;
        userId: string;
        limit: number;
    }): Promise<StoredEvent[]>;
    markProcessed(eventIds: string[]): Promise<void>;
}
