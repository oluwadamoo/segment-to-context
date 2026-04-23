import { UnauthorizedError } from "../../../../app/errors";
import type { TenantRepositoryPort } from "../ports/tenant-repository.port";
import type { TenantTokenServicePort } from "../ports/tenant-token-service.port";
import { toTenantPublic } from "../ports/tenant-repository.port";
import type { TenantLoginDTO } from "../../domain/tenant";
import { PasswordHasherPort } from "../ports/password-hasher.port";

export class LoginTenantUseCase {
    constructor(
        private readonly tenantRepository: TenantRepositoryPort,
        private readonly passwordHasher: PasswordHasherPort,
        private readonly tenantTokenService: TenantTokenServicePort,
    ) { }

    async execute(input: TenantLoginDTO) {
        const tenant = await this.tenantRepository.findByEmail(input.email);

        if (!tenant) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const passwordMatches = await this.passwordHasher.verify(
            input.password,
            tenant.passwordHash,
        );

        if (!passwordMatches) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const accessToken = this.tenantTokenService.signAccessToken({
            tenantId: tenant.id,
            email: tenant.email,
        });

        return {
            tenant: toTenantPublic(tenant),
            accessToken,
        };
    }
}