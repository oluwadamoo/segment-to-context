import { createHash, randomBytes } from "node:crypto";
import type { ApiKeyServicePort } from "../../modules/tenants/application/ports/api-key-service.port";

export class TenantApiKeyService implements ApiKeyServicePort {
    generate(): string {
        return `stc_${randomBytes(24).toString("hex")}`;
    }

    hash(apiKey: string): string {
        return createHash("sha256").update(apiKey).digest("hex");
    }
}
