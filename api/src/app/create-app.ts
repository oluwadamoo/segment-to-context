import express, { Router } from "express";
import { errorHandler } from "./middleware/error-handler";

export function createApp(router: Router) {
    const app = express();

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

        if (req.method === "OPTIONS") {
            return res.sendStatus(204);
        }

        return next();
    });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use(errorHandler);

    return app;
}
