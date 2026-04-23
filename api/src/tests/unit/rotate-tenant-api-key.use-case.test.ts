import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../app/errors";
import { RotateTenantApiKeyUseCase } from "../../modules/tenants/application/use-cases/rotate-tenant-api-key.use-case";

describe("RotateTenantApiKeyUseCase", () => {
    it("rotates and persists a new api key", async () => {
        const tenantRepository = {
            findById: vi.fn().mockResolvedValue({
                id: "tenant-1",
                email: "tenant@example.com",
            }),
            updateApiKeyHash: vi.fn().mockResolvedValue(undefined),
        };

        const apiKeyService = {
            generate: vi.fn().mockReturnValue("stc_new_key"),
            hash: vi.fn().mockReturnValue("hashed-new-key"),
        };

        const useCase = new RotateTenantApiKeyUseCase(
            tenantRepository as never,
            apiKeyService as never,
        );

        const result = await useCase.execute({
            tenantId: "tenant-1",
            email: "tenant@example.com",
        });

        expect(result).toEqual({ apiKey: "stc_new_key" });
        expect(tenantRepository.updateApiKeyHash).toHaveBeenCalledWith("tenant-1", "hashed-new-key");
    });

    it("throws when the authenticated tenant cannot be found", async () => {
        const tenantRepository = {
            findById: vi.fn().mockResolvedValue(null),
            updateApiKeyHash: vi.fn(),
        };

        const apiKeyService = {
            generate: vi.fn(),
            hash: vi.fn(),
        };

        const useCase = new RotateTenantApiKeyUseCase(
            tenantRepository as never,
            apiKeyService as never,
        );

        await expect(
            useCase.execute({
                tenantId: "tenant-404",
                email: "tenant@example.com",
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(apiKeyService.generate).not.toHaveBeenCalled();
        expect(tenantRepository.updateApiKeyHash).not.toHaveBeenCalled();
    });
});
