import type { AuthenticatedTenant } from "../../domain/tenant";

export interface TenantTokenServicePort {
    signAccessToken(tenant: AuthenticatedTenant): string;
    verifyAccessToken(token: string): AuthenticatedTenant;
}
