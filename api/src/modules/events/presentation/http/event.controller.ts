import type { NextFunction, Request, Response } from "express";
import { EventIngestionSchema, PublicEventIngestionSchema } from "../../domain/event";
import { PublishRawEventUseCase } from "../../application/use-cases/publish-raw-event.use-case";
import { UnauthorizedError } from "../../../../app/errors";

export class EventController {
    constructor(private readonly publishRawEventUseCase: PublishRawEventUseCase) { }

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
}
