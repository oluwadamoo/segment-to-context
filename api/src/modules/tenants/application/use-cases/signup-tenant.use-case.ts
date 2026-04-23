import { ConflictError } from "../../../../app/errors";
import type { ApiKeyServicePort } from "../ports/api-key-service.port";
import type { PasswordHasherPort } from "../ports/password-hasher.port";
import type { TenantRepositoryPort } from "../ports/tenant-repository.port";
import type { TenantTokenServicePort } from "../ports/tenant-token-service.port";
import { toTenantPublic } from "../ports/tenant-repository.port";
import type { TenantSignupDTO } from "../../domain/tenant";


export class SignupTenantUseCase {
    constructor(
        private readonly tenantRepository: TenantRepositoryPort,
        private readonly passwordHasher: PasswordHasherPort,
        private readonly apiKeyService: ApiKeyServicePort,
        private readonly tenantTokenService: TenantTokenServicePort,
    ) { }

    async execute(input: TenantSignupDTO) {
        const existingTenant = await this.tenantRepository.findByEmail(input.email);

        if (existingTenant) {
            throw new ConflictError("A tenant with this email already exists");
        }

        const passwordHash = await this.passwordHasher.hash(input.password);
        const apiKey = this.apiKeyService.generate();
        const apiKeyHash = this.apiKeyService.hash(apiKey);

        const tenant = await this.tenantRepository.create({
            email: input.email,
            passwordHash,
            apiKeyHash,
        });

        const accessToken = this.tenantTokenService.signAccessToken({
            tenantId: tenant.id,
            email: tenant.email,
        });

        return {
            tenant: toTenantPublic(tenant),
            apiKey,
            accessToken,
        };
    }
}