import { createServer } from "node:http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { buildProcessorApp } from "./app/builders";
// import { initializeDatabase } from "./infrastructure/db/data-source";

async function bootstrap() {
    // await initializeDatabase();

    const server = createServer(buildProcessorApp());

    const port = process.env.PORT || env.APP_PORT
    server.listen(port, () => {
        logger.info(`Processor service listening on  http://localhost:${port}`);
    });
}

bootstrap().catch((error) => {
    logger.error("Failed to start processor service", error);
    process.exit(1);
});
