import { UnauthorizedError } from "../../../../app/errors";
import type { ApiKeyServicePort } from "../ports/api-key-service.port";
import type { TenantRepositoryPort } from "../ports/tenant-repository.port";
import type { AuthenticatedTenant } from "../../domain/tenant";

export class RotateTenantApiKeyUseCase {
    constructor(
        private readonly tenantRepository: TenantRepositoryPort,
        private readonly apiKeyService: ApiKeyServicePort,
    ) { }

    async execute(authenticatedTenant: AuthenticatedTenant) {
        const tenant = await this.tenantRepository.findById(authenticatedTenant.tenantId);

        if (!tenant) {
            throw new UnauthorizedError("Tenant not found");
        }

        const apiKey = this.apiKeyService.generate();
        const apiKeyHash = this.apiKeyService.hash(apiKey);

        await this.tenantRepository.updateApiKeyHash(tenant.id, apiKeyHash);

        return {
            apiKey,
        };
    }
}