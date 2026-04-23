import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../app/errors";
import { LoginTenantUseCase } from "../../modules/tenants/application/use-cases/login-tenant.use-case";

describe("LoginTenantWithApiKeyUseCase", () => {
    it("returns a JWT for a valid email and password combination", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue({
                id: "tenant-1",
                email: "tenant@example.com",
                passwordHash: "hashed-password",
                apiKeyHash: "hashed-api-key",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            }),
        };

        const passwordHasher = {
            verify: vi.fn().mockResolvedValue(true),
        };


        const tenantTokenService = {
            signAccessToken: vi.fn().mockReturnValue("jwt-token"),
        };

        const useCase = new LoginTenantUseCase(
            tenantRepository as never,
            passwordHasher as never,
            tenantTokenService as never,
        );

        const result = await useCase.execute({
            email: "tenant@example.com",
            password: "password123",
        });

        expect(tenantRepository.findByEmail).toHaveBeenCalledWith("tenant@example.com");
        expect(passwordHasher.verify).toHaveBeenCalledWith("password123", "hashed-password");
        expect(tenantTokenService.signAccessToken).toHaveBeenCalledWith({
            tenantId: "tenant-1",
            email: "tenant@example.com",
        });

        expect(result).toEqual({
            tenant: {
                id: "tenant-1",
                email: "tenant@example.com",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
            accessToken: "jwt-token",
        });
    });


    it("rejects when the email is wrong", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue(null),
        };

        const passwordHasher = {
            verify: vi.fn(),
        };

        const tenantTokenService = {
            signAccessToken: vi.fn(),
        };

        const useCase = new LoginTenantUseCase(
            tenantRepository as never,
            passwordHasher as never,
            tenantTokenService as never,
        );

        await expect(
            useCase.execute({
                email: "missing@example.com",
                password: "password123",
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(passwordHasher.verify).not.toHaveBeenCalled();
        expect(tenantTokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it("rejects when the email is correct but the password is wrong", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue({
                id: "tenant-1",
                email: "tenant@example.com",
                passwordHash: "hashed-password",
                apiKeyHash: "hashed-api-key",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            }),
        };

        const passwordHasher = {
            verify: vi.fn().mockResolvedValue(false),
        };

        const tenantTokenService = {
            signAccessToken: vi.fn(),
        };

        const useCase = new LoginTenantUseCase(
            tenantRepository as never,
            passwordHasher as never,
            tenantTokenService as never,
        );

        await expect(
            useCase.execute({
                email: "tenant@example.com",
                password: "wrong-password",
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(passwordHasher.verify).toHaveBeenCalledWith("wrong-password", "hashed-password");
        expect(tenantTokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it("rejects when the password might be valid for some account but the email is wrong", async () => {
        const tenantRepository = {
            findByEmail: vi.fn().mockResolvedValue(null),
        };

        const passwordHasher = {
            verify: vi.fn(),
        };

        const tenantTokenService = {
            signAccessToken: vi.fn(),
        };

        const useCase = new LoginTenantUseCase(
            tenantRepository as never,
            passwordHasher as never,
            tenantTokenService as never,
        );

        await expect(
            useCase.execute({
                email: "wrong@example.com",
                password: "correct-password-for-someone-else",
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(passwordHasher.verify).not.toHaveBeenCalled();
        expect(tenantTokenService.signAccessToken).not.toHaveBeenCalled();
    });
});

