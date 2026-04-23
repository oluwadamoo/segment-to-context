import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../../../app/errors";
import { GetUserPersonaUseCase } from "../../application/use-cases/get-user-persona.use-case";

export class PersonaController {
    constructor(private readonly getUserPersonaUseCase: GetUserPersonaUseCase) { }

    getByUserId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            const result = await this.getUserPersonaUseCase.execute({
                tenantId: req.authenticatedTenant.tenantId,
                userId: req.params.userId as unknown as string,
            });

            if (!result) {
                return res.status(404).json({
                    status: "error",
                    message: "Persona not found",
                });
            }

            return res.status(200).json({
                status: "success",
                data: {
                    tenantId: result.tenantId,
                    userId: result.userId,
                    persona: result.persona,
                    lastUpdated: result.lastUpdated.toISOString(),
                },
            });
        } catch (error) {
            return next(error);
        }
    };
}
