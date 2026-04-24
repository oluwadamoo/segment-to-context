import { In } from "typeorm";
import type { EventRepositoryPort } from "../../../modules/events/application/ports/event-repository.port";
import type {
    IngestEventDTO,
    StoredEvent,
} from "../../../modules/events/domain/event";
import { AppDataSource } from "../data-source";
import { EventEntity } from "../entities/event.entity";

export class EventRepository implements EventRepositoryPort {
    private readonly repo = AppDataSource.getRepository(EventEntity);

    async insert(event: IngestEventDTO): Promise<boolean> {
        const result = await this.repo
            .createQueryBuilder()
            .insert()
            .into(EventEntity)
            .values({
                id: event.id,
                tenantId: event.tenantId,
                userId: event.userId,
                eventType: event.eventType,
                payload: event.payload as Record<string, any>,
                processed: false,
            })
            .orIgnore()
            .returning(["id"])
            .execute();

        return result.raw.length > 0;
    }

    async listHistoryByTenant(input: {
        tenantId: string;
        limit: number;
        cursor?: {
            createdAt: Date;
            id: string;
        };
    }) {
        const query = this.repo
            .createQueryBuilder("event")
            .where("event.tenant_id = :tenantId", { tenantId: input.tenantId });

        if (input.cursor) {
            query.andWhere(
                `(event.created_at < :cursorCreatedAt OR (event.created_at = :cursorCreatedAt AND event.id < :cursorId))`,
                {
                    cursorCreatedAt: input.cursor.createdAt,
                    cursorId: input.cursor.id,
                },
            );
        }

        const records = await query
            .orderBy("event.created_at", "DESC")
            .addOrderBy("event.id", "DESC")
            .take(input.limit + 1)
            .getMany();

        const hasMore = records.length > input.limit;
        const items = hasMore ? records.slice(0, input.limit) : records;
        const lastItem = items[items.length - 1];

        return {
            items,
            nextCursor: hasMore && lastItem
                ? {
                    createdAt: lastItem.createdAt,
                    id: lastItem.id,
                }
                : null,
        };
    }

    async getRecentUnprocessedByUser(input: {
        tenantId: string;
        userId: string;
        limit: number;
    }): Promise<StoredEvent[]> {
        return this.repo.find({
            where: {
                tenantId: input.tenantId,
                userId: input.userId,
                processed: false,
            },
            order: { createdAt: "DESC" },
            take: input.limit,
        });
    }

    async markProcessed(eventIds: string[]): Promise<void> {
        if (eventIds.length === 0) return;

        await this.repo.update(
            { id: In(eventIds) },
            { processed: true },
        );
    }
}
