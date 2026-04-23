import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../../app/errors";
import { decodePushMessage } from "../../../shared/domain/pubsub";
import { EventIngestionSchema } from "../../domain/event";
import { PersistRawEventUseCase } from "../../application/use-cases/persist-raw-event.use-case";

export class RawEventsPushController {
    constructor(private readonly persistRawEventUseCase: PersistRawEventUseCase) {
    }

    handle = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const decodedBody = decodePushMessage<unknown>(req.body);

            const event = EventIngestionSchema.parse(decodedBody);
            const result = await this.persistRawEventUseCase.execute(event);



            return res.status(200).json({
                status: "ok",
                duplicate: result.duplicate,
            });
        } catch (error) {
            if (error instanceof SyntaxError) {
                return next(new BadRequestError("Pub/Sub message data is not valid JSON"));
            }

            return next(error);
        }
    };
}
