import type { PersonaProfile } from "../../persona/domain/persona";

export type TenantEventStreamMessage = {
    type: "event.ingested";
    tenantId: string;
    event: {
        id: string;
        userId: string;
        eventType: string;
        payload: Record<string, unknown>;
        timestamp: string;
    };
};

export type UserPersonaStreamMessage = {
    type: "persona.updated";
    tenantId: string;
    userId: string;
    persona: PersonaProfile;
    lastUpdated: string;
};