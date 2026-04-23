import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../app/errors";
import { PersonaController } from "../../modules/persona/presentation/http/persona.controller";

describe("PersonaController", () => {
    it("returns a persona by user id", async () => {
        const controller = new PersonaController({
            execute: vi.fn().mockResolvedValue({
                tenantId: "t1",
                userId: "u1",
                persona: {
                    personaType: "High-Intent buyer",
                    engagementScore: 82,
                    keyInterests: ["pricing"],
                    recommendedAction: "Offer trial",
                },
                lastUpdated: new Date("2026-04-23T08:00:00.000Z"),
            }),
        } as never);

        const req = {
            params: { userId: "u1" },
            authenticatedTenant: {
                tenantId: "t1",
                email: "tenant@example.com",
            },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.getByUserId(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: {
                tenantId: "t1",
                userId: "u1",
                persona: {
                    personaType: "High-Intent buyer",
                    engagementScore: 82,
                    keyInterests: ["pricing"],
                    recommendedAction: "Offer trial",
                },
                lastUpdated: "2026-04-23T08:00:00.000Z",
            },
        });
    });

    it("returns 404 when persona is not found", async () => {
        const controller = new PersonaController({
            execute: vi.fn().mockResolvedValue(null),
        } as never);

        const req = {
            params: { userId: "u404" },
            authenticatedTenant: {
                tenantId: "t1",
                email: "tenant@example.com",
            },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.getByUserId(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Persona not found",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards UnauthorizedError when tenant is missing", async () => {
        const controller = new PersonaController({
            execute: vi.fn(),
        } as never);

        const req = {
            params: { userId: "u1" },
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;

        const next = vi.fn();

        await controller.getByUserId(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
