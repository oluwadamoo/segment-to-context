import express, { Router } from "express";
import { errorHandler } from "./middleware/error-handler";

export function createApp(router: Router) {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use(errorHandler);

    return app;
}
