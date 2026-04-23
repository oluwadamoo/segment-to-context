import type { AuthenticatedTenant } from "../../modules/tenants/domain/tenant";

declare global {
    namespace Express {
        interface Request {
            authenticatedTenant?: AuthenticatedTenant;
        }
    }
}

export { };
