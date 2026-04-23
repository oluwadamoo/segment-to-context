import type { NextFunction, Request, Response } from "express";
import { ApiKeyServicePort } from "../../application/ports/api-key-service.port";
import { TenantRepositoryPort } from "../../application/ports/tenant-repository.port";

export function requireTenantApiKey(tenantRepository: TenantRepositoryPort, apiKeyService: ApiKeyServicePort) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.header("x-api-key");

        if (!apiKey) {
            return res.status(401).json({
                status: "error",
                message: "Missing api key",
            });
        }

        try {
            const apiKeyHash = apiKeyService.hash(apiKey);
            const tenant = await tenantRepository.findByApiKeyHash(apiKeyHash);

            if (!tenant) {
                return res.status(401).json({
                    status: "error",
                    message: "Invalid write key",
                });
            }

            req.authenticatedTenant = {
                tenantId: tenant.id,
                email: tenant.email,
            };

            return next();


        } catch (error) {
            return next(error);
        }
    }
}
