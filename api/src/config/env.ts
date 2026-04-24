import { config } from "dotenv";
import { z } from "zod";

config();

export const env = z.object({
    PORT: z.coerce.number().default(5300),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    GCP_PROJECT_ID: z.string().min(1),
    GCP_LOCATION: z.string().default("us-central1"),

    RAW_EVENTS_TOPIC: z.string().min(1),
    PERSONA_REFRESH_TOPIC: z.string().min(1),

    PUBSUB_PUSH_AUTH_ENABLED: z.coerce.boolean().default(false),
    PUBSUB_PUSH_AUDIENCE: z.string().min(1),
    PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL: z.string().email(),

    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.any().default("24h"),

    TENANT_EVENTS_CHANNEL: z.string().default("tenant_events_stream"),
    USER_PERSONAS_CHANNEL: z.string().default("user_personas_stream"),
}).parse(process.env);
