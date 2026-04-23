import type { TenantPublic, TenantRecord } from "../../domain/tenant";

export interface CreateTenantInput {
    email: string;
    passwordHash: string;
    apiKeyHash: string;
}


export interface TenantRepositoryPort {
    create(input: CreateTenantInput): Promise<TenantRecord>;
    findByEmail(email: string): Promise<TenantRecord | null>;
    findById(id: string): Promise<TenantRecord | null>;
    findByApiKeyHash(apiKeyHash: string): Promise<TenantRecord | null>;
    updateApiKeyHash(tenantId: string, apiKeyHash: string): Promise<void>;
}


export function toTenantPublic(tenant: TenantRecord): TenantPublic {
    return {
        id: tenant.id,
        email: tenant.email,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
    };
}