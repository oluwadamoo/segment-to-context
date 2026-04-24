import { createServer } from "node:http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { buildProcessorApp } from "./app/builders";
import { initializeDatabase } from "./infrastructure/db/data-source";

async function bootstrap() {
    await initializeDatabase();

    const server = createServer(buildProcessorApp());

    server.listen(env.PORT, () => {
        logger.info(`Processor service listening on  http://localhost:${env.PORT}`);
    });
}

bootstrap().catch((error) => {
    logger.error("Failed to start processor service", error);
    process.exit(1);
});
