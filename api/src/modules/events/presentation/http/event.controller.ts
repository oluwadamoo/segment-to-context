import type { NextFunction, Request, Response } from "express";
import {
    EventHistoryQuerySchema,
    EventIngestionSchema,
    PublicEventIngestionSchema,
} from "../../domain/event";
import { PublishRawEventUseCase } from "../../application/use-cases/publish-raw-event.use-case";
import { GetEventHistoryUseCase } from "../../application/use-cases/get-event-history.use-case";
import { UnauthorizedError } from "../../../../app/errors";

export class EventController {
    constructor(
        private readonly publishRawEventUseCase: PublishRawEventUseCase,
        private readonly getEventHistoryUseCase: GetEventHistoryUseCase,
    ) { }

    ingestEvent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            const input = PublicEventIngestionSchema.parse(req.body);


            const event = EventIngestionSchema.parse({
                ...input,
                tenantId: req.authenticatedTenant.tenantId
            })

            console.log(event, "EVENT...")

            const result = await this.publishRawEventUseCase.execute(event);

            return res.status(202).json({
                status: "accepted",
                eventId: result.eventId,
                messageId: result.messageId,
            });
        } catch (error) {
            return next(error);

        }
    };

    getHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            const query = EventHistoryQuerySchema.parse(req.query);
            const result = await this.getEventHistoryUseCase.execute({
                tenantId: req.authenticatedTenant.tenantId,
                limit: query.limit,
                cursor: query.cursorCreatedAt && query.cursorId
                    ? {
                        createdAt: new Date(query.cursorCreatedAt),
                        id: query.cursorId,
                    }
                    : undefined,
            });

            return res.status(200).json({
                status: "success",
                data: {
                    items: result.items.map((item) => ({
                        id: item.id,
                        tenantId: item.tenantId,
                        userId: item.userId,
                        eventType: item.eventType,
                        payload: item.payload,
                        createdAt: item.createdAt.toISOString(),
                        processed: item.processed,
                    })),
                    nextCursor: result.nextCursor
                        ? {
                            createdAt: result.nextCursor.createdAt.toISOString(),
                            id: result.nextCursor.id,
                        }
                        : null,
                },
            });
        } catch (error) {
            return next(error);
        }
    };
}
