import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../../app/errors";
import { env } from "../../config/env";
import type { TenantTokenServicePort } from "../../modules/tenants/application/ports/tenant-token-service.port";
import type { AuthenticatedTenant } from "../../modules/tenants/domain/tenant";

type TenantJwtPayload = JwtPayload & {
    email?: string;
    type?: string;
};

export class JwtTenantTokenService implements TenantTokenServicePort {
    signAccessToken(tenant: AuthenticatedTenant): string {
        return jwt.sign(
            {
                email: tenant.email,
                type: "tenant-access",
            },
            env.JWT_SECRET,
            {
                subject: tenant.tenantId,
                expiresIn: env.JWT_EXPIRES_IN
            }
        )

    }

    verifyAccessToken(token: string): AuthenticatedTenant {
        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as TenantJwtPayload;

            if (payload.type !== "tenant-access" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
                throw new UnauthorizedError("Invalid access token");
            }

            return {
                tenantId: payload.sub,
                email: payload.email,
            };
        } catch {
            throw new UnauthorizedError("Invalid access token");
        }
    }
}
