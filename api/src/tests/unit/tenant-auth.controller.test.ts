import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../app/errors";
import { TenantAuthController } from "../../modules/tenants/presentation/http/tenant.auth.controller";

describe("TenantAuthController", () => {
    it("returns 201 on signup", async () => {
        const controller = new TenantAuthController(
            {
                execute: vi.fn().mockResolvedValue({
                    tenant: { id: "t1", email: "tenant@example.com" },
                    apiKey: "stc_key",
                    accessToken: "jwt-token",
                }),
            } as never,
            {} as never,
            {} as never,
        );

        const req = {
            body: {
                email: "tenant@example.com",
                password: "password123",
            },
        } as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.signup(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: {
                tenant: { id: "t1", email: "tenant@example.com" },
                apiKey: "stc_key",
                accessToken: "jwt-token",
            },
        });
    });

    it("returns 200 on login with email and password", async () => {
        const controller = new TenantAuthController(
            {} as never,
            {
                execute: vi.fn().mockResolvedValue({
                    tenant: { id: "t1", email: "tenant@example.com" },
                    accessToken: "jwt-token",
                }),
            } as never,
            {} as never,
        );

        const req = {
            body: {
                email: "tenant@example.com",
                password: "password123"
            },
        } as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.login(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: {
                tenant: { id: "t1", email: "tenant@example.com" },
                accessToken: "jwt-token",
            },
        });
    });

    it("forwards UnauthorizedError when rotating without an authenticated tenant", async () => {
        const controller = new TenantAuthController(
            {} as never,
            {} as never,
            { execute: vi.fn() } as never,
        );

        const req = {} as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.rotateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
