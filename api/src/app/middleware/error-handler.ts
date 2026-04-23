import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors";
import { logger } from "../../config/logger";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            status: "error",
            errors: error.flatten().fieldErrors,
        });
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message,
        });
    }

    logger.error("Unhandled application error", error);
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
}
