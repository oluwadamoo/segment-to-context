import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../../../app/errors";
import type { RealtimeSubscriberPort } from "../../application/ports/realtime-subscriber.port";
import { openSseStream, writeSseEvent } from "./sse";
import { GetUserPersonaUseCase } from "../../../persona/application/use-cases/get-user-persona.use-case";


export class RealtimeController {
    constructor(
        private readonly realtimeSubscriber: RealtimeSubscriberPort,
        private readonly getUserPersonaUseCase: GetUserPersonaUseCase,
    ) { }


    streamTenantEvents = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            openSseStream(res);

            writeSseEvent(
                res,
                {
                    event: "connected",
                    data: { stream: "events" }
                }
            )


            const unsubscribe = this.realtimeSubscriber.subscribeToTenantEvents(
                req.authenticatedTenant.tenantId,
                (message) => {
                    writeSseEvent(res, {
                        event: message.type,
                        data: message,
                    });
                },
            );

            const heartbeat = setInterval(() => {
                writeSseEvent(res, {
                    event: "heartbeat",
                    data: { ts: new Date().toISOString() },
                });
            }, 15000);

            req.on("close", () => {
                clearInterval(heartbeat);
                unsubscribe();
                res.end();
            });

        } catch (error) {
            return next(error);
        }
    }


    streamUserPersona = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            const userId = req.params.userId as unknown as string;

            openSseStream(res);

            const existingPersona = await this.getUserPersonaUseCase.execute({
                tenantId: req.authenticatedTenant.tenantId,
                userId,
            });

            if (existingPersona) {
                writeSseEvent(res, {
                    event: "persona.snapshot",
                    data: {
                        tenantId: existingPersona.tenantId,
                        userId: existingPersona.userId,
                        persona: existingPersona.persona,
                        lastUpdated: existingPersona.lastUpdated.toISOString(),
                    },
                });
            } else {
                writeSseEvent(res, {
                    event: "persona.snapshot",
                    data: null,
                });
            }

            const unsubscribe = this.realtimeSubscriber.subscribeToUserPersona(
                {
                    tenantId: req.authenticatedTenant.tenantId,
                    userId,
                },
                (message) => {
                    writeSseEvent(res, {
                        event: message.type,
                        data: message,
                    });
                },
            );

            const heartbeat = setInterval(() => {
                writeSseEvent(res, {
                    event: "heartbeat",
                    data: { ts: new Date().toISOString() },
                });
            }, 15000);

            req.on("close", () => {
                clearInterval(heartbeat);
                unsubscribe();
                res.end();
            });
        } catch (error) {
            return next(error);
        }
    };
}