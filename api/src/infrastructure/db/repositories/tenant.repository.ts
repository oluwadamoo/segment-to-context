import type {
    CreateTenantInput,
    TenantRepositoryPort,
} from "../../../modules/tenants/application/ports/tenant-repository.port";
import type { TenantRecord } from "../../../modules/tenants/domain/tenant";
import { AppDataSource } from "../data-source";
import { TenantEntity } from "../entities/tenant.entity";

export class TenantRepository implements TenantRepositoryPort {
    private readonly repo = AppDataSource.getRepository(TenantEntity);

    async create(input: CreateTenantInput): Promise<TenantRecord> {
        const tenant = this.repo.create({
            email: input.email,
            passwordHash: input.passwordHash,
            apiKeyHash: input.apiKeyHash,
        });

        const savedTenant = await this.repo.save(tenant);

        return this.toTenantRecord(savedTenant);
    }

    async findByEmail(email: string): Promise<TenantRecord | null> {
        const tenant = await this.repo.findOne({ where: { email } });
        return tenant ? this.toTenantRecord(tenant) : null;
    }

    async findById(id: string): Promise<TenantRecord | null> {
        const tenant = await this.repo.findOne({ where: { id } });
        return tenant ? this.toTenantRecord(tenant) : null;
    }

    async findByApiKeyHash(apiKeyHash: string): Promise<TenantRecord | null> {
        const tenant = await this.repo.findOne({ where: { apiKeyHash } });
        return tenant ? this.toTenantRecord(tenant) : null;
    }

    async updateApiKeyHash(tenantId: string, apiKeyHash: string): Promise<void> {
        await this.repo.update({ id: tenantId }, { apiKeyHash });
    }

    private toTenantRecord(tenant: TenantEntity): TenantRecord {
        return {
            id: tenant.id,
            email: tenant.email,
            passwordHash: tenant.passwordHash,
            apiKeyHash: tenant.apiKeyHash,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
        };
    }
}
