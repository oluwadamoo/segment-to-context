import type { NextFunction, Request, Response } from "express";
import type { TenantTokenServicePort } from "../../application/ports/tenant-token-service.port";

export function requireTenantAuth(tenantTokenService: TenantTokenServicePort) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authorizationHeader = req.header("authorization");

        if (!authorizationHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Missing bearer token",
            });
        }

        try {
            const token = authorizationHeader.slice("Bearer ".length);
            const authenticatedTenant = tenantTokenService.verifyAccessToken(token);

            req.authenticatedTenant = authenticatedTenant;

            return next();
        } catch (error: unknown) {
            return res.status(401).json({
                status: "error",
                message: error instanceof Error ? error.message : "Invalid access token",
            });
        }
    };
}
