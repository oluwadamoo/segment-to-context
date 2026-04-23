import request from "supertest";
import { Router } from "express";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app/create-app";

describe("GET /health", () => {
    it("returns ok", async () => {
        const router = Router();
        router.get("/health", (_req, res) => {
            res.status(200).json({ status: "ok" });
        });

        const app = createApp(router);
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});
