import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../../config/env";
import { join } from "path";

const entities = [join(__dirname, "entities", "*.entity.{js,ts}")]


export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    migrationsRun: false,
    logging: false,
    entities,
    migrations: [join(__dirname, "migrations", "*.{js,ts}")],
});

export async function initializeDatabase() {
    if (AppDataSource.isInitialized) {
        return;
    }

    let attempt = 0;
    const maxAttempts = 10;

    while (!AppDataSource.isInitialized && attempt < maxAttempts) {
        try {
            await AppDataSource.initialize();

            await AppDataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
            await AppDataSource.runMigrations();

        } catch (error) {
            attempt += 1;
            console.warn(`DB init failed (attempt ${attempt})`, error);
            if (attempt >= maxAttempts) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}
