import { z } from "zod";

export const PublicEventIngestionSchema = z.object({
    id: z.uuid({ message: "Event ID must be a valid UUID" }),
    userId: z.string().min(1),
    eventType: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).default({}),
});

export const EventIngestionSchema = z.object({
    id: z.uuid({ message: "Event ID must be a valid UUID" }),
    tenantId: z.string().min(1),
    userId: z.string().min(1),
    eventType: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).default({}),
});

export type PublicIngestEventDTO = z.infer<typeof PublicEventIngestionSchema>;
export type IngestEventDTO = z.infer<typeof EventIngestionSchema>;

export type StoredEvent = IngestEventDTO & {
    createdAt: Date;
    processed: boolean;
};
