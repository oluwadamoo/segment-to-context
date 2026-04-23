import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "../../app/errors";
import { SignupTenantUseCase } from "../../modules/tenants/application/use-cases/signup-tenant.use-case";

describe("SignupTenantUseCase", () => {
    it("creates a tenant, api key, and access token", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
                id: "tenant-1",
                email: "tenant@example.com",
                passwordHash: "hashed-password",
                apiKeyHash: "hashed-api-key",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            }),
        };

        const passwordHasher = {
            hash: vi.fn().mockResolvedValue("hashed-password"),
        };

        const apiKeyService = {
            generate: vi.fn().mockReturnValue("stc_api_key"),
            hash: vi.fn().mockReturnValue("hashed-api-key"),
        };

        const tenantTokenService = {
            signAccessToken: vi.fn().mockReturnValue("jwt-token"),
        };

        const useCase = new SignupTenantUseCase(
            tenantRepository as never,
            passwordHasher as never,
            apiKeyService as never,
            tenantTokenService as never,
        );

        const result = await useCase.execute({
            email: "tenant@example.com",
            password: "password123",
        });

        expect(result).toEqual({
            tenant: {
                id: "tenant-1",
                email: "tenant@example.com",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
            apiKey: "stc_api_key",
            accessToken: "jwt-token",
        });
    });

    it("throws when email already exists", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue({
                id: "tenant-1",
                email: "tenant@example.com",
            }),
        };

        const useCase = new SignupTenantUseCase(
            tenantRepository as never,
            {} as never,
            {} as never,
            {} as never,
        );

        await expect(
            useCase.execute({
                email: "tenant@example.com",
                password: "password123",
            }),
        ).rejects.toBeInstanceOf(ConflictError);
    });
});