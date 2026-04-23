import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireTenantAuth } from "../../modules/tenants/presentation/http/require-tenant-auth";

describe("requireTenantAuth", () => {
    it("attaches authenticated tenant and calls next", () => {
        const tenantTokenService = {
            verifyAccessToken: vi.fn().mockReturnValue({
                tenantId: "tenant-1",
                email: "tenant@example.com",
            }),
        };

        const middleware = requireTenantAuth(tenantTokenService as never);

        const req = {
            header: vi.fn().mockReturnValue("Bearer jwt-token"),
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        middleware(req, res, next);

        expect(req.authenticatedTenant).toEqual({
            tenantId: "tenant-1",
            email: "tenant@example.com",
        });
        expect(next).toHaveBeenCalled();
    });

    it("returns 401 when bearer token is missing", () => {
        const middleware = requireTenantAuth({} as never);

        const req = {
            header: vi.fn().mockReturnValue(undefined),
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Missing bearer token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when token verification fails", () => {
        const tenantTokenService = {
            verifyAccessToken: vi.fn().mockImplementation(() => {
                throw new Error("Invalid access token");
            }),
        };

        const middleware = requireTenantAuth(tenantTokenService as never);

        const req = {
            header: vi.fn().mockReturnValue("Bearer broken-token"),
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Invalid access token",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
