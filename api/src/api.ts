import { createServer } from "node:http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { buildApiApp } from "./app/builders";
// import { initializeDatabase } from "./infrastructure/db/data-source";
import { PostgresRealtimeSubscriber } from "./infrastructure/realtime/postgres-realtime-subscriber";

async function bootstrap() {
    // await initializeDatabase();

    const realtimeSubscriber = new PostgresRealtimeSubscriber();
    await realtimeSubscriber.start();

    const server = createServer(buildApiApp(realtimeSubscriber));

    const port = process.env.PORT || env.APP_PORT
    server.listen(port, () => {
        logger.info(`Api service listening on http://localhost:${port}`);
    });

    const shutdown = async () => {
        await realtimeSubscriber.stop();
        server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
    logger.error("Failed to start api service", error);
    process.exit(1);
});