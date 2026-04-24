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

export const EventHistoryQuerySchema = z
    .object({
        limit: z.coerce.number().int().min(1).max(50).default(25),
        cursorCreatedAt: z.iso.datetime().optional(),
        cursorId: z.string().min(1).optional(),
    })
    .superRefine((value, context) => {
        const hasCreatedAt = Boolean(value.cursorCreatedAt);
        const hasCursorId = Boolean(value.cursorId);

        if (hasCreatedAt !== hasCursorId) {
            context.addIssue({
                code: "custom",
                path: hasCreatedAt ? ["cursorId"] : ["cursorCreatedAt"],
                message: "cursorCreatedAt and cursorId must be provided together",
            });
        }
    });

export type PublicIngestEventDTO = z.infer<typeof PublicEventIngestionSchema>;
export type IngestEventDTO = z.infer<typeof EventIngestionSchema>;
export type EventHistoryQuery = z.infer<typeof EventHistoryQuerySchema>;

export type StoredEvent = IngestEventDTO & {
    createdAt: Date;
    processed: boolean;
};
