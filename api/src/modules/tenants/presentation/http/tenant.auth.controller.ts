import type { NextFunction, Request, Response } from "express";
import {
    TenantLoginSchema,
    TenantSignupSchema,
} from "../../domain/tenant";
import { LoginTenantUseCase } from "../../application/use-cases/login-tenant.use-case";
import { RotateTenantApiKeyUseCase } from "../../application/use-cases/rotate-tenant-api-key.use-case";
import { SignupTenantUseCase } from "../../application/use-cases/signup-tenant.use-case";
import { UnauthorizedError } from "../../../../app/errors";


export class TenantAuthController {
    constructor(
        private readonly signupTenantUseCase: SignupTenantUseCase,
        private readonly loginTenantUseCase: LoginTenantUseCase,
        private readonly rotateTenantApiKeyUseCase: RotateTenantApiKeyUseCase,
    ) { }

    signup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const input = TenantSignupSchema.parse(req.body);
            const result = await this.signupTenantUseCase.execute(input);

            return res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const input = TenantLoginSchema.parse(req.body);
            const result = await this.loginTenantUseCase.execute(input);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    };

    rotateApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.authenticatedTenant) {
                throw new UnauthorizedError("Missing authenticated tenant");
            }

            const result = await this.rotateTenantApiKeyUseCase.execute(req.authenticatedTenant);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    };
}