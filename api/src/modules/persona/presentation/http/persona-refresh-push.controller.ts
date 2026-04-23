import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../../app/errors";
import { decodePushMessage } from "../../../shared/domain/pubsub";
import type { PersonaRefreshMessage } from "../../domain/persona-refresh-message";
import { ProcessPersonaRefreshUseCase } from "../../application/use-cases/process-persona-refresh.use-case";

export class PersonaRefreshPushController {
    constructor(private readonly processPersonaRefreshUseCase: ProcessPersonaRefreshUseCase) { }

    handle = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const decodedBody = decodePushMessage<PersonaRefreshMessage>(req.body);

            await this.processPersonaRefreshUseCase.execute({
                tenantId: decodedBody.tenantId,
                userId: decodedBody.userId,
            });

            return res.status(200).json({ status: "ok" });
        } catch (error) {
            if (error instanceof SyntaxError) {
                return next(new BadRequestError("Pub/Sub message data is not valid JSON"));
            }

            return next(error);
        }
    };
}
